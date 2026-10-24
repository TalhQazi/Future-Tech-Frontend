import React, { useState } from 'react';
import { Phone, Mail, MapPin, Car, Copy, Crown, CheckCircle2, RefreshCw } from 'lucide-react';
import { api } from '../../../api/client.js';
import { navigate } from '../../../router.js';
import { useAuth } from '../../auth.jsx';
import { Tabs, Async, useAsync, Button, Badge, StatusPill, Table, Card, money, d, dt, label, vehicleName, useToast } from '../../ui.jsx';
import { OverviewTab } from './OverviewTab.jsx';
import { InspectionTab } from './InspectionTab.jsx';
import { DiagnosticsTab } from './DiagnosticsTab.jsx';
import { EstimateTab } from './EstimateTab.jsx';
import { WorkTab } from './WorkTab.jsx';
import { InvoiceTab } from './InvoiceTab.jsx';
import { RoMessages } from './RoMessages.jsx';
import { MemberValueCard } from '../IntelWorkspace.jsx';

const LEGACY_TABS = { overview: 'workflow', work: 'labor', invoice: 'payment' };
const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('') || '?';
const years = (from) => (from ? Math.floor((Date.now() - new Date(from)) / (365.25 * 86400000) * 10) / 10 : null);

// Financial view of the estimate: current version, else priced draft.
export const estimateFigures = (est) => {
  const v = est?.currentVersion;
  const totals = v?.totals || est?.draftPreview?.totals || null;
  const evaluation = v?.membershipEvaluation || est?.draftPreview?.membershipEvaluation || null;
  return { totals, evaluation, source: v ? `version ${v.versionNumber}` : totals ? 'draft (not sent)' : null };
};

const RoHeader = ({ ro, setTab }) => {
  const { can } = useAuth();
  const toast = useToast();
  const c = ro.customer;
  const v = ro.vehicle || {};
  const m = ro.membership;
  const copyVin = () => navigator.clipboard?.writeText(v.vin || '').then(() => toast.success('VIN copied')).catch(() => {});
  return (
    <div className="ft-ro-head">
      <section>
        <div className="row" style={{ alignItems: 'flex-start', gap: 12 }}>
          <div className="ft-ro-avatar">{initials(c?.name)}</div>
          <div className="stack-sm" style={{ minWidth: 0 }}>
            <div className="row wrap"><h2>{c?.name || '—'}</h2>{m && <Badge tone={m.status === 'active' ? 'solid-ok' : 'warn'}>{m.status === 'active' ? 'Active Member' : label(m.status)}</Badge>}</div>
            {c?.contactRestricted ? <span className="small faint">Contact details restricted</span> : <>
              {c?.phone && <div className="line"><Phone size={14} />{c.phone}</div>}
              {c?.email && <div className="line truncate"><Mail size={14} />{c.email}</div>}
              {c?.address && <div className="line"><MapPin size={14} />{c.address}</div>}
            </>}
          </div>
        </div>
        {c && <div><Button size="sm" onClick={() => navigate(`#/app/customers/${c.id}`)}>View Customer</Button></div>}
      </section>
      <section>
        <div className="row" style={{ alignItems: 'flex-start', gap: 14 }}>
          <div className="ft-veh-thumb"><Car size={54} strokeWidth={1.3} /></div>
          <div className="stack-sm" style={{ minWidth: 0 }}>
            <h2>{vehicleName(v)} {v.trim || ''}</h2>
            <div className="row small"><span className="muted">VIN:</span><span className="mono">{v.vin || 'not recorded'}</span>{v.vin && <Button size="sm" variant="ghost" onClick={copyVin} aria-label="Copy VIN"><Copy size={13} /></Button>}</div>
            <div className="ft-spec">
              <span>Mileage:</span><strong>{(ro.odometerIn ?? v.mileage)?.toLocaleString() ?? '—'} {v.mileageUnit || 'mi'}</strong>
              <span>Engine:</span><strong>{v.engine || '—'}</strong>
              <span>Color:</span><strong>{v.color || '—'}</strong>
              <span>Plate:</span><strong>{v.licensePlate ? `${v.licensePlate}${v.plateState ? ` (${v.plateState})` : ''}` : '—'}</strong>
            </div>
          </div>
        </div>
        <div className="row">
          {v.id && <Button size="sm" onClick={() => navigate(`#/app/vehicles/${v.id}`)}>View Vehicle</Button>}
          {v.id && can('intelligence:vehicle') && <Button size="sm" variant="ghost" onClick={() => navigate(`#/app/intelligence/vehicle/${v.id}`)}>Vehicle intelligence</Button>}
        </div>
      </section>
      <section>
        <div className="grid-2" style={{ gap: 8 }}>
          <div className="ft-kv"><span>Repair Order #</span><div className="ft-ro-num mono">{ro.roNumber}</div></div>
          <div className="ft-kv"><span>Status</span><button type="button" className="ft-chip" style={{ justifyContent: 'center' }} onClick={() => setTab('workflow')} title="Change status in Workflow"><StatusPill status={ro.status} /></button></div>
          <div className="ft-kv"><span>Advisor</span><div className="ft-box">{ro.advisor?.name || '—'}</div></div>
          <div className="ft-kv"><span>Technician</span><div className="ft-box">{ro.assignedTech?.name || 'Unassigned'}</div></div>
          <div className="ft-kv"><span>Date In</span><div className="ft-box">{d(ro.createdAt)}</div></div>
          <div className="ft-kv"><span>Target Date</span><div className="ft-box">{ro.promisedAt ? d(ro.promisedAt) : '—'}</div></div>
        </div>
        {ro.openSafetyEscalations > 0 && <Badge tone="danger">{ro.openSafetyEscalations} open safety escalation(s)</Badge>}
      </section>
      <section>
        <h2 style={{ fontSize: 15 }}>Membership Auto</h2>
        {m ? <>
          <div className="row" style={{ gap: 12 }}>
            <div className="ft-crown"><Crown size={28} /></div>
            <div className="stack-sm">
              <div className="row wrap"><strong style={{ fontSize: 16 }}>{m.planName || 'Membership'}</strong><Badge tone={m.status === 'active' ? 'solid-ok' : 'warn'}>{label(m.status)}</Badge></div>
              <span className="small mono faint">{m.number}</span>
              <span className="small muted">Member since {d(m.startedAt)}{years(m.startedAt) != null ? ` (${years(m.startedAt)} years)` : ''}</span>
              <span className="small faint">Renews {d(m.currentPeriodEnd)}</span>
            </div>
          </div>
          <Button size="sm" variant="primary" onClick={() => navigate(can('intelligence:vehicle') ? `#/app/intelligence/membership/${m.id}` : '#/app/memberships')}>View Membership</Button>
        </> : <>
          <div className="row" style={{ gap: 12 }}><div className="ft-crown" style={{ filter: 'grayscale(1)', opacity: 0.5 }}><Crown size={28} /></div><span className="small muted">Not a member. Membership benefits are applied automatically once enrolled.</span></div>
          {c && can('memberships:sell') && <Button size="sm" variant="primary" onClick={() => navigate(`#/app/memberships?customerId=${c.id}`)}>Enroll in Membership Auto</Button>}
        </>}
      </section>
    </div>
  );
};

