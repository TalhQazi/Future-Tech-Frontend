import React, { useState } from 'react';
import { RefreshCw, ShieldAlert } from 'lucide-react';
import { api } from '../../api/client.js';
import { navigate } from '../../router.js';
import { useAuth } from '../auth.jsx';
import { Card, PageHeader, Button, Field, Input, Select, Textarea, Table, StatusPill, Badge, Modal, Alert, Async, Stat, Tabs, Empty, useAsync, useAction, money, dt, d, label } from '../ui.jsx';
import { EvidenceThumb } from '../shared.jsx';
import { BarChart, LineChart } from '../charts.jsx';

const BAND_TONE = { GREEN: 'ok', YELLOW: 'warn', ORANGE: 'warn', RED: 'danger' };
export const BandBadge = ({ band, prefix = '' }) => (band ? <Badge tone={BAND_TONE[band]}>{prefix}{band}</Badge> : <Badge>Not assessed</Badge>);
export const pctText = (v) => (v == null ? '—' : `${v}%`);
const QualityBadge = ({ q }) => (q && q !== 'EXACT' ? <Badge tone={q === 'UNKNOWN' ? 'danger' : q === 'ESTIMATED' ? 'warn' : 'info'}>{q}</Badge> : null);
const kv = (k, v) => <div className="ft-kv" key={k}><span>{k}</span><strong>{v}</strong></div>;

export const EconomicsTable = ({ rows, groupBy, onRow }) => (
  <div className="ft-scroll-x">
    <Table rows={rows} rowKey="key" onRowClick={onRow} empty="No economic events in this period" columns={[
      { label: label(groupBy), render: r => <div><strong>{r.label}</strong>{!r.verified && <div className="small" style={{ color: 'var(--warn)' }} title={r.incompleteReasons.join('; ')}>{r.incompleteEvents} unknown input(s)</div>}</div> },
      { label: 'Membership rev.', right: true, render: r => money(r.membershipRevenueCents) },
      { label: 'Service rev.', right: true, render: r => money(r.serviceRevenueCents) },
      { label: 'Credits/refunds', right: true, render: r => money(r.creditsRefundsCents) },
      { label: 'Parts', right: true, render: r => money(r.partsCostCents) },
      { label: 'Labor', right: true, render: r => money(r.laborCostCents) },
      { label: 'Other direct', right: true, render: r => money(r.otherDirectCostCents) },
      { label: 'Overhead', right: true, render: r => money(r.overheadCents) },
      { label: 'Net profit', right: true, render: r => <strong>{money(r.netProfitCents)}</strong> },
      { label: 'Margin', right: true, render: r => pctText(r.realizedMarginPct) },
      { label: 'Utilization', right: true, render: r => r.utilizationIndex ?? '—' },
      { label: 'Cost variance', right: true, render: r => (r.costVarianceCents == null ? '—' : money(r.costVarianceCents)) },
      { label: 'Savings', right: true, render: r => money(r.customerSavingsCents) }
    ]} />
  </div>
);

export const Definitions = ({ defs }) => (
  <details className="small muted">
    <summary style={{ cursor: 'pointer' }}>How these figures are calculated</summary>
    <ul style={{ paddingLeft: 18, marginTop: 6 }}>{Object.entries(defs || {}).map(([k, v]) => <li key={k}><strong>{label(k.replace(/Cents|Pct/g, ''))}</strong>: {v}</li>)}</ul>
  </details>
);

export const LedgerTable = ({ events, showIds }) => (
  <div className="ft-scroll-x">
    <Table rows={events} empty="No ledger events" columns={[
      ...(showIds ? [{ label: 'Event id', render: e => <span className="mono small">{e.id}</span> }] : []),
      { label: 'Date', render: e => d(e.effectiveAt) }, { label: 'Type', render: e => label(e.type) },
      { label: 'Amount', right: true, render: e => money(e.amountCents, e.currency) },
      { label: 'Source', render: e => <span className="mono small" title={`${e.source.system}:${e.source.type}:${e.source.id}`}>{e.source.type}:{String(e.source.id).slice(0, 14)}</span> },
      { label: 'Category', render: e => e.attribution?.serviceCategory || '—' },
      { label: 'Quality', render: e => <><QualityBadge q={e.quality} />{e.incompleteReason && <span className="small faint"> {e.incompleteReason}</span>}</> },
      { label: 'Basis', render: e => <span className="small faint">{e.calculationContext?.basis || (e.reversesEventId ? `reverses ${e.reversesEventId.slice(0, 8)}` : '')}</span> }
    ]} />
  </div>
);

