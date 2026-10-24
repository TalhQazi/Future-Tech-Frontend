import React, { useState } from 'react';
import { RefreshCw, Info } from 'lucide-react';
import { api } from '../../api/client.js';
import { navigate } from '../../router.js';
import { useAuth } from '../auth.jsx';
import { useWorkspace } from '../Shell.jsx';
import { Card, PageHeader, Button, Field, Input, Select, Textarea, Table, StatusPill, Badge, Modal, Alert, Async, Stat, Tabs, Empty, useAsync, useAction, money, dt, d, label } from '../ui.jsx';

const BAND_TONE = { GREEN: 'ok', YELLOW: 'warn', ORANGE: 'warn', RED: 'danger' };
export const BandBadge = ({ band }) => (band ? <Badge tone={BAND_TONE[band]}>{band}</Badge> : <Badge>Not assessed</Badge>);
const pctText = (v) => (v == null ? '—' : `${v}%`);
const GROUPS = ['plan', 'location', 'serviceCategory', 'cohort', 'period', 'membership', 'vehicle'];

const EconomicsTable = ({ rows, groupBy, onRow }) => (
  <Table rows={rows} rowKey="key" onRowClick={onRow} empty="No economic events in this period" columns={[
    { label: label(groupBy), render: r => <div><strong>{r.label}</strong>{!r.verified && <div className="small" style={{ color: 'var(--warn)' }} title={r.incompleteReasons.join('; ')}>incomplete inputs</div>}</div> },
    { label: 'Revenue', right: true, render: r => money(r.revenueCents) },
    { label: 'Parts', right: true, render: r => money(r.partsCostCents) },
    { label: 'Labor', right: true, render: r => money(r.laborCostCents) },
    { label: 'Other direct', right: true, render: r => money(r.otherDirectCostCents) },
    { label: 'Overhead', right: true, render: r => money(r.overheadCents) },
    { label: 'Net profit', right: true, render: r => <strong>{money(r.netProfitCents)}</strong> },
    { label: 'Margin', right: true, render: r => pctText(r.realizedMarginPct) },
    { label: 'Utilization', right: true, render: r => (r.utilizationIndex ?? '—') },
    { label: 'Cost variance', right: true, render: r => (r.costVarianceCents == null ? '—' : money(r.costVarianceCents)) },
    { label: 'Customer savings', right: true, render: r => money(r.customerSavingsCents) }
  ]} />
);

const Definitions = ({ defs, configVersion, configIsDefault }) => (
  <details className="small muted">
    <summary className="row" style={{ cursor: 'pointer' }}><Info size={13} />How these figures are calculated</summary>
    <ul style={{ paddingLeft: 18, marginTop: 6 }}>{Object.entries(defs || {}).map(([k, v]) => <li key={k}><strong>{label(k.replace(/Cents|Pct/g, ''))}</strong>: {v}</li>)}</ul>
    <div>Economics configuration {configIsDefault ? 'not set (defaults: no overhead, no baselines)' : `v${configVersion}`}. Figures come only from ledger events posted from invoices, payments, refunds, adjustments, issued parts and clocked time.</div>
  </details>
);