const RoFooter = ({ ro, est }) => {
  const v = ro.vehicle || {};
  const { totals: t, evaluation, source } = estimateFigures(est);
  const misc = t ? (t.feesCents || 0) + (t.subletCents || 0) : 0;
  const applied = evaluation?.applied || [];
  const covered = applied.reduce((s, a) => s + (a.discountCents || 0), 0);
  return (
    <div className="ft-ro-foot">
      <div className="ft-panel">
        <h4>Vehicle Information</h4>
        <div className="body grid-2" style={{ gap: 8 }}>
          <div className="ft-kvt"><span>Year</span><strong>{v.year || '—'}</strong><span>Make</span><strong>{v.make || '—'}</strong><span>Model</span><strong>{v.model || '—'}</strong><span>Submodel</span><strong>{v.trim || '—'}</strong><span>Engine</span><strong>{v.engine || '—'}</strong></div>
          <div className="ft-kvt"><span>Transmission</span><strong>{v.transmission || '—'}</strong><span>Drive Type</span><strong>{v.driveType || '—'}</strong><span>Body Style</span><strong>{v.bodyClass || '—'}</strong><span>Color</span><strong>{v.color || '—'}</strong><span>Fuel</span><strong>{v.fuelType || '—'}</strong></div>
        </div>
      </div>
      <div className="ft-panel">
        <h4>Mileage & Service</h4>
        <div className="body ft-kvt">
          <span>Current</span><strong>{(ro.odometerIn ?? v.mileage)?.toLocaleString() ?? '—'}</strong>
          <span>Last Service</span><strong>{ro.lastService ? `${ro.lastService.odometer != null ? ro.lastService.odometer.toLocaleString() : '—'} (${d(ro.lastService.date)})` : 'No previous visit'}</strong>
          {ro.upcomingServices?.length ? ro.upcomingServices.slice(0, 3).map((s, i) => (
            <React.Fragment key={i}><span>{i === 0 ? 'Next Service' : 'Recommended'}</span><strong>{s.dueMileage ? s.dueMileage.toLocaleString() : s.dueAt ? d(s.dueAt) : ''} ({s.title})</strong></React.Fragment>
          )) : <><span>Next Service</span><strong className="faint">No maintenance rule due</strong></>}
        </div>
      </div>
      <div className="ft-panel">
        <h4>RO Financials {source && <span className="small faint" style={{ fontWeight: 500 }}>· {source}</span>}</h4>
        <div className="body">
          {t ? <>
            <div className="ft-kvt"><span>Labor</span><strong>{money(t.laborCents)}</strong><span>Parts</span><strong>{money(t.partsCents)}</strong><span>Misc.</span><strong>{money(misc)}</strong>{t.discountCents > 0 && <><span>Member discount</span><strong style={{ color: 'var(--ok)' }}>−{money(t.discountCents)}</strong></>}<span>Subtotal</span><strong>{money(t.subtotalCents)}</strong><span>Tax</span><strong>{money(t.taxCents)}</strong></div>
            <div className="ft-total-bar"><span>Total</span><span>{money(t.totalCents)}</span></div>
          </> : <span className="small muted">No priced estimate yet.</span>}
        </div>
      </div>
      <div className="ft-panel">
        <div className="ft-impact-title"><Crown size={14} />Membership Auto Impact</div>
        <div className="body ft-impact">
          <div className="stack-sm" style={{ alignContent: 'center' }}>
            <div className="row"><CheckCircle2 size={16} color="var(--ok)" />Covered Services<strong>{applied.length} item{applied.length === 1 ? '' : 's'}</strong></div>
            <div className="row"><CheckCircle2 size={16} color="var(--ok)" />Membership Auto Pays<strong>{money(covered)}</strong></div>
            <div className="row"><CheckCircle2 size={16} color="var(--ok)" />Customer Due<strong>{t ? money(t.totalCents) : '—'}</strong></div>
          </div>
          <div className="ft-savings">Customer Savings<strong>{money(covered)}</strong></div>
        </div>
      </div>
    </div>
  );
};