// ---------------------------------------------------------------------------------------------
const RiskPanel = ({ risk, vehicleId, onChange }) => {
  const { can } = useAuth();
  const [run, busy] = useAction();
  const [ov, setOv] = useState(null);
  const sn = risk?.snapshot;
  if (!sn) return <Card title="Risk & forecast"><p className="muted">Not assessed yet.</p>{can('risk:read') && <Button size="sm" loading={busy} onClick={() => run(async () => { await api.post(`/membership-intelligence/risk/vehicles/${vehicleId}/assess`); onChange(); }, 'Assessed')}>Assess now</Button>}</Card>;
  if (risk.limited) return <Card title="Service outlook" actions={<BandBadge band={sn.band} />}><div className="small">Next likely services: {sn.nextLikelyServices?.map(n => n.title).join(', ') || '—'}</div></Card>;
  const p = sn.predictions || {};
  return (
    <Card title="Risk & forecast" actions={<>
      <BandBadge band={sn.override?.band || sn.band} prefix="Risk " /><BandBadge band={sn.override?.profitabilityState || sn.profitabilityState} prefix="Profit " /><StatusPill status={sn.confidence} />
      {can('risk:read') && <Button size="sm" loading={busy} onClick={() => run(async () => { await api.post(`/membership-intelligence/risk/vehicles/${vehicleId}/assess`); onChange(); }, 'Reassessed')}><RefreshCw size={13} /></Button>}
      {can('interventions:manage') && <Button size="sm" onClick={() => setOv({ band: sn.override?.band || '', profitabilityState: sn.override?.profitabilityState || '', reason: '' })}><ShieldAlert size={13} />Override</Button>}
    </>}>
      <div className="stack">
        <div className="small muted">Score {sn.score}/100 · {sn.modelVersion} (rules-based baseline, config v{sn.configVersion}) · {dt(sn.generatedAt)} · {sn.confidenceBasis}</div>
        {sn.override && <Alert tone="warn">Manual override by staff: {sn.override.reason} ({dt(sn.override.at)}). Coverage and approvals are unaffected.</Alert>}
        <div className="small">{sn.stateReasons?.map((r, i) => <div key={i}>• {r}</div>)}</div>
        <div className="grid-3 small">
          {Object.entries(sn.components || {}).map(([g, pts]) => kv(`${label(g)} component`, `${pts} pts`))}
        </div>
        <Table rows={sn.drivers} rowKey="factor" empty="No risk drivers" columns={[{ label: 'Driver', render: x => label(x.factor) }, { label: 'Group', render: x => label(x.group || '') }, { label: 'Points', right: true, render: x => x.points }, { label: 'Why', render: x => x.explanation }]} />
        <Table rows={sn.horizons} rowKey="days" empty="Not enough history for a forecast" columns={[{ label: 'Horizon', render: x => `${x.days} days` }, { label: 'Expected direct cost', right: true, render: x => money(x.expectedDirectCostCents) }, { label: 'Expected visits', right: true, render: x => x.expectedVisits ?? '—' }]} />
        <div className="grid-3 small">
          {kv('Major-repair probability (12 mo)', p.majorRepairProbability == null ? '—' : `${Math.round(p.majorRepairProbability * 100)}%`)}
          {kv('Unscheduled visit (12 mo)', sn.unscheduledVisitLikelihood == null ? '—' : `${Math.round(sn.unscheduledVisitLikelihood * 100)}%`)}
          {kv('Expected labor hours / yr', p.expectedAnnualLaborHours ?? '—')}
          {kv('Expected parts cost / yr', p.expectedAnnualPartsCostCents == null ? '—' : money(p.expectedAnnualPartsCostCents))}
          {kv('Declined-work exposure', money(sn.majorRepairExposureCents))}
          {kv('Projected 12-mo margin', pctText(sn.projectedMarginPct))}
          {kv('Realized margin', pctText(sn.realizedMarginPct))}
          {kv('Next service', p.nextService ? `${p.nextService.title}${p.nextService.estimatedAt ? ` · ~${d(p.nextService.estimatedAt)}` : ''}` : '—')}
        </div>
        {sn.limitations?.length > 0 && <Alert tone="info"><strong>Data limitations:</strong> {sn.limitations.join('; ')}</Alert>}
        <details className="small"><summary style={{ cursor: 'pointer' }}>Feature snapshot</summary><pre className="mono small" style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(sn.features, null, 2)}</pre></details>
        {risk.history?.length > 1 && <Table rows={risk.history} columns={[{ label: 'Assessed', render: h => dt(h.generatedAt) }, { label: 'Score', right: true, render: h => h.score }, { label: 'Band', render: h => <BandBadge band={h.band} /> }, { label: 'Profitability', render: h => <BandBadge band={h.profitabilityState} /> }, { label: 'Model', render: h => `${h.modelVersion} / v${h.configVersion}` }]} />}
      </div>
      <Modal open={Boolean(ov)} title="Override displayed risk" onClose={() => setOv(null)} footer={<Button variant="primary" loading={busy} onClick={() => run(async () => { await api.post(`/membership-intelligence/risk/vehicles/${vehicleId}/override`, { band: ov.band || undefined, profitabilityState: ov.profitabilityState || undefined, reason: ov.reason }); setOv(null); onChange(); }, 'Override recorded')}>Save</Button>}>
        <Alert tone="info">Overrides change only what staff see in queues. They never change coverage, approvals or safety obligations, and they are audited. Leave both empty to clear.</Alert>
        <div className="grid-2">
          <Field label="Risk band"><Select value={ov?.band || ''} placeholder="No override" options={['GREEN', 'YELLOW', 'ORANGE', 'RED']} onChange={e => setOv(o => ({ ...o, band: e.target.value }))} /></Field>
          <Field label="Profitability state"><Select value={ov?.profitabilityState || ''} placeholder="No override" options={['GREEN', 'YELLOW', 'ORANGE', 'RED']} onChange={e => setOv(o => ({ ...o, profitabilityState: e.target.value }))} /></Field>
        </div>
        <Field label="Reason (required)"><Textarea value={ov?.reason || ''} onChange={e => setOv(o => ({ ...o, reason: e.target.value }))} /></Field>
      </Modal>
    </Card>
  );
};