const Portfolio = () => {
  const { locationId } = useWorkspace();
  const { can } = useAuth();
  const [groupBy, setGroupBy] = useState('plan');
  const [scope, setScope] = useState(can('economics:corporate') ? 'all' : 'location');
  const [range, setRange] = useState({ from: new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10), to: new Date(Date.now() + 86400000).toISOString().slice(0, 10) });
  const q = { ...range, locationId: scope === 'location' ? locationId : undefined };
  const total = useAsync(() => api.get('/economics/rollup', { ...q, groupBy: 'portfolio' }), [scope, locationId, range.from, range.to]);
  const s = useAsync(() => api.get('/economics/rollup', { ...q, groupBy }), [groupBy, scope, locationId, range.from, range.to]);
  const t = total.data?.rows[0];
  return (
    <div className="stack">
      <div className="row wrap">
        <Input type="date" value={range.from} onChange={e => setRange(r => ({ ...r, from: e.target.value }))} style={{ width: 160 }} />
        <Input type="date" value={range.to} onChange={e => setRange(r => ({ ...r, to: e.target.value }))} style={{ width: 160 }} />
        {can('economics:corporate') && <Select value={scope} options={[{ value: 'all', label: 'All locations' }, { value: 'location', label: 'Current location' }]} onChange={e => setScope(e.target.value)} style={{ width: 'auto' }} />}
      </div>
      {total.data && (t ? (
        <div className="grid-4">
          <Stat label="Attributable revenue" value={money(t.revenueCents)} />
          <Stat label="Direct cost" value={money(t.directCostCents)} hint={`Parts ${money(t.partsCostCents)} · labor ${money(t.laborCostCents)}`} />
          <Stat label="Net profit" value={money(t.netProfitCents)} hint={`Overhead ${money(t.overheadCents)}`} />
          <Stat label="Realized margin" value={pctText(t.realizedMarginPct)} hint={t.verified ? 'All inputs complete' : `${t.incompleteEvents} event(s) with missing inputs`} />
          <Stat label="Customer savings" value={money(t.customerSavingsCents)} hint={`Covered retail value ${money(t.eligibleRetailValueCents)}`} />
          <Stat label="Cost variance" value={t.costVarianceCents == null ? '—' : money(t.costVarianceCents)} hint="Actual − standard direct cost" />
          <Stat label="Utilization index" value={t.utilizationIndex ?? '—'} hint={t.utilizationIndex == null ? 'Set plan cost baselines in settings' : 'Actual / expected cost'} />
          <Stat label="Customer payments" value={money(t.customerPaymentsCents)} hint="Cash received, net of refunds" />
        </div>
      ) : <Empty title="No economic events yet" hint="Events are posted from invoices, payments, issued parts and clocked time. Administrators can backfill existing records in Settings." />)}
      <Card title="Breakdown" actions={<Select value={groupBy} options={GROUPS} onChange={e => setGroupBy(e.target.value)} style={{ width: 'auto' }} />}>
        <Async state={s}>{data => <>
          <EconomicsTable rows={data.rows} groupBy={groupBy} onRow={groupBy === 'vehicle' ? r => navigate(`#/app/intelligence/vehicle/${r.key}`) : groupBy === 'membership' ? r => navigate(`#/app/intelligence/membership/${r.key}`) : undefined} />
          <div style={{ marginTop: 10 }}><Definitions defs={data.definitions} configVersion={data.configVersion} configIsDefault={data.configIsDefault} /></div>
        </>}</Async>
      </Card>
    </div>
  );
};

const Risk = () => {
  const { locationId } = useWorkspace();
  const { can } = useAuth();
  const [run, busy] = useAction();
  const s = useAsync(() => api.get('/risk/distribution', { locationId }), [locationId]);
  return (
    <Async state={s}>{data => (
      <div className="stack">
        <Alert tone="info">Model {data.modelVersion}: a deterministic baseline from repair history, ledger costs, declined work and configured thresholds. It is not a trained model, and risk never changes coverage or approvals on its own.</Alert>
        <div className="grid-4">{Object.entries(data.distribution).map(([b, n]) => <Stat key={b} label={<BandBadge band={b} />} value={n} hint="vehicles" />)}</div>
        <Card title="Forecast service exposure (assessed vehicles)" actions={can('interventions:manage') && <Button size="sm" loading={busy} onClick={() => run(() => api.post('/risk/refresh'), 'Risk refresh queued; results appear shortly')}><RefreshCw size={13} />Refresh all</Button>}>
          <Table rows={data.forecastExposure} rowKey="days" empty="No assessments yet" columns={[{ label: 'Horizon', render: x => `${x.days} days` }, { label: 'Expected direct cost', right: true, render: x => money(x.expectedDirectCostCents) }, { label: 'Expected visits', right: true, render: x => x.expectedVisits }]} />
        </Card>
        <Card title="Highest risk">
          <Table rows={data.highestRisk} onRowClick={x => navigate(`#/app/intelligence/vehicle/${x.vehicleId}`)} columns={[
            { label: 'Vehicle', render: x => (x.vehicle ? `${x.vehicle.year} ${x.vehicle.make} ${x.vehicle.model}` : x.vehicleId.slice(0, 8)) },
            { label: 'Band', render: x => <BandBadge band={x.band} /> }, { label: 'Score', right: true, render: x => x.score },
            { label: 'Confidence', render: x => <StatusPill status={x.confidence} /> }, { label: 'Top driver', render: x => x.drivers[0]?.explanation || '—' },
            { label: 'Projected margin', right: true, render: x => pctText(x.projectedMarginPct) }, { label: 'Assessed', render: x => dt(x.generatedAt) }
          ]} />
        </Card>
      </div>
    )}</Async>
  );
};