const PartsTab = ({ ro, est }) => {
  const lines = (est?.estimate?.draftLines?.length ? est.estimate.draftLines : est?.currentVersion?.lines || []).filter(l => l.kind === 'part');
  return (
    <div className="stack">
      <Card title="Parts on this repair order"><Table rows={lines} empty="No parts on the estimate" columns={[{ label: 'Part #', render: l => <span className="mono">{l.partNumber || '—'}</span> }, { label: 'Description', render: l => l.description }, { label: 'Qty', right: true, render: l => l.quantity }, { label: 'Unit price', right: true, render: l => money(l.unitPriceCents) }, { label: 'Linked to stock', render: l => (l.partId ? <Badge tone="ok">Catalog</Badge> : <Badge>Manual</Badge>) }]} /></Card>
      <div className="grid-2">
        <Card title="Reservations"><Table rows={ro.reservations || []} empty="No stock reserved" columns={[{ label: 'Part', render: r => <span className="mono">{r.partNumber || r.partId?.slice(0, 8)}</span> }, { label: 'Qty', right: true, render: r => r.quantity }, { label: 'Issued', right: true, render: r => r.issuedQuantity || 0 }, { label: 'Status', render: r => <StatusPill status={r.status} /> }]} /></Card>
        <Card title="Part requests"><Table rows={ro.partRequests || []} empty="No part requests" columns={[{ label: 'Part', render: r => <span><span className="mono">{r.partNumber || '—'}</span> {r.description}</span> }, { label: 'Qty', right: true, render: r => r.quantity }, { label: 'Urgency', render: r => <StatusPill status={r.urgency} /> }, { label: 'Status', render: r => <StatusPill status={r.status} /> }]} /></Card>
      </div>
    </div>
  );
};

const HistoryTab = ({ ro }) => {
  const h = useAsync(() => (ro.vehicle?.id ? api.get(`/vehicles/${ro.vehicle.id}/history`) : Promise.resolve(null)), [ro.vehicle?.id]);
  return (
    <div className="grid-2">
      <Card title="This repair order"><div className="ft-timeline">{(ro.timeline || []).slice().reverse().map((t, i) => <div key={i}><div className="small">{t.summary}</div><div className="small faint">{dt(t.at)}{t.byName ? ` · ${t.byName}` : ''}</div></div>)}</div></Card>
      <Card title="Vehicle service history">
        <Async state={h}>{data => <Table rows={(data?.visits || []).filter(x => x.roId !== ro.id)} rowKey="roId" onRowClick={r => navigate(`#/app/ro/${r.roId}`)} empty="No previous visits" columns={[{ label: 'RO', render: r => <span className="mono">{r.roNumber}</span> }, { label: 'Date', render: r => d(r.date) }, { label: 'Odometer', right: true, render: r => r.odometerIn?.toLocaleString() || '—' }, { label: 'Work', render: r => r.jobs.map(j => j.title).join(', ') || '—' }, { label: 'Total', right: true, render: r => (r.invoice ? money(r.invoice.totalCents) : '—') }]} />}</Async>
      </Card>
    </div>
  );
};

