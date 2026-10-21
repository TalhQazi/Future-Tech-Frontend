import React, { useEffect, useState } from 'react';
import { ShieldAlert, Plus } from 'lucide-react';
import { api } from '../../../api/client.js';
import { useAuth } from '../../auth.jsx';
import { useWorkspace } from '../../Shell.jsx';
import { Card, Button, Field, Input, Select, Textarea, StatusPill, Badge, Modal, Alert, Table, useAction, useConfirm, dt, label, money } from '../../ui.jsx';

const NEXT = {
  checked_in: ['inspecting', 'diagnosing', 'awaiting_approval'],
  inspecting: ['diagnosing', 'awaiting_approval'],
  diagnosing: ['inspecting', 'awaiting_approval'],
  awaiting_approval: ['inspecting', 'diagnosing'],
  approved: ['in_progress', 'waiting_parts'],
  in_progress: ['waiting_parts', 'quality_check'],
  waiting_parts: ['in_progress'],
  quality_check: [],
  ready_for_pickup: ['in_progress']
};

const QC_ITEMS = ['All customer concerns verified resolved', 'Wheels torqued to specification', 'Fluid levels checked', 'No warning lights / codes after repair', 'Vehicle clean and protective covers removed'];

export const OverviewTab = ({ ro, setRo }) => {
  const { can } = useAuth();
  const { location } = useWorkspace();
  const confirm = useConfirm();
  const [run, busy] = useAction();
  const [techs, setTechs] = useState([]);
  const [newConcern, setNewConcern] = useState('');
  const [esc, setEsc] = useState(null);
  const [qc, setQc] = useState(null);
  const [closeForm, setCloseForm] = useState(null);
  const open = !['closed', 'cancelled'].includes(ro.status);
  useEffect(() => { if (can('ros:dispatch')) api.get('/users', { role: 'technician', locationId: ro.locationId, status: 'active' }).then(r => setTechs(r.users)).catch(() => {}); }, [ro.locationId, can]);

  const apply = (p, msg) => run(async () => setRo((await p).repairOrder), msg);
  const move = async (status) => {
    let reason;
    if (ro.status === 'ready_for_pickup') {
      const c = await confirm({ title: 'Reopen work after QC?', message: 'The vehicle passed QC. Reopening requires a manager and a reason.', reason: true });
      if (!c) return;
      reason = c.reason;
    }
    apply(api.post(`/repair-orders/${ro.id}/status`, { status, reason }, { ifMatch: ro.version }), `Moved to ${label(status)}`);
  };
  const cancel = async () => {
    const c = await confirm({ title: `Cancel ${ro.roNumber}?`, message: 'Reservations are released and open part requests cancelled.', reason: 'Cancellation reason', tone: 'danger', confirmLabel: 'Cancel repair order' });
    if (c) apply(api.post(`/repair-orders/${ro.id}/cancel`, { reason: c.reason }), 'Repair order cancelled');
  };
  const escAction = async (escId, action, extra = {}) => {
    if (action === 'customer_decision' && extra.decision === 'declined') {
      const c = await confirm({ title: 'Record declined safety repair', message: 'The customer is declining a safety-critical repair. Document the conversation (or attach a signed waiver).', reason: 'What the customer was told and said', tone: 'danger', confirmLabel: 'Record decline' });
      if (!c) return;
      extra.note = c.reason;
    }
    apply(api.post(`/repair-orders/${ro.id}/safety-escalations/${escId}`, { action, ...extra }), 'Safety escalation updated');
  };

  return (
    <div className="grid-2">
      <div className="stack">
        <Card title="Concerns · Cause · Correction">
          <div className="stack">
            {ro.concerns.map(c => <Concern key={c.id} ro={ro} concern={c} onSaved={setRo} canEdit={open && (can('ros:write') || can('jobs:execute'))} />)}
            {open && (can('ros:write') || can('jobs:execute')) && (
              <div className="row"><Input placeholder="Add a concern" value={newConcern} onChange={e => setNewConcern(e.target.value)} />
                <Button disabled={!newConcern.trim()} onClick={() => { apply(api.post(`/repair-orders/${ro.id}/concerns`, { text: newConcern }), 'Concern added'); setNewConcern(''); }}><Plus size={14} />Add</Button></div>
            )}
          </div>
        </Card>

        <Card title="Safety" actions={open && can('ros:safety') && <Button size="sm" variant="danger" onClick={() => setEsc({ severity: 'critical', description: '' })}><ShieldAlert size={14} />Raise escalation</Button>}>
          {ro.safetyEscalations?.length ? ro.safetyEscalations.map(s => (
            <div key={s.id} className="ft-alert danger" style={{ marginBottom: 8 }}>
              <div className="stack-sm grow">
                <div className="row between"><strong>{label(s.severity)}: {s.description}</strong><StatusPill status={s.status} /></div>
                <span className="small muted">Raised {dt(s.raisedAt)}{s.customerNotifiedAt ? ` · customer notified ${dt(s.customerNotifiedAt)} (${s.customerNotificationMethod})` : ''}{s.customerDecision?.decision ? ` · customer: ${s.customerDecision.decision}` : ''}</span>
                {can('ros:write') && s.status !== 'resolved' && (
                  <div className="row wrap">
                    {s.status === 'open' && <Button size="sm" onClick={() => escAction(s.id, 'acknowledge')}>Acknowledge</Button>}
                    {!s.customerNotifiedAt && ['phone', 'in_person', 'sms', 'email'].map(m => <Button key={m} size="sm" onClick={() => escAction(s.id, 'customer_notified', { method: m })}>Notified by {label(m)}</Button>)}
                    {s.customerNotifiedAt && !s.customerDecision?.decision && <><Button size="sm" onClick={() => escAction(s.id, 'customer_decision', { decision: 'repair' })}>Customer approves repair</Button><Button size="sm" variant="danger" onClick={() => escAction(s.id, 'customer_decision', { decision: 'declined' })}>Customer declines</Button></>}
                    <Button size="sm" onClick={async () => { const c = await confirm({ title: 'Resolve escalation', reason: 'Resolution' }); if (c) escAction(s.id, 'resolve', { resolution: c.reason }); }}>Resolve</Button>
                  </div>
                )}
              </div>
            </div>
          )) : <p className="muted">No safety escalations.</p>}
        </Card>

        <Card title="Timeline">
          <div className="ft-timeline">{[...ro.timeline].reverse().map((t, i) => <div key={i}><div>{t.summary}</div><div className="small faint">{dt(t.at)}{t.byName ? ` · ${t.byName}` : ''}{t.customerVisible ? ' · customer visible' : ''}</div></div>)}</div>
        </Card>
      </div>

      <div className="stack">
        <Card title="Status">
          <div className="stack">
            <div className="row"><StatusPill status={ro.status} />{ro.estimate && <span className="small muted">Estimate {label(ro.estimate.status)} · {money(ro.estimate.totals?.totalCents)}</span>}</div>
            {open && can('ros:write') && (
              <div className="row wrap">
                {(NEXT[ro.status] || []).map(st => <Button key={st} size="sm" loading={busy} onClick={() => move(st)}>→ {label(st)}</Button>)}
                {ro.status === 'quality_check' && can('ros:qc') && <Button size="sm" variant="primary" onClick={() => setQc(Object.fromEntries(QC_ITEMS.map(i => [i, true])))}>Record QC</Button>}
                {ro.status === 'ready_for_pickup' && can('ros:close') && <Button size="sm" variant="primary" onClick={() => setCloseForm({ odometerOut: '' })}>Close & release vehicle</Button>}
                <Button size="sm" variant="danger" onClick={cancel}>Cancel RO</Button>
              </div>
            )}
          </div>
        </Card>

        {open && can('ros:dispatch') && (
          <Card title="Dispatch">
            <div className="grid-2">
              <Field label="Technician"><Select value={ro.assignedTechId || ''} placeholder="Unassigned" options={techs.map(t => ({ value: t.id, label: t.name }))} onChange={e => apply(api.post(`/repair-orders/${ro.id}/dispatch`, { assignedTechId: e.target.value || null }), 'Technician assigned')} /></Field>
              <Field label="Bay"><Select value={ro.bayId || ''} placeholder="No bay" options={(location?.bays || []).filter(b => b.active !== false).map(b => ({ value: b.id, label: b.name }))} onChange={e => apply(api.post(`/repair-orders/${ro.id}/dispatch`, { bayId: e.target.value || null }), 'Bay updated')} /></Field>
              <Field label="Priority"><Select value={ro.priority} options={['normal', 'high', 'urgent']} onChange={e => apply(api.post(`/repair-orders/${ro.id}/dispatch`, { priority: e.target.value }), 'Priority updated')} /></Field>
            </div>
          </Card>
        )}

        <Card title="Intake">
          <div className="grid-2 small">
            <div className="ft-kv"><span>Odometer in</span><strong>{ro.odometerIn?.toLocaleString() ?? '—'}</strong></div>
            <div className="ft-kv"><span>Fuel</span><strong>{ro.fuelLevel || '—'}</strong></div>
            <div className="ft-kv"><span>Key tag</span><strong>{ro.keyTag || '—'}</strong></div>
            <div className="ft-kv"><span>Transportation</span><strong>{label(ro.transportation)}</strong></div>
            <div className="ft-kv"><span>Advisor</span><strong>{ro.advisor?.name || '—'}</strong></div>
            <div className="ft-kv"><span>Opened</span><strong>{dt(ro.createdAt)}</strong></div>
          </div>
          {ro.advisorNotes && <p className="muted small" style={{ marginTop: 10 }}>{ro.advisorNotes}</p>}
        </Card>

        {ro.partRequests?.length > 0 && (
          <Card title="Parts">
            <Table rows={ro.partRequests} columns={[{ label: 'Part', render: p => `${p.quantity} × ${p.description}` }, { label: 'Status', render: p => <StatusPill status={p.status} /> }]} />
          </Card>
        )}
      </div>

      <Modal open={Boolean(esc)} title="Raise safety escalation" onClose={() => setEsc(null)} footer={<><Button onClick={() => setEsc(null)}>Cancel</Button><Button variant="danger" disabled={!esc?.description?.trim()} loading={busy} onClick={() => { apply(api.post(`/repair-orders/${ro.id}/safety-escalations`, esc), 'Escalation raised; manager and advisor notified'); setEsc(null); }}>Raise escalation</Button></>}>
        <Field label="Severity"><Select value={esc?.severity} onChange={e => setEsc(x => ({ ...x, severity: e.target.value }))} options={['critical', 'high']} /></Field>
        <Field label="What is unsafe"><Textarea value={esc?.description || ''} onChange={e => setEsc(x => ({ ...x, description: e.target.value }))} /></Field>
      </Modal>

      <Modal open={Boolean(qc)} title="Quality check" onClose={() => setQc(null)} footer={<>
        <Button onClick={() => setQc(null)}>Cancel</Button>
        <Button variant="danger" onClick={() => { apply(api.post(`/repair-orders/${ro.id}/qc`, { checklist: QC_ITEMS.map(i => ({ item: i, passed: qc[i] })), passed: false, roadTestPerformed: qc.road, notes: qc.notes }), 'QC failed; work reopened'); setQc(null); }}>Fail QC</Button>
        <Button variant="primary" disabled={!QC_ITEMS.every(i => qc?.[i])} onClick={() => { apply(api.post(`/repair-orders/${ro.id}/qc`, { checklist: QC_ITEMS.map(i => ({ item: i, passed: true })), passed: true, roadTestPerformed: qc.road, notes: qc.notes }), 'QC passed; ready for pickup'); setQc(null); }}>Pass QC</Button>
      </>}>
        {QC_ITEMS.map(i => <label key={i} className="row"><input type="checkbox" checked={Boolean(qc?.[i])} onChange={e => setQc(x => ({ ...x, [i]: e.target.checked }))} />{i}</label>)}
        <label className="row"><input type="checkbox" checked={Boolean(qc?.road)} onChange={e => setQc(x => ({ ...x, road: e.target.checked }))} />Road test performed</label>
        <Field label="Notes"><Textarea value={qc?.notes || ''} onChange={e => setQc(x => ({ ...x, notes: e.target.value }))} /></Field>
      </Modal>

      <Modal open={Boolean(closeForm)} title={`Close ${ro.roNumber}`} onClose={() => setCloseForm(null)} footer={<><Button onClick={() => setCloseForm(null)}>Cancel</Button><Button variant="primary" loading={busy} onClick={() => run(async () => {
        const res = await api.action(`/repair-orders/${ro.id}/close`, { odometerOut: closeForm.odometerOut ? Number(closeForm.odometerOut) : undefined, overrideReason: closeForm.overrideReason || undefined });
        setRo(res.repairOrder);
        setCloseForm(null);
      }, 'Vehicle released')}>Close repair order</Button></>}>
        {ro.invoice && ro.invoice.balanceCents > 0 && <Alert tone="warn">Open balance {money(ro.invoice.balanceCents)}. A manager may release on account with a reason.</Alert>}
        <Field label="Odometer out"><Input inputMode="numeric" value={closeForm?.odometerOut || ''} onChange={e => setCloseForm(x => ({ ...x, odometerOut: e.target.value }))} /></Field>
        {ro.invoice && ro.invoice.balanceCents > 0 && can('ros:override') && <Field label="Release on account — reason"><Textarea value={closeForm?.overrideReason || ''} onChange={e => setCloseForm(x => ({ ...x, overrideReason: e.target.value }))} /></Field>}
      </Modal>
    </div>
  );
};