const Interventions = () => {
  const { can } = useAuth();
  const { locationId } = useWorkspace();
  const [run, busy] = useAction();
  const [status, setStatus] = useState('open,in_progress');
  const [edit, setEdit] = useState(null);
  const s = useAsync(() => api.get('/interventions', { status, locationId }).then(r => r.interventions), [status, locationId]);
  const staff = useAsync(() => (can('interventions:manage') ? api.get('/users', { locationId }).then(r => r.users) : Promise.resolve([])), [locationId]);
  return (
    <Card title="Interventions" actions={<Select value={status} options={[{ value: 'open,in_progress', label: 'Open' }, { value: 'resolved,dismissed', label: 'Closed' }]} onChange={e => setStatus(e.target.value)} style={{ width: 'auto' }} />}>
      <Async state={s}>{rows => <Table rows={rows} empty="No interventions" onRowClick={can('interventions:manage') ? x => setEdit({ ...x, nextStatus: x.status, note: '' }) : undefined} columns={[
        { label: 'Action', render: x => <div><strong>{x.recommendedAction}</strong><div className="small faint">{x.reason}</div></div> },
        { label: 'Vehicle', render: x => (x.vehicle ? <a href={`#/app/intelligence/vehicle/${x.vehicleId}`} onClick={e => e.stopPropagation()}>{x.vehicle.year} {x.vehicle.make} {x.vehicle.model}</a> : '—') },
        { label: 'Kind', render: x => label(x.kind) }, { label: 'Priority', render: x => <StatusPill status={x.priority} /> },
        { label: 'Owner', render: x => x.owner?.name || <span className="faint">Unassigned</span> }, { label: 'Due', render: x => d(x.dueAt) }, { label: 'Status', render: x => <StatusPill status={x.status} /> },
        { label: 'Est. impact', right: true, render: x => (x.estimatedImpactCents ? <span title="Estimate, not booked">{money(x.estimatedImpactCents)}*</span> : '—') }
      ]} />}</Async>
      <Modal open={Boolean(edit)} title="Update intervention" onClose={() => setEdit(null)} footer={<Button variant="primary" loading={busy} onClick={() => run(async () => {
        await api.patch(`/interventions/${edit.id}`, { status: edit.nextStatus !== edit.status ? edit.nextStatus : undefined, ownerId: edit.ownerId || null, note: edit.note || undefined, resolutionNotes: ['resolved', 'dismissed'].includes(edit.nextStatus) ? edit.note : undefined });
        setEdit(null);
        s.reload();
      }, 'Intervention updated')}>Save</Button>}>
        <p><strong>{edit?.recommendedAction}</strong></p>
        <div className="grid-2">
          <Field label="Status"><Select value={edit?.nextStatus} options={['open', 'in_progress', 'resolved', 'dismissed']} onChange={e => setEdit(x => ({ ...x, nextStatus: e.target.value }))} /></Field>
          <Field label="Owner"><Select value={edit?.ownerId || ''} placeholder="Unassigned" options={(staff.data || []).map(u => ({ value: u.id, label: `${u.name} (${u.role})` }))} onChange={e => setEdit(x => ({ ...x, ownerId: e.target.value }))} /></Field>
        </div>
        <Field label={['resolved', 'dismissed'].includes(edit?.nextStatus) ? 'Outcome (required)' : 'Note'}><Textarea value={edit?.note || ''} onChange={e => setEdit(x => ({ ...x, note: e.target.value }))} /></Field>
        {edit?.history?.length > 0 && <div className="small faint">{edit.history.map((h, i) => <div key={i}>{dt(h.at)} · {h.from ? `${h.from} → ${h.to}` : ''} {h.note}</div>)}</div>}
      </Modal>
    </Card>
  );
};