const MembershipTab = ({ ro, est }) => {
  const { evaluation } = estimateFigures(est);
  const lines = est?.currentVersion?.lines || est?.draftPreview?.lines || [];
  const lineName = (id) => lines.find(l => l.id === id)?.description || id;
  return (
    <div className="stack">
      {ro.vehicle?.id && <MemberValueCard id={ro.vehicle.id} />}
      <Card title="Membership benefits on this estimate">
        {evaluation ? <>
          <div className="small muted" style={{ marginBottom: 8 }}>{evaluation.memberships?.map(mm => `${mm.number} · ${mm.planName} v${mm.planVersion}`).join(', ') || 'No active membership applied'} · rules engine {evaluation.engineVersion}</div>
          <Table rows={(evaluation.applied || []).map((a, i) => ({ ...a, _k: i }))} rowKey="_k" empty="No benefits applied" columns={[{ label: 'Line', render: a => lineName(a.lineId) }, { label: 'Benefit', render: a => label(a.entitlementKey) }, { label: 'Source', render: a => <span className="small faint">{a.source}</span> }, { label: 'Covered', right: true, render: a => <strong style={{ color: 'var(--ok)' }}>{money(a.discountCents)}</strong> }]} />
          {evaluation.notApplied?.length > 0 && <div className="small faint" style={{ marginTop: 8 }}>Not applied: {evaluation.notApplied.map(n => `${label(n.entitlementKey || '')} — ${n.reason}`).join('; ')}</div>}
        </> : <span className="small muted">Benefits are evaluated when the estimate is priced.</span>}
      </Card>
    </div>
  );
};

export const RoWorkspace = ({ id, query }) => {
  const { can } = useAuth();
  const s = useAsync(() => api.get(`/repair-orders/${id}`).then(r => r.repairOrder), [id]);
  const est = useAsync(() => (can('estimates:read') ? api.get(`/repair-orders/${id}/estimate`) : Promise.resolve(null)), [id]);
  const tabs = [
    can('estimates:read') && { key: 'estimate', label: 'Estimate' },
    { key: 'labor', label: 'Labor' },
    can('estimates:read') && { key: 'parts', label: 'Parts' },
    can('diagnostics:read') && { key: 'diagnostics', label: 'Diagnostics' },
    can('inspections:read') && { key: 'inspection', label: 'Inspection' },
    { key: 'history', label: 'History' },
    can('invoices:read') && { key: 'payment', label: 'Payment' },
    { key: 'membership', label: <><Crown size={14} color="var(--gold)" />Membership Auto</> },
    { key: 'workflow', label: 'Workflow' },
    can('messages:read') && { key: 'messages', label: 'Messages' }
  ].filter(Boolean);
  const initial = LEGACY_TABS[query?.tab] || query?.tab;
  const [tab, setTab] = useState(tabs.some(t => t.key === initial) ? initial : tabs[0].key);
  const reloadAll = () => { s.reload(); est.reload(); };

  return (
    <Async state={s}>{ro => (
      <>
        <div className="row between"><a href="#/app/board" className="small">← Repair orders</a><Button size="sm" variant="ghost" onClick={reloadAll}><RefreshCw size={13} />Refresh</Button></div>
        <RoHeader ro={ro} setTab={setTab} />
        <div className="ft-ro-tabs">
          <Tabs tabs={tabs} active={tab} onChange={setTab} />
          <div className="ft-ro-body">
            {tab === 'estimate' && <EstimateTab ro={ro} reloadRo={s.reload} est={est} setTab={setTab} />}
            {tab === 'labor' && <WorkTab ro={ro} setRo={s.setData} reload={s.reload} />}
            {tab === 'parts' && <PartsTab ro={ro} est={est.data} />}
            {tab === 'diagnostics' && <DiagnosticsTab ro={ro} />}
            {tab === 'inspection' && <InspectionTab ro={ro} reloadRo={s.reload} />}
            {tab === 'history' && <HistoryTab ro={ro} />}
            {tab === 'payment' && <InvoiceTab ro={ro} reloadRo={s.reload} />}
            {tab === 'membership' && <MembershipTab ro={ro} est={est.data} />}
            {tab === 'workflow' && <OverviewTab ro={ro} reload={s.reload} setRo={s.setData} />}
            {tab === 'messages' && <RoMessages ro={ro} />}
          </div>
        </div>
        <RoFooter ro={ro} est={est.data} />
      </>
    )}</Async>
  );
};