const CustomerView = ({ vehicleId }) => {
  const s = useAsync(() => api.get(`/membership-intelligence/vehicles/${vehicleId}/customer-view`), [vehicleId]);
  return (
    <Async state={s}>{({ projection: p }) => (
      <div className="stack">
        <Alert tone="info">Exactly what the customer API returns for this vehicle (server-side allowlist). Internal cost, margin and risk fields are not part of this response.</Alert>
        <div className="grid-3">
          <Stat label="Membership savings" value={money(p.totalSavingsCents)} hint={p.savingsDefinition} />
          <Stat label="Retail value of covered services" value={money(p.totalCoveredRetailValueCents)} />
          <Stat label="Membership payments" value={money(p.membershipPaymentsCents)} hint="Shown separately from savings" />
        </div>
        {p.vehicles.map(v => (
          <Card key={v.id} title={v.name}>
            {v.health.items.length ? v.health.items.map((h, i) => <div key={i} className="small" style={{ marginBottom: 6 }}><Badge tone={h.urgency === 'high' ? 'danger' : h.urgency === 'medium' ? 'warn' : 'info'}>{h.label}</Badge> <strong>{h.item}</strong> — {h.explanation} {h.recommendation}</div>) : <p className="small muted">No inspection results to show.</p>}
            {v.diagnosticCodes.map(c => <div key={c.code} className="small"><span className="mono">{c.code}</span> {c.description} · {c.status}</div>)}
            {v.maintenanceAlerts.map((a, i) => <div key={i} className="small">Maintenance: {a.title} {a.dueAt ? `(due ${d(a.dueAt)})` : ''}</div>)}
          </Card>
        ))}
        <details className="small"><summary style={{ cursor: 'pointer' }}>Raw customer payload</summary><pre className="mono small" style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(p, null, 2)}</pre></details>
      </div>
    )}</Async>
  );
};