const RiskPanel = ({ risk }) => {
  if (!risk?.snapshot) return <Card title="Risk"><p className="muted">Not assessed yet.</p></Card>;
  const sn = risk.snapshot;
  return (
    <Card title="Risk & forecast" actions={<><BandBadge band={sn.band} /><StatusPill status={sn.confidence} /></>}>
      <div className="stack">
        <div className="small muted">Score {sn.score} · {sn.modelVersion} · {dt(sn.generatedAt)} · {sn.confidenceBasis}</div>
        <Table rows={sn.drivers} rowKey="factor" empty="No risk drivers" columns={[{ label: 'Driver', render: x => label(x.factor) }, { label: 'Points', right: true, render: x => x.points }, { label: 'Why', render: x => x.explanation }]} />
        <Table rows={sn.horizons} rowKey="days" empty="Not enough history for a forecast" columns={[{ label: 'Horizon', render: x => `${x.days} days` }, { label: 'Expected direct cost', right: true, render: x => money(x.expectedDirectCostCents) }, { label: 'Expected visits', right: true, render: x => x.expectedVisits ?? '—' }]} />
        <div className="grid-3 small">
          <div className="ft-kv"><span>Major-repair exposure</span><strong>{money(sn.majorRepairExposureCents)}</strong></div>
          <div className="ft-kv"><span>Unscheduled visit (12 mo)</span><strong>{sn.unscheduledVisitLikelihood == null ? '—' : `${Math.round(sn.unscheduledVisitLikelihood * 100)}%`}</strong></div>
          <div className="ft-kv"><span>Projected margin</span><strong>{pctText(sn.projectedMarginPct)}</strong></div>
        </div>
        {sn.nextLikelyServices?.length > 0 && <div className="small">Next likely services: {sn.nextLikelyServices.map(n => n.title).join(', ')}</div>}
      </div>
    </Card>
  );
};

const VehicleWorkspace = ({ id }) => {
  const { can } = useAuth();
  const [run, busy] = useAction();
  const s = useAsync(() => api.get(`/economics/vehicles/${id}`), [id]);
  return (
    <Async state={s}>{data => (
      <>
        <a href="#/app/intelligence" className="small">← Member intelligence</a>
        <PageHeader title={data.vehicle ? `${data.vehicle.year} ${data.vehicle.make} ${data.vehicle.model}` : 'Vehicle'} subtitle={<span className="mono">{data.vehicle?.vin}</span>} actions={<>
          <Button size="sm" onClick={() => navigate(`#/app/vehicles/${id}`)}>Service history</Button>
          {can('risk:read') && <Button size="sm" loading={busy} onClick={() => run(async () => { await api.post(`/risk/vehicles/${id}/assess`); s.reload(); }, 'Reassessed')}><RefreshCw size={13} />Reassess risk</Button>}
        </>} />
        {data.economics ? (
          <div className="grid-4">
            <Stat label="Revenue" value={money(data.economics.revenueCents)} />
            <Stat label="Direct cost" value={money(data.economics.directCostCents)} />
            <Stat label="Net profit" value={money(data.economics.netProfitCents)} hint={`Margin ${pctText(data.economics.realizedMarginPct)}`} />
            <Stat label="Customer savings" value={money(data.economics.customerSavingsCents)} hint={`Covered retail value ${money(data.economics.eligibleRetailValueCents)}`} />
          </div>
        ) : <Alert tone="info">No economic events for this vehicle yet.</Alert>}
        <div className="grid-2">
          <RiskPanel risk={data.risk} />
          <Card title="By month"><EconomicsTable rows={data.byPeriod} groupBy="period" /></Card>
        </div>
        {data.risk?.interventions?.length > 0 && <Card title="Open interventions">{data.risk.interventions.map(i => <div key={i.id} className="row between small"><span>{i.recommendedAction}</span><StatusPill status={i.status} /></div>)}</Card>}
        <Card title="Ledger events (source of every figure)">
          <Table rows={data.events} columns={[
            { label: 'Date', render: e => d(e.effectiveAt) }, { label: 'Type', render: e => label(e.type) }, { label: 'Amount', right: true, render: e => money(e.amountCents, e.currency) },
            { label: 'Source', render: e => <span className="mono small">{e.source.type}:{e.source.id.slice(0, 12)}</span> }, { label: 'Category', render: e => e.attribution?.serviceCategory || '—' },
            { label: '', render: e => (e.complete ? null : <Badge tone="warn">{e.incompleteReason}</Badge>) }
          ]} />
        </Card>
      </>
    )}</Async>
  );
};