const Concern = ({ ro, concern, onSaved, canEdit }) => {
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState({ cause: concern.cause, correction: concern.correction });
  const [run, busy] = useAction();
  return (
    <div className="ft-card" style={{ background: 'var(--surface-2)', padding: 12 }}>
      <div className="row between"><strong>{concern.text}</strong><Badge>{concern.source}</Badge></div>
      {edit ? (
        <div className="stack" style={{ marginTop: 8 }}>
          <Field label="Cause"><Textarea value={f.cause} onChange={e => setF(x => ({ ...x, cause: e.target.value }))} /></Field>
          <Field label="Correction"><Textarea value={f.correction} onChange={e => setF(x => ({ ...x, correction: e.target.value }))} /></Field>
          <div className="row"><Button size="sm" variant="primary" loading={busy} onClick={() => run(async () => { onSaved((await api.patch(`/repair-orders/${ro.id}/concerns/${concern.id}`, f)).repairOrder); setEdit(false); }, 'Saved')}>Save</Button><Button size="sm" onClick={() => setEdit(false)}>Cancel</Button></div>
        </div>
      ) : (
        <div className="small" style={{ marginTop: 6 }}>
          <div><span className="faint">Cause:</span> {concern.cause || '—'}</div>
          <div><span className="faint">Correction:</span> {concern.correction || '—'}</div>
          {canEdit && <Button size="sm" variant="ghost" onClick={() => setEdit(true)}>Edit cause / correction</Button>}
        </div>
      )}
    </div>
  );
};