export const VehicleWorkspace = ({ id }) => {
  const { can } = useAuth();
  const s = useAsync(() => api.get(`/membership-intelligence/vehicles/${id}`), [id]);
  const [tab, setTab] = useState('overview');
  return (
    <Async state={s}>{w => {
      const v = w.vehicle;
      const f = w.finance;
      const tabs = ['overview', 'diagnostics', 'service_history', w.membershipPayments && 'membership_payments', f && 'finance', 'code_history', 'mileage_usage', w.referrals && 'referrals', 'documents', 'photos', 'customer_app_view'].filter(Boolean);
      const life = f?.membership || f?.vehicle;
      return (
        <>
          <a href="#/app/intelligence" className="small">← Member intelligence</a>
          <PageHeader title={`${v.year || ''} ${v.make || ''} ${v.model || ''} ${v.trim || ''}`} subtitle={<span className="mono">{v.vin || 'No VIN'} · {v.engine || 'engine n/a'} · {v.mileage?.toLocaleString()} {v.mileageUnit}</span>} actions={<>
            <Button size="sm" onClick={() => navigate(`#/app/vehicles/${id}`)}>Vehicle record</Button>
            {w.customer && <Button size="sm" onClick={() => navigate(`#/app/customers/${w.customer.id}`)}>{w.customer.name}</Button>}
          </>} />
          <div className="grid-4">
            {w.membershipPayments && <Stat label="Membership payments" value={money(w.membershipPayments.totalMembershipPaymentsCents)} />}
            {w.customerValue && <Stat label="Retail value of covered services" value={money(w.customerValue.eligibleRetailValueCents)} />}
            {w.customerValue && <Stat label="Customer savings" value={money(w.customerValue.customerSavingsCents)} />}
            {life && <Stat label="Direct cost" value={money(life.directCostCents)} hint={f.membership ? 'membership lifetime' : 'vehicle lifetime'} />}
            {life && <Stat label="Net profit" value={money(life.netProfitCents)} hint={`Lifetime margin ${pctText(life.realizedMarginPct)}`} />}
            {w.risk?.snapshot && !w.risk.limited && <Stat label="Economic risk score" value={w.risk.snapshot.score} hint={`${w.risk.snapshot.band} · ${w.risk.snapshot.confidence} confidence`} />}
            <Stat label="Next appointment" value={w.nextAppointment ? d(w.nextAppointment.startAt) : '—'} hint={w.nextAppointment?.serviceRequested} />
            <Stat label="Next predicted service" value={w.risk?.snapshot?.predictions?.nextService?.title || w.recommendedMaintenance[0]?.title || '—'} hint={w.risk?.snapshot?.predictions?.nextService?.estimatedAt ? `~${d(w.risk.snapshot.predictions.nextService.estimatedAt)}` : undefined} />
          </div>
          <Tabs tabs={tabs} active={tab} onChange={setTab} />
          {tab === 'overview' && (
            <div className="grid-2">
              <Card title="Customer & membership">
                <div className="small">{w.customer?.name} · {w.customer?.phone} · {w.customer?.email}</div>
                <Table rows={w.memberships} empty="No membership covers this vehicle" onRowClick={m => navigate(`#/app/intelligence/membership/${m.id}`)} columns={[{ label: 'Number', render: m => <span className="mono">{m.number}</span> }, { label: 'Plan', render: m => `${m.planName || m.planId} v${m.planVersion}` }, { label: 'Status', render: m => <StatusPill status={m.status} /> }, { label: 'Renews', render: m => d(m.currentPeriodEnd) }]} />
              </Card>
              <Card title="Vehicle condition">
                <div className="small muted">{w.health.basis}. No overall health score is shown; only recorded findings and readings.</div>
                <div className="grid-3 small" style={{ marginTop: 8 }}>
                  {['safety', 'repair', 'maintenance', 'monitor'].map(sv => kv(label(sv), w.health.findingsBySeverity[sv] || 0))}
                  {kv('Active codes', w.health.activeCodes.join(', ') || 'none')}
                  {kv('Out-of-spec readings (12 mo)', w.health.failedMeasurements365)}
                </div>
                {w.recommendedMaintenance.length > 0 && <div className="small" style={{ marginTop: 8 }}>Recommended: {w.recommendedMaintenance.map(r => r.title).join(', ')}</div>}
              </Card>
              <RiskPanel risk={w.risk} vehicleId={id} onChange={s.reload} />
              <Card title="Upcoming appointments"><Table rows={w.upcomingAppointments} empty="None scheduled" columns={[{ label: 'When', render: a => dt(a.startAt) }, { label: 'Service', render: a => a.serviceRequested || '—' }, { label: 'Status', render: a => <StatusPill status={a.status} /> }]} /></Card>
            </div>
          )}
          {tab === 'diagnostics' && (
            <div className="stack">
              {w.diagnostics.qualification.map(g => (
                <Card key={g.key} title={`${g.label}${g.min != null || g.max != null ? ` (criteria ${g.min ?? '–'}…${g.max ?? '–'} ${g.unit || ''})` : ''}`} actions={g.qualifies == null ? null : <Badge tone={g.qualifies ? 'ok' : 'danger'}>{g.qualifies ? 'Meets criteria' : 'Outside criteria'}</Badge>}>
                  <BarChart data={g.readings} x="component" unit="number" series={[{ key: 'value', label: `${g.readings[0]?.parameter || ''} (${g.readings[0]?.unit || ''})` }]} />
                </Card>
              ))}
              <Card title="Diagnostic observations">
                <div className="ft-scroll-x"><Table rows={w.diagnostics.observations.map((o, i) => ({ ...o, _k: i }))} rowKey="_k" empty="No diagnostic observations" columns={[
                  { label: 'When', render: o => dt(o.at) }, { label: 'Kind', render: o => label(o.kind) },
                  { label: 'Observation', render: o => (o.kind === 'dtc' ? <span><span className="mono">{o.code}</span> {o.description}</span> : `${o.component ? `${o.component} · ` : ''}${o.parameter}: ${o.value} ${o.unit}`) },
                  { label: 'Spec', render: o => (o.spec ? `${o.spec.min ?? '–'}…${o.spec.max ?? '–'} ${o.spec.unit || ''}` : '—') },
                  { label: 'Status', render: o => <StatusPill status={o.kind === 'dtc' ? o.status : o.result} /> },
                  { label: 'Source', render: o => <span className="small">{label(o.source || o.method || '')}{o.deviceId ? ` · ${o.deviceId.slice(0, 8)}` : ''}</span> },
                  { label: 'Odometer', render: o => o.odometer?.toLocaleString() ?? '—' }
                ]} /></div>
              </Card>
            </div>
          )}
          {tab === 'service_history' && (
            <Card title="Service history">
              <Table rows={w.serviceHistory} onRowClick={r => navigate(`#/app/ro/${r.id}`)} empty="No visits" columns={[
                { label: 'RO', render: r => <span className="mono">{r.roNumber}</span> }, { label: 'Date', render: r => d(r.date) }, { label: 'Type', render: r => <Badge tone={r.scheduled ? 'info' : 'warn'}>{r.scheduled ? 'Scheduled' : 'Unscheduled'}</Badge> },
                { label: 'Odometer', render: r => r.odometerIn?.toLocaleString() || '—' }, { label: 'Work', render: r => r.work.join(', ') || r.concerns.join('; ') },
                { label: 'Labor', right: true, render: r => (r.invoice ? money(r.invoice.laborCents) : '—') }, { label: 'Parts', right: true, render: r => (r.invoice ? money(r.invoice.partsCents) : '—') },
                { label: 'Covered', right: true, render: r => (r.invoice ? money(r.invoice.discountCents) : '—') }, { label: 'Invoice', right: true, render: r => (r.invoice ? money(r.invoice.totalCents) : '—') }
              ]} />
            </Card>
          )}
          {tab === 'membership_payments' && (
            <div className="grid-2">
              <Card title="Membership history"><Table rows={w.membershipPayments.lifecycle.map((e, i) => ({ ...e, _k: i }))} rowKey="_k" empty="No lifecycle events" columns={[{ label: 'When', render: e => dt(e.at) }, { label: 'Event', render: e => label(e.action) }, { label: 'Detail', render: e => <span className="small faint">{e.detail?.reason || e.detail?.invoiceNumber || (e.detail?.toPlanId ? `${e.detail.fromPlanId}@${e.detail.fromVersion} → ${e.detail.toPlanId}@${e.detail.toVersion}` : '')}</span> }]} /></Card>
              <Card title="Payments"><Table rows={w.membershipPayments.payments} empty="No payments" columns={[{ label: 'Receipt', render: p => <span className="mono">{p.receiptNumber}</span> }, { label: 'Date', render: p => d(p.receivedAt || p.createdAt) }, { label: 'Method', render: p => label(p.method) }, { label: 'Amount', right: true, render: p => money(p.amountCents) }, { label: 'Status', render: p => <StatusPill status={p.status} /> }]} /></Card>
              <Card title="Membership invoices"><Table rows={w.membershipPayments.membershipInvoices} empty="None" columns={[{ label: 'Invoice', render: i => <span className="mono">{i.invoiceNumber}</span> }, { label: 'Posted', render: i => d(i.postedAt) }, { label: 'Total', right: true, render: i => money(i.totals.totalCents) }, { label: 'Balance', right: true, render: i => money(i.balanceCents) }]} /></Card>
              <Card title="Benefits used"><Table rows={w.membershipPayments.entitlementUsage} empty="None" columns={[{ label: 'Entitlement', render: u => label(u.entitlementKey) }, { label: 'Value', right: true, render: u => money(u.valueCents) }, { label: 'When', render: u => d(u.createdAt) }]} /></Card>
            </div>
          )}
          {tab === 'finance' && (
            <div className="stack">
              {f.membership && <Card title="Membership lifetime"><EconomicsTable rows={[{ ...f.membership, label: 'Membership' }]} groupBy="scope" /></Card>}
              <Card title="Vehicle lifetime"><EconomicsTable rows={f.vehicle ? [{ ...f.vehicle, label: 'This vehicle' }] : []} groupBy="scope" /></Card>
              <Card title="Revenue, cost and profit by month"><BarChart data={f.byPeriod} x="key" series={[{ key: 'revenueCents', label: 'Revenue' }, { key: 'directCostCents', label: 'Direct cost', color: 'var(--warn)' }, { key: 'netProfitCents', label: 'Net profit', color: 'var(--ok)' }]} /></Card>
              <Card title="By service category"><EconomicsTable rows={f.byCategory} groupBy="serviceCategory" /></Card>
              <Card title={`Ledger events (${f.eventsTotal}) — the source of every figure`}><LedgerTable events={f.events} /><Definitions defs={f.definitions} /></Card>
            </div>
          )}
          {tab === 'code_history' && (
            <Card title="Trouble code history">
              <Table rows={w.codeHistory} rowKey="code" empty="No trouble codes recorded" columns={[
                { label: 'Code', render: c => <span className="mono">{c.code}</span> }, { label: 'Description', render: c => c.description || <span className="faint">no licensed description</span> },
                { label: 'Seen', right: true, render: c => `${c.count}× in ${c.sessions} visit(s)` }, { label: 'First / last', render: c => `${d(c.firstSeen)} – ${d(c.lastSeen)}` },
                { label: 'Recurring', render: c => (c.recurring ? <Badge tone="warn">Recurring</Badge> : '—') },
                { label: 'Confirmed fix', render: c => (c.confirmedFixes.length ? c.confirmedFixes.map(x => <div key={x.id} className="small"><StatusPill status={x.status} /> {x.rootCause}</div>) : '—') },
                { label: '', render: c => (c.recurredAfterFix ? <Badge tone="danger">Returned after fix</Badge> : null) }
              ]} />
            </Card>
          )}
          {tab === 'mileage_usage' && (
            <div className="stack">
              <div className="grid-3">
                <Stat label="Current odometer" value={w.mileage.current?.toLocaleString()} />
                <Stat label="Annualized mileage" value={w.mileage.milesPerYear?.toLocaleString() ?? '—'} hint={w.mileage.basis} />
                <Stat label="Projected in 12 months" value={w.mileage.projected.at(-1)?.odometer?.toLocaleString() ?? '—'} hint="Linear projection of observed rate" />
              </div>
              <Card title="Actual vs projected mileage">
                <LineChart series={[
                  { key: 'actual', label: 'Recorded odometer', points: w.mileage.history.filter(h => !h.flagged).map(h => ({ at: h.at, value: h.odometer })) },
                  ...(w.mileage.projected.length ? [{ key: 'proj', label: 'Projected', dashed: true, color: 'var(--violet)', points: [{ at: new Date().toISOString(), value: w.mileage.current }, ...w.mileage.projected.map(p => ({ at: p.at, value: p.odometer }))] }] : [])
                ]} markers={w.mileage.serviceMarkers.map(m => ({ at: m.at, label: `${m.roNumber} · ${m.odometer.toLocaleString()}${m.scheduled ? '' : ' (unscheduled)'}`, color: m.scheduled ? 'var(--muted)' : 'var(--warn)' }))} />
              </Card>
              <Card title="Readings"><Table rows={w.mileage.history.slice().reverse()} empty="No readings" columns={[{ label: 'When', render: h => dt(h.at) }, { label: 'Odometer', right: true, render: h => `${h.odometer.toLocaleString()} ${h.unit}` }, { label: 'Source', render: h => label(h.source) }, { label: '', render: h => (h.flagged ? <Badge tone="warn">Lower than previous</Badge> : null) }]} /></Card>
            </div>
          )}
          {tab === 'referrals' && <Referrals customerId={w.customer?.id} rows={w.referrals} onChange={s.reload} canManage={can('referrals:manage')} />}
          {tab === 'documents' && <Card title="Documents & reports"><Table rows={w.documents} empty="No documents" columns={[{ label: 'Kind', render: e => label(e.kind) }, { label: 'Name', render: e => e.originalName || e.caption || '—' }, { label: 'Visibility', render: e => <StatusPill status={e.visibility} /> }, { label: 'Captured', render: e => dt(e.capturedAt) }]} /></Card>}
          {tab === 'photos' && <Card title="Photos & video">{w.photos.length ? <div className="row wrap">{w.photos.map(e => <div key={e.id} style={{ width: 160 }}><EvidenceThumb evidence={e} /><div className="small faint">{e.caption} · {d(e.capturedAt)}</div></div>)}</div> : <Empty title="No photos" />}</Card>}
          {tab === 'customer_app_view' && <CustomerView vehicleId={id} />}
        </>
      );
    }}</Async>
  );
};