const MembershipWorkspace = ({ id }) => {
  const s = useAsync(() => api.get(`/economics/memberships/${id}`), [id]);
  return (
    <Async state={s}>{data => (
      <>
        <a href="#/app/intelligence" className="small">← Member intelligence</a>
        <PageHeader title={`${data.membership.number} · ${data.customer?.name || ''}`} subtitle={`${data.plan?.name || 'Plan'} v${data.membership.planVersion} · member since ${d(data.membership.startedAt)}`} actions={<StatusPill status={data.membership.status} />} />
        {data.economics ? (
          <div className="grid-4">
            <Stat label="Revenue" value={money(data.economics.revenueCents)} />
            <Stat label="Direct cost" value={money(data.economics.directCostCents)} />
            <Stat label="Margin" value={pctText(data.economics.realizedMarginPct)} hint={`Net ${money(data.economics.netProfitCents)}`} />
            <Stat label="Customer savings" value={money(data.economics.customerSavingsCents)} />
          </div>
        ) : <Alert tone="info">No economic events for this membership yet.</Alert>}
        <Card title="By service category"><EconomicsTable rows={data.byServiceCategory} groupBy="serviceCategory" /></Card>
        <Card title="Covered vehicles"><Table rows={data.vehicles} onRowClick={v => navigate(`#/app/intelligence/vehicle/${v.id}`)} columns={[{ label: 'Vehicle', render: v => `${v.year} ${v.make} ${v.model}` }, { label: 'VIN', render: v => <span className="mono small">{v.vin || '—'}</span> }]} /></Card>
      </>
    )}</Async>
  );
};

const Settings = () => {
  const [run, busy] = useAction();
  const [text, setText] = useState(null);
  const s = useAsync(() => api.get('/economics/config'), []);
  const plans = useAsync(() => api.get('/membership-plans').then(r => r.plans), []);
  return (
    <Async state={s}>{data => {
      const a = data.active;
      const template = { effectiveFrom: new Date().toISOString().slice(0, 10), defaultLoadedLaborRateCents: a.defaultLoadedLaborRateCents, overhead: a.overhead, reserveBps: a.reserveBps, defaultTargetMarginBps: a.defaultTargetMarginBps, defaultWarningMarginBps: a.defaultWarningMarginBps, plans: (plans.data || []).map(p => a.plans.find(x => x.planId === p.planId) || { planId: p.planId, expectedAnnualDirectCostCents: null, expectedAnnualVisits: null, targetMarginBps: null, warningMarginBps: null }), forecast: a.forecast, riskBands: a.riskBands, notes: '' };
      return (
        <div className="stack">
          <Card title="Economics configuration" actions={<Button size="sm" variant="primary" onClick={() => setText(JSON.stringify(template, null, 2))}>Publish new version</Button>}>
            <Alert tone="info">Versions are immutable and effective-dated. Amounts are cents, rates basis points (1000 = 10%). Plan baselines drive the utilization index and forecasts; without them those figures show "—".</Alert>
            <div className="grid-4 small" style={{ marginTop: 10 }}>
              <div className="ft-kv"><span>Active version</span><strong>{a.isDefault ? 'Defaults (none published)' : `v${a.version} from ${d(a.effectiveFrom)}`}</strong></div>
              <div className="ft-kv"><span>Default loaded labor rate</span><strong>{a.defaultLoadedLaborRateCents != null ? `${money(a.defaultLoadedLaborRateCents)}/h` : 'Not set'}</strong></div>
              <div className="ft-kv"><span>Overhead</span><strong>{label(a.overhead.method)}{a.overhead.method === 'percent_of_revenue' ? ` ${a.overhead.rateBps / 100}%` : a.overhead.method === 'flat_per_repair_order' ? ` ${money(a.overhead.flatCents)}` : ''}</strong></div>
              <div className="ft-kv"><span>Risk bands</span><strong>{a.riskBands.map(b => `${b.band} ≥${b.minScore}`).join(' · ')}</strong></div>
            </div>
            <Table rows={data.versions} rowKey="id" empty="No versions published" columns={[{ label: 'Version', render: v => `v${v.version}` }, { label: 'Effective', render: v => d(v.effectiveFrom) }, { label: 'Notes', render: v => v.notes || '—' }, { label: 'Published', render: v => dt(v.createdAt) }]} />
          </Card>
          <Card title="Ledger maintenance"><div className="row"><span className="muted small grow">Posts any posted invoice, payment, refund or adjustment that is not yet in the economic ledger. Safe to run repeatedly.</span><Button loading={busy} onClick={() => run(async () => { const r = await api.post('/economics/ledger/backfill'); return r; }, 'Ledger backfill complete')}>Backfill ledger</Button></div></Card>
          <Modal open={Boolean(text)} title="Publish economics configuration" size="lg" onClose={() => setText(null)} footer={<Button variant="primary" loading={busy} onClick={() => { let body; try { body = JSON.parse(text); } catch (e) { return alert(`Invalid JSON: ${e.message}`); } return run(async () => { await api.post('/economics/config', body); setText(null); s.reload(); }, 'Configuration published'); }}>Publish</Button>}>
            <Field label="Configuration (JSON) — notes are required and recorded in the audit history"><Textarea style={{ minHeight: 380, fontFamily: 'var(--ft-font-mono)', fontSize: 12 }} value={text || ''} onChange={e => setText(e.target.value)} /></Field>
          </Modal>
        </div>
      );
    }}</Async>
  );
};

