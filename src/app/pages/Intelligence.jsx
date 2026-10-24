import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { api } from '../../api/client.js';
import { navigate } from '../../router.js';
import { useAuth } from '../auth.jsx';
import { useWorkspace } from '../Shell.jsx';
import { Card, PageHeader, Button, Field, Input, Select, Textarea, Table, StatusPill, Badge, Modal, Alert, Async, Stat, Tabs, Empty, useAsync, useAction, money, dt, d, label } from '../ui.jsx';
import { BarChart, Waterfall, StackedRows } from '../charts.jsx';
import { VehicleWorkspace, MembershipWorkspace, EconomicsTable, Definitions, BandBadge, pctText, LedgerTable } from './IntelWorkspace.jsx';

const BASE = '/membership-intelligence';
const BANDS = ['GREEN', 'YELLOW', 'ORANGE', 'RED'];
const GROUPS = ['plan', 'location', 'serviceCategory', 'cohort', 'period', 'membership', 'vehicle', 'ro'];
const keyed = (rows = []) => rows.map((r, i) => ({ _k: i, ...r }));
const Pager = ({ page, total, limit, onPage }) => (total > limit ? (
  <div className="row between small" style={{ marginTop: 8 }}>
    <span className="faint">{(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</span>
    <div className="row"><Button size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button><Button size="sm" disabled={page * limit >= total} onClick={() => onPage(page + 1)}>Next</Button></div>
  </div>
) : null);

const Filters = ({ f, setF }) => {
  const { can } = useAuth();
  const plans = useAsync(() => api.get('/membership-plans', { includeRetired: true }).then(r => r.plans), []);
  return (
    <div className="row wrap" style={{ marginBottom: 12 }}>
      <Input type="date" value={f.from} onChange={e => setF(x => ({ ...x, from: e.target.value }))} style={{ width: 160 }} aria-label="From" />
      <Input type="date" value={f.to} onChange={e => setF(x => ({ ...x, to: e.target.value }))} style={{ width: 160 }} aria-label="To" />
      {can('economics:corporate') && <Select value={f.scope} options={[{ value: 'all', label: 'All locations' }, { value: 'location', label: 'Current location' }]} onChange={e => setF(x => ({ ...x, scope: e.target.value }))} style={{ width: 'auto' }} />}
      <Select value={f.planId} placeholder="All plans" options={(plans.data || []).map(p => ({ value: p.planId, label: p.name }))} onChange={e => setF(x => ({ ...x, planId: e.target.value }))} style={{ width: 'auto' }} />
    </div>
  );
};

// ---------------------------------------------------------------------------------------------
const Portfolio = ({ q }) => {
  const s = useAsync(() => Promise.all([api.get(`${BASE}/portfolio`, q), api.get(`${BASE}/portfolio/trends`, q), api.get(`${BASE}/portfolio/breakdown`, { ...q, groupBy: 'serviceCategory' })]), [JSON.stringify(q)]);
  return (
    <Async state={s}>{([p, trends, cats]) => {
      const t = p.totals;
      if (!t) return <Empty title="No economic events in this period" hint="Events are posted from invoices, payments, issued parts and clocked time. Administrators can backfill existing records in Settings." />;
      const y365 = p.forecastExposure.find(e => e.days === 365);
      return (
        <div className="stack">
          <div className="grid-4">
            <Stat label="Active members" value={p.activeMembers} hint={p.retention.ratePct != null ? `Retention ${p.retention.ratePct}% (${p.retention.stillActiveAtEnd}/${p.retention.activeAtStart})` : 'Retention: no members at period start'} />
            <Stat label="Membership revenue" value={money(t.membershipRevenueCents)} hint={`Payments ${money(t.membershipPaymentsCents)}`} />
            <Stat label="Service revenue (customer-pay)" value={money(t.serviceRevenueCents)} hint={`Credits/refunds ${money(t.creditsRefundsCents)}`} />
            <Stat label="Retail value delivered" value={money(t.eligibleRetailValueCents)} hint={`Customer savings ${money(t.customerSavingsCents)}`} />
            <Stat label="Total cost" value={money(t.totalCostCents)} hint={`Parts ${money(t.partsCostCents)} · labor ${money(t.laborCostCents)} · overhead ${money(t.overheadCents)}`} />
            <Stat label="Net profit" value={money(t.netProfitCents)} hint={`Margin ${pctText(t.realizedMarginPct)}${t.verified ? '' : ` · ${t.incompleteEvents} unknown input(s)`}`} />
            <Stat label="Utilization index" value={t.utilizationIndex ?? '—'} hint={t.utilizationIndex == null ? 'Configure plan cost baselines' : `Expected cost ${money(t.expectedDirectCostCents)}`} />
            <Stat label="Projected 365-day exposure" value={y365 ? money(y365.expectedDirectCostCents) : '—'} hint={`Interventions ${p.interventions.completionPct ?? '—'}% complete · ${p.openAlerts} open alerts`} />
          </div>
          <div className="grid-2">
            <Card title="Monthly membership revenue vs service cost vs net profit"><BarChart data={trends.rows} x="key" series={[{ key: 'membershipRevenueCents', label: 'Membership revenue' }, { key: 'totalCostCents', label: 'Service cost', color: 'var(--warn)' }, { key: 'netProfitCents', label: 'Net profit', color: 'var(--ok)' }]} /></Card>
            <Card title="Customer-paid vs membership-covered service value"><BarChart stacked data={trends.rows.map(r => ({ ...r, covered: r.customerSavingsCents }))} x="key" series={[{ key: 'serviceRevenueCents', label: 'Customer-paid' }, { key: 'covered', label: 'Covered by membership', color: 'var(--violet)' }]} /></Card>
            <Card title="Cost composition by month"><BarChart stacked data={trends.rows} x="key" series={[{ key: 'partsCostCents', label: 'Parts' }, { key: 'laborCostCents', label: 'Labor', color: 'var(--orange)' }, { key: 'otherDirectCostCents', label: 'Sublet & other', color: 'var(--violet)' }, { key: 'overheadCents', label: 'Overhead', color: 'var(--muted)' }]} /></Card>
            <Card title="Cost by service category"><BarChart stacked data={cats.rows.slice(0, 12)} x="label" series={[{ key: 'partsCostCents', label: 'Parts' }, { key: 'laborCostCents', label: 'Labor', color: 'var(--orange)' }, { key: 'otherDirectCostCents', label: 'Other', color: 'var(--violet)' }]} /></Card>
          </div>
          <Card title="Profitability bridge">
            <Waterfall steps={[
              { label: 'Membership revenue', value: t.membershipRevenueCents }, { label: 'Service revenue', value: t.serviceRevenueCents }, { label: 'Other revenue', value: t.otherRevenueCents },
              { label: 'Credits refunds', value: t.creditsRefundsCents }, { label: 'Parts cost', value: -t.partsCostCents }, { label: 'Labor cost', value: -t.laborCostCents },
              { label: 'Other direct', value: -t.otherDirectCostCents }, { label: 'Overhead', value: -t.overheadCents }, { label: 'Net profit', value: t.netProfitCents, total: true }
            ]} />
            <Definitions defs={p.definitions} />
            <div className="small faint">Engine {p.engineVersion} · configuration {p.configIsDefault ? 'defaults (none published)' : `v${p.configVersion}`} · data quality: {Object.entries(t.dataQuality).map(([k, v]) => `${k} ${v}`).join(', ')}</div>
          </Card>
          {p.forecastExposure.length > 0 && <Card title="Forecast service-cost exposure (latest assessments)"><Table rows={p.forecastExposure} rowKey="days" columns={[{ label: 'Horizon', render: x => `${x.days} days` }, { label: 'Expected direct cost', right: true, render: x => money(x.expectedDirectCostCents) }, { label: 'Vehicles', right: true, render: x => x.vehicles }]} /><div className="small faint">Estimates from the rules-based baseline, not actual results.</div></Card>}
        </div>
      );
    }}</Async>
  );
};

const Breakdown = ({ q }) => {
  const [groupBy, setGroupBy] = useState('plan');
  const [page, setPage] = useState(1);
  const s = useAsync(() => api.get(`${BASE}/portfolio/breakdown`, { ...q, groupBy, page, limit: 50 }), [groupBy, page, JSON.stringify(q)]);
  const drill = { vehicle: r => navigate(`#/app/intelligence/vehicle/${r.key}`), membership: r => navigate(`#/app/intelligence/membership/${r.key}`), ro: r => navigate(`#/app/ro/${r.key}`) }[groupBy];
  return (
    <Card title="Profitability breakdown" actions={<Select value={groupBy} options={GROUPS.map(g => ({ value: g, label: label(g) }))} onChange={e => { setGroupBy(e.target.value); setPage(1); }} style={{ width: 'auto' }} />}>
      <Async state={s}>{data => <>
        <EconomicsTable rows={data.rows.map(r => ({ ...r, key: r.key ?? '' }))} groupBy={groupBy} onRow={drill ? r => r.key && drill(r) : undefined} />
        <Pager page={page} total={data.total} limit={50} onPage={setPage} />
        <Definitions defs={data.definitions} />
      </>}</Async>
    </Card>
  );
};

const Cohorts = ({ q }) => {
  const s = useAsync(() => api.get(`${BASE}/portfolio/cohorts`, q), [JSON.stringify(q)]);
  return (
    <Card title="Customer cohorts (by membership start month)">
      <Async state={s}>{data => <Table rows={data.cohorts} rowKey="cohort" empty="No memberships yet" columns={[
        { label: 'Cohort', render: c => c.cohort }, { label: 'Started', right: true, render: c => c.started }, { label: 'Active', right: true, render: c => c.active },
        { label: 'Cancelled', right: true, render: c => c.cancelled }, { label: 'Expired', right: true, render: c => c.expired }, { label: 'Retention', right: true, render: c => pctText(c.retentionPct) },
        { label: 'Revenue', right: true, render: c => money(c.economics?.revenueCents || 0) }, { label: 'Net profit', right: true, render: c => money(c.economics?.netProfitCents || 0) },
        { label: 'Margin', right: true, render: c => pctText(c.economics?.realizedMarginPct ?? null) }, { label: 'Savings', right: true, render: c => money(c.economics?.customerSavingsCents || 0) }
      ]} />}</Async>
    </Card>
  );
};

const Risk = ({ q }) => {
  const { can } = useAuth();
  const [run, busy] = useAction();
  const [rf, setRf] = useState({ band: '', profitabilityState: '', page: 1 });
  const b = useAsync(() => api.get(`${BASE}/risk/breakdown`, { locationId: q.locationId }), [q.locationId]);
  const s = useAsync(() => api.get(`${BASE}/risk-queue`, { ...rf, locationId: q.locationId, planId: q.planId, limit: 25 }), [JSON.stringify(rf), q.locationId, q.planId]);
  return (
    <div className="stack">
      <Alert tone="info">Rules-based baseline (no trained model). Scores and forecasts are estimates with stated confidence; they never change coverage, approvals or safety obligations.</Alert>
      <Async state={b}>{data => (
        <div className="grid-3">
          <Card title="Profitability states"><StackedRows rows={[{ key: 'all', label: 'Assessed vehicles', ...data.profitabilityStates }]} keys={BANDS} /></Card>
          <Card title="Member risk by location"><StackedRows rows={data.byLocation} keys={BANDS} /></Card>
          <Card title="Member risk by plan"><StackedRows rows={data.byPlan} keys={BANDS} /></Card>
        </div>
      )}</Async>
      <Card title="Risk queue" actions={<>
        <Select value={rf.band} placeholder="Any band" options={BANDS} onChange={e => setRf(x => ({ ...x, band: e.target.value, page: 1 }))} style={{ width: 'auto' }} />
        <Select value={rf.profitabilityState} placeholder="Any state" options={BANDS} onChange={e => setRf(x => ({ ...x, profitabilityState: e.target.value, page: 1 }))} style={{ width: 'auto' }} />
        {can('interventions:manage') && <Button size="sm" loading={busy} onClick={() => run(() => api.post(`${BASE}/risk/refresh`), 'Risk refresh queued')}><RefreshCw size={13} />Refresh all</Button>}
      </>}>
        <Async state={s}>{data => <>
          <div className="ft-scroll-x"><Table rows={data.items} empty="No assessments yet" onRowClick={x => navigate(`#/app/intelligence/vehicle/${x.vehicleId}`)} columns={[
            { label: 'Vehicle', render: x => (x.vehicle ? `${x.vehicle.year} ${x.vehicle.make} ${x.vehicle.model}` : x.vehicleId.slice(0, 8)) },
            { label: 'Customer', render: x => x.customer?.name || '—' },
            { label: 'Score', right: true, render: x => x.score }, { label: 'Band', render: x => <BandBadge band={x.override?.band || x.band} /> },
            { label: 'Profitability', render: x => <BandBadge band={x.override?.profitabilityState || x.profitabilityState} /> },
            { label: 'Confidence', render: x => <StatusPill status={x.confidence} /> }, { label: 'Top driver', render: x => <span className="small">{x.drivers[0]?.explanation || '—'}</span> },
            { label: '365-day cost', right: true, render: x => { const h = x.horizons.find(z => z.days === 365); return h ? money(h.expectedDirectCostCents) : '—'; } },
            { label: 'Alerts', right: true, render: x => (x.openAlerts ? <Badge tone="warn">{x.openAlerts}</Badge> : '—') }, { label: 'Assessed', render: x => d(x.generatedAt) }
          ]} /></div>
          <Pager page={rf.page} total={data.total} limit={25} onPage={p => setRf(x => ({ ...x, page: p }))} />
        </>}</Async>
      </Card>
    </div>
  );
};

const Alerts = ({ q }) => {
  const { can } = useAuth();
  const [run, busy] = useAction();
  const [af, setAf] = useState({ status: 'open,acknowledged', page: 1 });
  const [edit, setEdit] = useState(null);
  const s = useAsync(() => api.get(`${BASE}/alerts`, { ...af, locationId: q.locationId, limit: 50 }), [JSON.stringify(af), q.locationId]);
  const save = () => run(async () => {
    if (edit.createIntervention) await api.post(`${BASE}/interventions`, { alertId: edit.id, kind: edit.kind, recommendedAction: edit.recommendation || edit.title });
    if (edit.next !== edit.status || edit.note) await api.patch(`${BASE}/alerts/${edit.id}`, { status: edit.next !== edit.status ? edit.next : undefined, note: edit.note || undefined, falsePositive: edit.falsePositive });
    setEdit(null); s.reload();
  }, 'Alert updated');
  return (
    <Card title="Alerts" actions={<Select value={af.status} options={[{ value: 'open,acknowledged', label: 'Open' }, { value: 'resolved,dismissed', label: 'Closed' }]} onChange={e => setAf({ status: e.target.value, page: 1 })} style={{ width: 'auto' }} />}>
      <Async state={s}>{data => <>
        <Table rows={data.alerts} empty="No alerts" onRowClick={can('interventions:manage') ? a => setEdit({ ...a, next: a.status, note: '', kind: 'manager_case_review' }) : undefined} columns={[
          { label: 'Severity', render: a => <Badge tone={a.severity === 'critical' ? 'danger' : a.severity === 'warning' ? 'warn' : 'info'}>{a.severity}</Badge> },
          { label: 'Alert', render: a => <div><strong>{a.title}</strong><div className="small faint">{label(a.trigger)} · {a.recommendation}</div></div> },
          { label: 'Subject', render: a => (a.vehicle ? <a href={`#/app/intelligence/vehicle/${a.vehicleId}`} onClick={e => e.stopPropagation()}>{a.vehicle.year} {a.vehicle.make} {a.vehicle.model}</a> : a.membershipId ? <a href={`#/app/intelligence/membership/${a.membershipId}`} onClick={e => e.stopPropagation()}>Membership</a> : '—') },
          { label: 'Sources', render: a => <span className="small faint">{a.sourceRefs.map(r => r.type).join(', ') || '—'}</span> },
          { label: 'Owner', render: a => a.owner?.name || '—' }, { label: 'Raised', render: a => dt(a.createdAt) }, { label: 'Status', render: a => <StatusPill status={a.status} /> },
          { label: 'Intervention', render: a => (a.interventionId ? <Badge tone="info">linked</Badge> : '—') }
        ]} />
        <Pager page={af.page} total={data.total} limit={50} onPage={p => setAf(x => ({ ...x, page: p }))} />
      </>}</Async>
      <Modal open={Boolean(edit)} title="Alert" onClose={() => setEdit(null)} footer={<Button variant="primary" loading={busy} onClick={save}>Save</Button>}>
        <p><strong>{edit?.title}</strong></p>
        <div className="small muted">{edit?.recommendation}</div>
        <Field label="Status"><Select value={edit?.next} options={['open', 'acknowledged', 'resolved', 'dismissed']} onChange={e => setEdit(x => ({ ...x, next: e.target.value }))} /></Field>
        {edit?.next === 'dismissed' && <label className="row small"><input type="checkbox" checked={Boolean(edit.falsePositive)} onChange={e => setEdit(x => ({ ...x, falsePositive: e.target.checked }))} /> Not a real issue (counts toward the false-alert rate)</label>}
        {!edit?.interventionId && <label className="row small"><input type="checkbox" checked={Boolean(edit?.createIntervention)} onChange={e => setEdit(x => ({ ...x, createIntervention: e.target.checked }))} /> Create an intervention</label>}
        {edit?.createIntervention && <Field label="Intervention type"><Select value={edit.kind} options={['preventive_service', 'diagnostic_recheck', 'parts_preorder', 'manager_case_review', 'billing_remediation', 'customer_education', 'pricing_review', 'location_process_review'].map(k => ({ value: k, label: label(k) }))} onChange={e => setEdit(x => ({ ...x, kind: e.target.value }))} /></Field>}
        <Field label={['resolved', 'dismissed'].includes(edit?.next) ? 'Note (required)' : 'Note'}><Textarea value={edit?.note || ''} onChange={e => setEdit(x => ({ ...x, note: e.target.value }))} /></Field>
        {edit?.history?.length > 0 && <div className="small faint">{edit.history.map((h, i) => <div key={i}>{dt(h.at)} · {h.from ? `${h.from} → ${h.to}` : ''} {h.note}</div>)}</div>}
      </Modal>
    </Card>
  );
};

const Interventions = ({ q }) => {
  const { can } = useAuth();
  const { locationId } = useWorkspace();
  const [run, busy] = useAction();
  const [iv, setIv] = useState({ status: 'open,in_progress', page: 1 });
  const [edit, setEdit] = useState(null);
  const s = useAsync(() => api.get(`${BASE}/interventions`, { ...iv, locationId: q.locationId, limit: 50 }), [JSON.stringify(iv), q.locationId]);
  const results = useAsync(() => api.get(`${BASE}/portfolio/interventions`, q), [JSON.stringify(q)]);
  const staff = useAsync(() => (can('interventions:manage') ? api.get('/users', { locationId }).then(r => r.users) : Promise.resolve([])), [locationId]);
  const closing = ['resolved', 'dismissed'].includes(edit?.next);
  return (
    <div className="stack">
      <Card title="Intervention queue" actions={<Select value={iv.status} options={[{ value: 'open,in_progress', label: 'Open' }, { value: 'resolved,dismissed', label: 'Closed' }]} onChange={e => setIv({ status: e.target.value, page: 1 })} style={{ width: 'auto' }} />}>
        <Async state={s}>{data => <>
          <Table rows={data.interventions} empty="No interventions" onRowClick={can('interventions:manage') ? x => setEdit({ ...x, next: x.status, note: '', result: x.outcome?.result || '', avoided: '' }) : undefined} columns={[
            { label: 'Action', render: x => <div><strong>{x.recommendedAction}</strong><div className="small faint">{x.reason}</div></div> },
            { label: 'Vehicle', render: x => (x.vehicle ? <a href={`#/app/intelligence/vehicle/${x.vehicleId}`} onClick={e => e.stopPropagation()}>{x.vehicle.year} {x.vehicle.make} {x.vehicle.model}</a> : '—') },
            { label: 'Type', render: x => label(x.kind) }, { label: 'Priority', render: x => <StatusPill status={x.priority} /> },
            { label: 'Owner', render: x => x.owner?.name || <span className="faint">Unassigned</span> }, { label: 'Due', render: x => d(x.dueAt) }, { label: 'Status', render: x => <StatusPill status={x.status} /> },
            { label: 'Outcome', render: x => (x.outcome?.result ? label(x.outcome.result) : '—') }
          ]} />
          <Pager page={iv.page} total={data.total} limit={50} onPage={p => setIv(x => ({ ...x, page: p }))} />
        </>}</Async>
      </Card>
      <Async state={results}>{r => (
        <div className="grid-2">
          <Card title="Intervention results"><Table rows={r.interventions} rowKey="kind" empty="No interventions in this period" columns={[
            { label: 'Type', render: x => label(x.kind) }, { label: 'Total', right: true, render: x => x.total }, { label: 'Resolved', right: true, render: x => x.resolved },
            { label: 'Completion', right: true, render: x => pctText(x.completionPct) }, { label: 'Avg days', right: true, render: x => x.avgDaysToClose ?? '—' },
            { label: 'Avoided cost (est.)', right: true, render: x => money(x.avoidedCostEstimateCents) }
          ]} /><div className="small faint">{r.note}</div></Card>
          <Card title="Alert accuracy"><Table rows={r.alerts} rowKey="trigger" empty="No alerts in this period" columns={[
            { label: 'Trigger', render: x => label(x.trigger) }, { label: 'Total', right: true, render: x => x.total }, { label: 'Resolved', right: true, render: x => x.resolved },
            { label: 'Dismissed', right: true, render: x => x.dismissed }, { label: 'False-alert rate', right: true, render: x => pctText(x.falsePositivePct) }
          ]} /></Card>
        </div>
      )}</Async>
      <Modal open={Boolean(edit)} title="Update intervention" onClose={() => setEdit(null)} footer={<Button variant="primary" loading={busy} onClick={() => run(async () => {
        await api.patch(`${BASE}/interventions/${edit.id}`, {
          status: edit.next !== edit.status ? edit.next : undefined, ownerId: edit.ownerId || null, note: edit.note || undefined,
          resolutionNotes: closing ? edit.note : undefined,
          outcome: edit.result ? { result: edit.result, avoidedCostEstimateCents: edit.avoided ? Math.round(Number(edit.avoided) * 100) : null } : undefined
        });
        setEdit(null); s.reload(); results.reload();
      }, 'Intervention updated')}>Save</Button>}>
        <p><strong>{edit?.recommendedAction}</strong></p>
        <div className="grid-2">
          <Field label="Status"><Select value={edit?.next} options={['open', 'in_progress', 'resolved', 'dismissed']} onChange={e => setEdit(x => ({ ...x, next: e.target.value }))} /></Field>
          <Field label="Owner"><Select value={edit?.ownerId || ''} placeholder="Unassigned" options={(staff.data || []).map(u => ({ value: u.id, label: `${u.name} (${u.role})` }))} onChange={e => setEdit(x => ({ ...x, ownerId: e.target.value }))} /></Field>
          <Field label={edit?.next === 'resolved' ? 'Outcome (required)' : 'Outcome'}><Select value={edit?.result || ''} placeholder="—" options={['completed', 'customer_declined', 'no_effect', 'not_applicable'].map(k => ({ value: k, label: label(k) }))} onChange={e => setEdit(x => ({ ...x, result: e.target.value }))} /></Field>
          <Field label="Avoided cost estimate ($, optional)"><Input type="number" min="0" step="0.01" value={edit?.avoided || ''} onChange={e => setEdit(x => ({ ...x, avoided: e.target.value }))} /></Field>
        </div>
        <div className="small faint">Avoided-cost figures are estimates and are never reported as realized savings.</div>
        <Field label={closing ? 'Outcome notes (required)' : 'Note'}><Textarea value={edit?.note || ''} onChange={e => setEdit(x => ({ ...x, note: e.target.value }))} /></Field>
        {edit?.history?.length > 0 && <div className="small faint">{edit.history.map((h, i) => <div key={i}>{dt(h.at)} · {h.from ? `${h.from} → ${h.to}` : ''} {h.note}</div>)}</div>}
      </Modal>
    </div>
  );
};

const Diagnostics = ({ q }) => {
  const s = useAsync(() => api.get(`${BASE}/portfolio/diagnostics`, q), [JSON.stringify(q)]);
  return (
    <Async state={s}>{data => (
      <div className="stack">
        <div className="grid-2">
          <Card title="Trouble codes recorded per month"><BarChart data={data.monthly} x="month" unit="number" series={[{ key: 'codes', label: 'Codes recorded' }]} /></Card>
          <Card title="Code status distribution"><BarChart data={data.statusDistribution.map(x => ({ ...x, status: label(x.status || 'unknown') }))} x="status" unit="number" series={[{ key: 'n', label: 'Occurrences', color: 'var(--violet)' }]} /></Card>
        </div>
        <div className="grid-2">
          <Card title="Most frequent codes" actions={<Badge tone="danger">{data.recurrenceAfterFixAlerts} returned after fix</Badge>}><Table rows={data.topCodes} rowKey="code" empty="No codes in this period" columns={[{ label: 'Code', render: c => <span className="mono">{c.code}</span> }, { label: 'Occurrences', right: true, render: c => c.occurrences }, { label: 'Vehicles', right: true, render: c => c.vehicles }, { label: '', render: c => (c.repeatOnSameVehicle ? <Badge tone="warn">repeats</Badge> : null) }]} /></Card>
          <Card title="Measurements by parameter"><Table rows={data.measurements} rowKey="parameter" empty="No measurements in this period" columns={[{ label: 'Parameter', render: m => m.parameter }, { label: 'Readings', right: true, render: m => m.readings }, { label: 'Pass', right: true, render: m => m.pass }, { label: 'Fail', right: true, render: m => m.fail }, { label: 'Fail rate', right: true, render: m => pctText(m.failRatePct) }]} /></Card>
        </div>
      </div>
    )}</Async>
  );
};

const Monitoring = () => {
  const s = useAsync(() => api.get(`${BASE}/monitoring`), []);
  return (
    <Async state={s}>{m => (
      <div className="stack">
        <div className="grid-4">
          <Stat label="Event processing delay" value={`${m.processingDelaySeconds}s`} hint="Oldest due background job" />
          <Stat label="Job latency" value={m.latencyMs ? `${Math.round(m.latencyMs.median)} ms` : '—'} hint={m.latencyMs ? `p95 ${Math.round(m.latencyMs.p95)} ms` : 'No completed jobs'} />
          <Stat label="Events (30 days)" value={m.eventsLast30Days.inserted} hint={`${m.eventsLast30Days.duplicatesRejected} duplicates rejected`} />
          <Stat label="Stale risk snapshots" value={m.staleSnapshots ?? '—'} hint="Older than 2 days" />
          <Stat label="Unknown-value events (1 yr)" value={m.unknownQualityEvents} />
          <Stat label="False-alert rate" value={pctText(m.falseAlertRatePct)} />
          <Stat label="Reconciliation (90 days)" value={m.reconciliation.ok ? 'Balanced' : 'Differences'} hint={`${m.reconciliation.missingInvoices.length} invoice(s) missing from ledger`} />
          <Stat label="Forecast samples" value={m.forecastAccuracy?.samples ?? '—'} hint={m.forecastAccuracy?.note} />
        </div>
        <Card title="Reconciliation: source records vs ledger, detail vs aggregates">
          <Table rows={keyed([...m.reconciliation.source, ...m.reconciliation.aggregates])} rowKey="_k" columns={[{ label: 'Check', render: c => c.check }, { label: 'Expected', right: true, render: c => money(c.sourceCents) }, { label: 'Ledger', right: true, render: c => money(c.ledgerCents) }, { label: 'Difference', right: true, render: c => money(c.differenceCents) }, { label: '', render: c => <Badge tone={c.ok ? 'ok' : 'danger'}>{c.ok ? 'OK' : 'Mismatch'}</Badge> }]} />
          {m.reconciliation.missingInvoices.length > 0 && <div className="small">Not yet in ledger: {m.reconciliation.missingInvoices.map(i => i.invoiceNumber).join(', ')} — run the backfill or check failed jobs.</div>}
        </Card>
        {m.forecastAccuracy && <Card title={`Forecast accuracy (${m.forecastAccuracy.horizonDays}-day horizon)`}>
          <div className="small muted">{m.forecastAccuracy.note}</div>
          <div className="grid-2"><Table rows={m.forecastAccuracy.byModel} rowKey="modelVersion" empty="—" columns={[{ label: 'Model', render: x => x.modelVersion }, { label: 'Samples', right: true, render: x => x.samples }, { label: 'Mean abs. error', right: true, render: x => money(x.meanAbsErrorCents) }, { label: 'Bias', right: true, render: x => money(x.meanBiasCents) }]} />
            <Table rows={m.forecastAccuracy.byConfidence} rowKey="confidence" empty="—" columns={[{ label: 'Confidence', render: x => label(x.confidence) }, { label: 'Samples', right: true, render: x => x.samples }, { label: 'Mean abs. error', right: true, render: x => money(x.meanAbsErrorCents) }, { label: 'Bias', right: true, render: x => money(x.meanBiasCents) }]} /></div>
        </Card>}
        <div className="grid-2">
          <Card title="Background jobs (30 days)"><Table rows={keyed(m.jobs)} rowKey="_k" empty="No jobs" columns={[{ label: 'Type', render: j => <span className="mono small">{j.type}</span> }, { label: 'Status', render: j => <StatusPill status={j.status} /> }, { label: 'Count', right: true, render: j => j.count }]} /></Card>
          <Card title="Failed or retrying jobs"><Table rows={m.failedJobs} empty="None" columns={[{ label: 'Type', render: j => <span className="mono small">{j.type}</span> }, { label: 'Attempts', right: true, render: j => j.attempts }, { label: 'Error', render: j => <span className="small">{j.lastError}</span> }]} /></Card>
        </div>
        <Card title="Recent recalculations"><Table rows={m.recentRecalculations} empty="None" columns={[{ label: 'When', render: a => dt(a.createdAt) }, { label: 'Result', render: a => <span className="small">{a.action}</span> }]} /></Card>
      </div>
    )}</Async>
  );
};

const Adjustments = () => {
  const { can, user } = useAuth();
  const [run, busy] = useAction();
  const [status, setStatus] = useState('pending');
  const [form, setForm] = useState(null);
  const s = useAsync(() => api.get(`${BASE}/adjustments`, { status }), [status]);
  const ledger = useAsync(() => (can('economics:location') || can('economics:corporate') ? api.get(`${BASE}/ledger`, { limit: 50 }) : Promise.resolve(null)), []);
  const decide = (a, approve) => {
    const note = window.prompt(approve ? 'Approval note' : 'Reason for rejection');
    if (note) run(async () => { await api.post(`${BASE}/adjustments/${a.id}/decision`, { approve, note }); s.reload(); ledger.reload(); }, approve ? 'Approved and posted' : 'Rejected');
  };
  return (
    <div className="stack">
      <Card title="Manual economic adjustments" actions={<>
        <Select value={status} options={['pending', 'approved', 'rejected']} onChange={e => setStatus(e.target.value)} style={{ width: 'auto' }} />
        {can('economics:adjust') && <Button size="sm" variant="primary" onClick={() => setForm({ type: 'other_direct_cost', amount: '', reason: '', locationId: '', roId: '', reversesEventId: '' })}>Request adjustment</Button>}
      </>}>
        <Alert tone="info">Adjustments are posted to the ledger only after a second person approves them. Errors are corrected with compensating entries; history is never edited.</Alert>
        <Async state={s}>{rows => <Table rows={rows.adjustments} empty="None" columns={[
          { label: 'Type', render: a => label(a.type) }, { label: 'Amount', right: true, render: a => money(a.amountCents) }, { label: 'Reason', render: a => <span className="small">{a.reason}</span> },
          { label: 'Requested', render: a => dt(a.createdAt) }, { label: 'Status', render: a => <StatusPill status={a.status} /> },
          { label: '', render: a => a.status === 'pending' && can('economics:approve') && a.requestedBy !== user?.id && <div className="row"><Button size="sm" onClick={() => decide(a, true)}>Approve</Button><Button size="sm" variant="ghost" onClick={() => decide(a, false)}>Reject</Button></div> }
        ]} />}</Async>
      </Card>
      {ledger.data && <Card title="Latest ledger events"><LedgerTable events={ledger.data.events} showIds /></Card>}
      <Modal open={Boolean(form)} title="Request adjustment" onClose={() => setForm(null)} footer={<Button variant="primary" loading={busy} onClick={() => run(async () => {
        const body = { type: form.type, reason: form.reason, attribution: { locationId: form.locationId || undefined, roId: form.roId || undefined } };
        if (form.type === 'reversal') body.reversesEventId = form.reversesEventId; else body.amountCents = Math.round(Number(form.amount) * 100);
        await api.post(`${BASE}/adjustments`, body); setForm(null); s.reload();
      }, 'Adjustment requested')}>Submit for approval</Button>}>
        <Field label="Type"><Select value={form?.type} options={['other_revenue', 'parts_credit', 'warranty_recovery', 'towing_cost', 'sublet_cost', 'other_direct_cost', 'overhead_allocation', 'reversal'].map(k => ({ value: k, label: label(k) }))} onChange={e => setForm(x => ({ ...x, type: e.target.value }))} /></Field>
        {form?.type === 'reversal'
          ? <Field label="Ledger event id to reverse"><Input value={form.reversesEventId} onChange={e => setForm(x => ({ ...x, reversesEventId: e.target.value }))} /></Field>
          : <Field label="Amount ($) — credits are recorded as reductions automatically"><Input type="number" step="0.01" min="0" value={form?.amount || ''} onChange={e => setForm(x => ({ ...x, amount: e.target.value }))} /></Field>}
        {form?.type !== 'reversal' && <div className="grid-2">
          <Field label="Location id"><Input value={form?.locationId || ''} onChange={e => setForm(x => ({ ...x, locationId: e.target.value }))} /></Field>
          <Field label="Repair order id (optional)"><Input value={form?.roId || ''} onChange={e => setForm(x => ({ ...x, roId: e.target.value }))} /></Field>
        </div>}
        <Field label="Reason (required)"><Textarea value={form?.reason || ''} onChange={e => setForm(x => ({ ...x, reason: e.target.value }))} /></Field>
      </Modal>
    </div>
  );
};

const Settings = () => {
  const [run, busy] = useAction();
  const [text, setText] = useState(null);
  const [importText, setImportText] = useState(null);
  const [month, setMonth] = useState('');
  const s = useAsync(() => api.get(`${BASE}/config`), []);
  const plans = useAsync(() => api.get('/membership-plans').then(r => r.plans), []);
  const bf = useAsync(() => api.get(`${BASE}/ledger/backfill`), []);
  const parse = (t) => { try { return JSON.parse(t); } catch (e) { alert(`Invalid JSON: ${e.message}`); return null; } };
  return (
    <Async state={s}>{data => {
      const a = data.active;
      const keys = ['defaultLoadedLaborRateCents', 'labor', 'overhead', 'reserveBps', 'defaultTargetMarginBps', 'defaultWarningMarginBps', 'lossToleranceBps', 'adverseTrendBps', 'majorRepairThresholdCents', 'preventiveCategories', 'referralRewardCents', 'membershipGraceDays', 'qualificationRules', 'forecast', 'riskBands', 'riskModel', 'alertThresholds', 'customerSeverity'];
      const template = { effectiveFrom: new Date().toISOString().slice(0, 10), ...Object.fromEntries(keys.map(k => [k, a[k]])), plans: (plans.data || []).map(p => a.plans.find(x => x.planId === p.planId) || { planId: p.planId, expectedAnnualDirectCostCents: null, expectedAnnualVisits: null, targetMarginBps: null, warningMarginBps: null }), notes: '' };
      return (
        <div className="stack">
          <Card title="Economics configuration" actions={<Button size="sm" variant="primary" onClick={() => setText(JSON.stringify(template, null, 2))}>Publish new version</Button>}>
            <Alert tone="info">Versions are immutable and effective-dated; historical events keep the rules in force when they occurred. Amounts are cents, rates basis points (1000 = 10%). Overhead methods: percent_of_revenue, flat_per_repair_order, per_labor_hour, per_bay_hour (clocked time), per_member_month and location_revenue_share (monthly close), or hybrid with weighted components.</Alert>
            <div className="grid-4 small" style={{ marginTop: 10 }}>
              <div className="ft-kv"><span>Active version</span><strong>{a.isDefault ? 'Defaults (none published)' : `v${a.version} from ${d(a.effectiveFrom)}`}</strong></div>
              <div className="ft-kv"><span>Default labor rate</span><strong>{a.labor?.default?.baseWageCents != null ? `wage ${money(a.labor.default.baseWageCents)}/h + burden` : a.defaultLoadedLaborRateCents != null ? `${money(a.defaultLoadedLaborRateCents)}/h` : 'Not set'}</strong></div>
              <div className="ft-kv"><span>Overhead</span><strong>{label(a.overhead.method)}</strong></div>
              <div className="ft-kv"><span>Risk bands</span><strong>{a.riskBands.map(b => `${b.band} ≥${b.minScore}`).join(' · ')}</strong></div>
            </div>
            <Table rows={data.versions} empty="No versions published" columns={[
              { label: 'Version', render: v => `v${v.version}${v.rolledBackFromVersion ? ` (copy of v${v.rolledBackFromVersion})` : ''}` }, { label: 'Effective', render: v => d(v.effectiveFrom) },
              { label: 'Notes', render: v => v.notes || '—' }, { label: 'Published', render: v => dt(v.createdAt) },
              { label: '', render: v => v.version !== a.version && <Button size="sm" variant="ghost" onClick={() => { const reason = window.prompt(`Restore the settings of v${v.version} as a new version. Reason:`); if (reason) run(async () => { await api.post(`${BASE}/config/rollback`, { toVersion: v.version, reason }); s.reload(); }, 'Rolled back'); }}>Roll back to this</Button> }
            ]} />
          </Card>
          <div className="grid-2">
            <Card title="Ledger backfill" actions={<Button size="sm" loading={busy} onClick={() => run(async () => { await api.post(`${BASE}/ledger/backfill`); bf.reload(); }, 'Backfill started')}>Start backfill</Button>}>
              <div className="small muted">Posts every existing invoice, payment, refund, adjustment, supplier credit, warranty recovery, referral reward and membership lifecycle event not yet in the ledger, in resumable chunks. Safe to run again; duplicates are ignored.</div>
              <Async state={bf}>{b => (b.runId ? <>
                <div className="small" style={{ marginTop: 8 }}>Run {b.runId}: {b.done ? <Badge tone="ok">complete</Badge> : <Badge tone="warn">in progress</Badge>} <Button size="sm" variant="ghost" onClick={bf.reload}>Refresh</Button></div>
                <Table rows={Object.entries(b.phases).map(([phase, p]) => ({ phase, ...p }))} rowKey="phase" columns={[{ label: 'Phase', render: p => label(p.phase) }, { label: 'Records', right: true, render: p => p.processed }, { label: 'New events', right: true, render: p => p.inserted }, { label: 'Already posted', right: true, render: p => p.duplicates }, { label: 'Pending', right: true, render: p => p.pending }]} />
                {b.errors.length > 0 && <Alert tone="danger">{b.errors.map((e, i) => <div key={i}>{e.phase}: {e.error}</div>)}</Alert>}
              </> : <div className="small faint" style={{ marginTop: 8 }}>No backfill has run.</div>)}</Async>
            </Card>
            <Card title="Historical import & monthly close">
              <div className="small muted">Import rows from an earlier system with their original ids and a data-quality grade (EXACT, DERIVED, ESTIMATED, UNKNOWN). Re-importing the same ids is ignored.</div>
              <Button size="sm" onClick={() => setImportText(JSON.stringify({ sourceSystem: 'legacy', rows: [{ externalId: '', kind: 'economic', type: 'parts_cost', amountCents: 0, effectiveAt: '2025-01-31', quality: 'EXACT', vin: '', roNumber: '', note: '' }, { externalId: '', kind: 'mileage', vin: '', odometer: 0, effectiveAt: '2025-01-31' }] }, null, 2))}>Import history</Button>
              <div className="row" style={{ marginTop: 12 }}>
                <Input type="month" value={month} onChange={e => setMonth(e.target.value)} style={{ width: 180 }} />
                <Button size="sm" disabled={!month} loading={busy} onClick={() => run(() => api.post(`${BASE}/close-month`, { month }), 'Month closed')}>Allocate monthly overhead</Button>
              </div>
              <div className="small faint">The previous month closes automatically; this re-runs a month safely (existing allocations are kept).</div>
            </Card>
          </div>
          <Modal open={Boolean(text)} title="Publish economics configuration" size="lg" onClose={() => setText(null)} footer={<Button variant="primary" loading={busy} onClick={() => { const body = parse(text); if (body) run(async () => { await api.post(`${BASE}/config`, body); setText(null); s.reload(); }, 'Configuration published'); }}>Publish</Button>}>
            <Field label="Configuration (JSON). Notes are required and recorded in the audit history."><Textarea style={{ minHeight: 420, fontFamily: 'var(--ft-font-mono)', fontSize: 12 }} value={text || ''} onChange={e => setText(e.target.value)} /></Field>
          </Modal>
          <Modal open={Boolean(importText)} title="Import historical records" size="lg" onClose={() => setImportText(null)} footer={<Button variant="primary" loading={busy} onClick={() => { const body = parse(importText); if (body) run(async () => { const r = await api.post(`${BASE}/ledger/import`, body); setImportText(JSON.stringify(r.result, null, 2)); }, 'Import processed'); }}>Import</Button>}>
            <Field label="Rows (JSON, up to 1000 per request). The result replaces this text."><Textarea style={{ minHeight: 360, fontFamily: 'var(--ft-font-mono)', fontSize: 12 }} value={importText || ''} onChange={e => setImportText(e.target.value)} /></Field>
          </Modal>
        </div>
      );
    }}</Async>
  );
};

export const Intelligence = ({ id, sub }) => {
  const { can } = useAuth();
  const { locationId } = useWorkspace();
  const [f, setF] = useState({ from: new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10), to: new Date(Date.now() + 86400000).toISOString().slice(0, 10), scope: can('economics:corporate') ? 'all' : 'location', planId: '' });
  const econ = can('economics:location') || can('economics:corporate');
  const tabs = [
    econ && 'portfolio', econ && 'breakdowns', econ && 'cohorts', can('risk:read') && 'risk', can('interventions:read') && 'alerts', can('interventions:read') && 'interventions',
    (econ || can('risk:read')) && 'diagnostics', (can('economics:config') || can('economics:corporate')) && 'monitoring',
    (can('economics:adjust') || can('economics:approve')) && 'adjustments', can('economics:config') && 'settings'
  ].filter(Boolean);
  const [tab, setTab] = useState(tabs[0]);
  if (id === 'vehicle' && sub) return <VehicleWorkspace id={sub} />;
  if (id === 'membership' && sub) return <MembershipWorkspace id={sub} />;
  if (!tabs.length) return <Empty title="Open a vehicle or membership to see its intelligence workspace" />;
  const q = { from: f.from, to: f.to, planId: f.planId || undefined, locationId: f.scope === 'location' ? locationId : undefined };
  return (
    <>
      <PageHeader title="Membership Auto Intelligence" subtitle="Ledger-based membership economics, customer value, risk, alerts and interventions" />
      <Tabs tabs={tabs} active={tab} onChange={setTab} />
      {!['monitoring', 'adjustments', 'settings'].includes(tab) && <Filters f={f} setF={setF} />}
      {tab === 'portfolio' && <Portfolio q={q} />}
      {tab === 'breakdowns' && <Breakdown q={q} />}
      {tab === 'cohorts' && <Cohorts q={q} />}
      {tab === 'risk' && <Risk q={q} />}
      {tab === 'alerts' && <Alerts q={q} />}
      {tab === 'interventions' && <Interventions q={q} />}
      {tab === 'diagnostics' && <Diagnostics q={q} />}
      {tab === 'monitoring' && <Monitoring />}
      {tab === 'adjustments' && <Adjustments />}
      {tab === 'settings' && <Settings />}
    </>
  );
};