const Referrals = ({ customerId, rows, onChange, canManage }) => {
  const [run, busy] = useAction();
  const [form, setForm] = useState(null);
  const step = (r, status) => run(async () => { await api.patch(`/membership-intelligence/referrals/${r.id}`, { status }); onChange(); }, `Referral ${status}`);
  return (
    <Card title="Referrals made by this customer" actions={canManage && <Button size="sm" onClick={() => setForm({ referredName: '', referredContact: '' })}>Record referral</Button>}>
      <Table rows={rows} empty="No referrals" columns={[
        { label: 'Referred', render: r => r.referredName }, { label: 'Contact', render: r => r.referredContact || '—' }, { label: 'Status', render: r => <StatusPill status={r.status} /> },
        { label: 'Reward', right: true, render: r => (r.rewardCents ? money(r.rewardCents) : '—') }, { label: 'Date', render: r => d(r.createdAt) },
        { label: '', render: r => canManage && <div className="row">{r.status === 'pending' && <Button size="sm" onClick={() => step(r, 'qualified')}>Qualified</Button>}{r.status === 'qualified' && <Button size="sm" onClick={() => step(r, 'rewarded')}>Reward</Button>}{['pending', 'qualified'].includes(r.status) && <Button size="sm" variant="ghost" onClick={() => step(r, 'declined')}>Decline</Button>}</div> }
      ]} />
      <Modal open={Boolean(form)} title="Record referral" onClose={() => setForm(null)} footer={<Button variant="primary" loading={busy} onClick={() => run(async () => { await api.post('/membership-intelligence/referrals', { referrerCustomerId: customerId, ...form }); setForm(null); onChange(); }, 'Referral recorded')}>Save</Button>}>
        <Field label="Referred person"><Input value={form?.referredName || ''} onChange={e => setForm(x => ({ ...x, referredName: e.target.value }))} /></Field>
        <Field label="Phone or email (optional)"><Input value={form?.referredContact || ''} onChange={e => setForm(x => ({ ...x, referredContact: e.target.value }))} /></Field>
        <div className="small muted">The reward amount comes from the economics configuration when the referral is marked rewarded.</div>
      </Modal>
    </Card>
  );
};