// Advisor-safe card on the vehicle page: customer value + risk band and recommended actions only.
export const MemberValueCard = ({ id }) => {
  const s = useAsync(() => api.get(`/economics/vehicles/${id}`).catch(() => null), [id]);
  const v = s.data;
  if (!v) return null;
  const value = v.limited ? v.customerValue : v.economics;
  const sn = v.risk?.snapshot;
  const actions = v.risk?.interventions || [];
  if (!value?.eligibleRetailValueCents && !sn && !actions.length) return null;
  return (
    <Card title="Member value & service outlook" actions={<>{sn && <BandBadge band={sn.band} />}{!v.limited && <a className="small" href={`#/app/intelligence/vehicle/${id}`}>Full workspace</a>}</>}>
      <div className="grid-3 small">
        <div className="ft-kv"><span>Membership savings to date</span><strong>{money(value?.customerSavingsCents || 0)}</strong></div>
        <div className="ft-kv"><span>Covered retail value</span><strong>{money(value?.eligibleRetailValueCents || 0)}</strong></div>
        <div className="ft-kv"><span>Next likely services</span><strong>{sn?.nextLikelyServices?.map(n => n.title).join(', ') || '—'}</strong></div>
      </div>
      {actions.map(i => <div key={i.id} className="row between small" style={{ marginTop: 6 }}><span>Recommended: {i.recommendedAction}</span><StatusPill status={i.status} /></div>)}
    </Card>
  );
};

export const Intelligence = ({ id, sub }) => {
  const { can } = useAuth();
  const tabs = [(can('economics:location') || can('economics:corporate')) && 'portfolio', can('risk:read') && 'risk', can('interventions:read') && 'interventions', can('economics:config') && 'settings'].filter(Boolean);
  const [tab, setTab] = useState(tabs[0]);
  if (id === 'vehicle' && sub) return <VehicleWorkspace id={sub} />;
  if (id === 'membership' && sub) return <MembershipWorkspace id={sub} />;
  return (
    <>
      <PageHeader title="Member intelligence" subtitle="Membership economics, customer value, risk and interventions — derived from the economic ledger" />
      <Tabs tabs={tabs} active={tab} onChange={setTab} />
      {tab === 'portfolio' && <Portfolio />}
      {tab === 'risk' && <Risk />}
      {tab === 'interventions' && <Interventions />}
      {tab === 'settings' && <Settings />}
    </>
  );
};