// ---------------------------------------------------------------------------------------------
export const MembershipWorkspace = ({ id }) => {
  const { can } = useAuth();
  const [run, busy] = useAction();
  const [act, setAct] = useState(null);
  const s = useAsync(() => api.get(`/membership-intelligence/members/${id}`), [id]);
  const plans = useAsync(() => api.get('/membership-plans').then(r => r.plans), []);
  const doAct = () => run(async () => {
    const m = s.data.membership;
    const path = { change: 'change-plan', suspend: 'suspend', resume: 'resume' }[act.kind];
    const out = await api.post(`/memberships/${m.id}/${path}`, { reason: act.reason, planId: act.planId });
    setAct(null); s.reload();
    return out;
  }, 'Membership updated');
  return (
    <Async state={s}>{w => {
      const m = w.membership; const f = w.finance;
      return (
        <>
          <a href="#/app/intelligence" className="small">← Member intelligence</a>
          <PageHeader title={`${m.number} · ${w.customer?.name || ''}`} subtitle={`${w.plan?.name || 'Plan'} v${m.planVersion} · ${label(m.billingCycle)} · member since ${d(m.startedAt)} · period ends ${d(m.currentPeriodEnd)}`} actions={<>
            <StatusPill status={m.status} />
            {can('memberships:sell') && ['active', 'past_due'].includes(m.status) && <Button size="sm" loading={busy} onClick={() => run(async () => { await api.post(`/memberships/${m.id}/renew`); s.reload(); }, 'Renewed; invoice created')}>Renew</Button>}
            {can('memberships:sell') && ['active', 'past_due', 'suspended'].includes(m.status) && <Button size="sm" onClick={() => setAct({ kind: 'change', reason: '', planId: '' })}>Change plan</Button>}
            {can('memberships:sell') && ['active', 'past_due'].includes(m.status) && <Button size="sm" onClick={() => setAct({ kind: 'suspend', reason: '' })}>Suspend</Button>}
            {can('memberships:sell') && m.status === 'suspended' && <Button size="sm" onClick={() => setAct({ kind: 'resume', reason: '' })}>Resume</Button>}
            {(can('economics:config') || can('economics:adjust')) && <Button size="sm" loading={busy} onClick={() => run(async () => { const r = await api.post(`/membership-intelligence/recalculate/${m.id}`); s.reload(); return r; }, 'Recalculated and reconciled')}><RefreshCw size={13} />Recalculate</Button>}
          </>} />
          {f?.economics ? (
            <div className="grid-4">
              <Stat label="Membership revenue" value={money(f.economics.membershipRevenueCents)} hint={`Payments ${money(f.economics.membershipPaymentsCents)}`} />
              <Stat label="Customer-pay service revenue" value={money(f.economics.serviceRevenueCents)} hint={f.initialTicketRevenueCents != null ? `Initial ticket ${money(f.initialTicketRevenueCents)}` : undefined} />
              <Stat label="Total cost" value={money(f.economics.totalCostCents)} hint={`Direct ${money(f.economics.directCostCents)} · overhead ${money(f.economics.overheadCents)}`} />
              <Stat label="Net profit" value={money(f.economics.netProfitCents)} hint={`Lifetime margin ${pctText(f.economics.realizedMarginPct)}`} />
              <Stat label="Retail value delivered" value={money(f.economics.eligibleRetailValueCents)} />
              <Stat label="Customer savings" value={money(f.economics.customerSavingsCents)} hint={f.economics.netValueAfterMembershipFeesCents != null ? `Net value after fees ${money(f.economics.netValueAfterMembershipFeesCents)}` : undefined} />
              <Stat label="Utilization index" value={f.economics.utilizationIndex ?? '—'} />
              <Stat label="Cost variance" value={f.economics.costVarianceCents == null ? '—' : money(f.economics.costVarianceCents)} hint="Actual − standard" />
            </div>
          ) : f && <Alert tone="info">No economic events for this membership yet.</Alert>}
          <div className="grid-2">
            <Card title="Covered vehicles"><Table rows={w.vehicles} onRowClick={v => navigate(`#/app/intelligence/vehicle/${v.id}`)} columns={[{ label: 'Vehicle', render: v => `${v.year} ${v.make} ${v.model}` }, { label: 'VIN', render: v => <span className="mono small">{v.vin || '—'}</span> }, { label: 'Odometer', right: true, render: v => v.mileage?.toLocaleString() }]} /></Card>
            <Card title="Lifecycle"><Table rows={w.lifecycle.map((e, i) => ({ ...e, _k: i }))} rowKey="_k" empty="No lifecycle events" columns={[{ label: 'When', render: e => dt(e.at) }, { label: 'Event', render: e => label(e.action) }, { label: 'Detail', render: e => <span className="small faint">{e.detail?.reason || e.detail?.invoiceNumber || ''}</span> }]} /></Card>
            <Card title="Invoices"><Table rows={w.invoices} empty="None" columns={[{ label: 'Invoice', render: i => <span className="mono">{i.invoiceNumber}</span> }, { label: 'Posted', render: i => d(i.postedAt) }, { label: 'Total', right: true, render: i => money(i.totals.totalCents) }, { label: 'Balance', right: true, render: i => money(i.balanceCents) }]} /></Card>
            <Card title="Payments"><Table rows={w.payments} empty="None" columns={[{ label: 'Receipt', render: p => <span className="mono">{p.receiptNumber}</span> }, { label: 'Amount', right: true, render: p => money(p.amountCents) }, { label: 'Status', render: p => <StatusPill status={p.status} /> }, { label: 'Date', render: p => d(p.receivedAt || p.createdAt) }]} /></Card>
          </div>
          {f && <>
            <Card title="By month"><BarChart data={f.byPeriod} x="key" series={[{ key: 'revenueCents', label: 'Revenue' }, { key: 'totalCostCents', label: 'Total cost', color: 'var(--warn)' }, { key: 'netProfitCents', label: 'Net profit', color: 'var(--ok)' }]} /></Card>
            <Card title="By service category"><EconomicsTable rows={f.byServiceCategory} groupBy="serviceCategory" /><Definitions defs={f.definitions} /></Card>
          </>}
          <Modal open={Boolean(act)} title={act?.kind === 'change' ? 'Change plan' : label(act?.kind || '')} onClose={() => setAct(null)} footer={<Button variant="primary" loading={busy} onClick={doAct}>Confirm</Button>}>
            {act?.kind === 'change' && <Field label="New plan"><Select value={act.planId} placeholder="Choose a plan" options={(plans.data || []).map(p => ({ value: p.planId, label: `${p.name} v${p.version}` }))} onChange={e => setAct(a => ({ ...a, planId: e.target.value }))} /></Field>}
            {act?.kind === 'change' && <div className="small muted">Coverage follows the new plan immediately; the new price applies at the next renewal.</div>}
            {act?.kind === 'suspend' && <Alert tone="warn">While suspended, membership entitlements are not applied to new estimates.</Alert>}
            <Field label="Reason (required)"><Textarea value={act?.reason || ''} onChange={e => setAct(a => ({ ...a, reason: e.target.value }))} /></Field>
          </Modal>
        </>
      );
    }}</Async>
  );
};

// Card on the vehicle page: customer value + risk band and recommended actions (no internal economics for advisors).
export const MemberValueCard = ({ id }) => {
  const s = useAsync(() => api.get(`/membership-intelligence/vehicles/${id}`).catch(() => null), [id]);
  const w = s.data;
  if (!w) return null;
  const sn = w.risk?.snapshot;
  const actions = w.risk?.interventions || [];
  return (
    <Card title="Member value & service outlook" actions={<>{sn && <BandBadge band={sn.override?.band || sn.band} />}<a className="small" href={`#/app/intelligence/vehicle/${id}`}>Open workspace</a></>}>
      <div className="grid-3 small">
        {w.customerValue && kv('Membership savings to date', money(w.customerValue.customerSavingsCents))}
        {w.customerValue && kv('Covered retail value', money(w.customerValue.eligibleRetailValueCents))}
        {kv('Next likely services', sn?.nextLikelyServices?.map(n => n.title).join(', ') || w.recommendedMaintenance.map(r => r.title).join(', ') || '—')}
      </div>
      {actions.map(i => <div key={i.id} className="row between small" style={{ marginTop: 6 }}><span>Recommended: {i.recommendedAction}</span><StatusPill status={i.status} /></div>)}
    </Card>
  );
};
