import React, { useState } from 'react';
import { Play, Pause, CheckCircle2, PackagePlus } from 'lucide-react';
import { api, newIdempotencyKey } from '../../../api/client.js';
import { useAuth } from '../../auth.jsx';
import { Card, Button, Field, Input, Select, Textarea, StatusPill, Badge, Modal, Table, Empty, useAction, label, dt } from '../../ui.jsx';
import { EvidenceUploader } from '../../shared.jsx';

export const WorkTab = ({ ro, setRo, reload }) => {
  const { can, user } = useAuth();
  const [run, busy] = useAction();
  const [completing, setCompleting] = useState(null);
  const [issuing, setIssuing] = useState(null);
  const [request, setRequest] = useState(null);
  const apply = (p, msg) => run(async () => setRo((await p).repairOrder), msg);

  return (
    <div className="stack">
      <Card title="Authorized jobs" actions={can('parts:request') && <Button size="sm" onClick={() => setRequest({ description: '', quantity: 1, urgency: ro.waiter ? 'urgent' : 'normal' })}><PackagePlus size={14} />Request part</Button>}>
        {ro.jobs.filter(j => j.status !== 'cancelled').length === 0 ? <Empty title="No authorized work yet" hint="Jobs appear here when the customer approves estimate lines." /> : (
          <div className="stack">
            {ro.jobs.filter(j => j.status !== 'cancelled').map(j => (
              <div key={j.id} className="ft-card" style={{ background: 'var(--surface-2)', padding: 12 }}>
                <div className="row between wrap">
                  <div><strong>{j.title}</strong><div className="small faint">{j.soldHours ? `${j.soldHours} sold hrs` : ''}{j.laborOpCode ? ` · ${j.laborOpCode}` : ''}{j.techId ? ` · tech ${j.techId === user.id ? 'you' : j.techId.slice(0, 6)}` : ''}</div></div>
                  <div className="row">
                    <StatusPill status={j.status} />
                    {can('jobs:execute') && ['authorized', 'paused'].includes(j.status) && <Button size="sm" variant="primary" loading={busy} onClick={() => apply(api.post(`/repair-orders/${ro.id}/jobs/${j.id}/start`), 'Job started; clocked in')}><Play size={13} />Start</Button>}
                    {can('jobs:execute') && j.status === 'in_progress' && <>
                      <Button size="sm" onClick={() => apply(api.post(`/repair-orders/${ro.id}/jobs/${j.id}/pause`, { reason: 'waiting_parts' }), 'Paused: waiting for parts')}><Pause size={13} />Waiting parts</Button>
                      <Button size="sm" onClick={() => apply(api.post(`/repair-orders/${ro.id}/jobs/${j.id}/pause`, { reason: 'break' }), 'Paused')}><Pause size={13} />Pause</Button>
                      <Button size="sm" variant="primary" onClick={() => setCompleting({ job: j, notes: '', evidenceIds: [] })}><CheckCircle2 size={13} />Complete</Button>
                    </>}
                  </div>
                </div>
                {j.completionNotes && <p className="small muted" style={{ marginTop: 6 }}>{j.completionNotes} · {dt(j.completedAt)}</p>}
                {ro.reservations?.filter(r => j.estimateLineIds.includes(r.estimateLineId)).map(r => (
                  <div key={r.id} className="row small" style={{ marginTop: 6 }}>
                    <Badge tone={r.status === 'issued' ? 'ok' : 'info'}>{r.status === 'issued' ? 'Issued' : 'Reserved'}</Badge>
                    <span>{r.quantity - r.issuedQuantity} of {r.quantity} remaining · part {r.partId.slice(0, 8)}</span>
                    {r.status === 'active' && (can('inventory:write') || can('jobs:execute')) && <Button size="sm" onClick={() => setIssuing({ reservation: r, jobId: j.id, quantity: r.quantity - r.issuedQuantity, lotNumber: '', serialNumber: '' })}>Issue to job</Button>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </Card>

      {ro.partRequests?.length > 0 && (
        <Card title="Part requests">
          <Table rows={ro.partRequests} columns={[
            { label: 'Part', render: p => `${p.quantity} × ${p.description}` }, { label: 'Urgency', render: p => label(p.urgency) },
            { label: 'Status', render: p => <StatusPill status={p.status} /> }, { label: 'Requested', render: p => dt(p.createdAt) }
          ]} />
        </Card>
      )}

      <Modal open={Boolean(completing)} title={`Complete: ${completing?.job.title}`} onClose={() => setCompleting(null)} footer={<Button variant="primary" loading={busy} disabled={!completing?.notes.trim()} onClick={() => run(async () => {
        setRo((await api.action(`/repair-orders/${ro.id}/jobs/${completing.job.id}/complete`, { completionNotes: completing.notes, evidenceIds: completing.evidenceIds })).repairOrder);
        setCompleting(null);
      }, 'Job completed')}>Complete job</Button>}>
        <Field label="Work performed (correction)" hint="Shown on the invoice and the vehicle history"><Textarea value={completing?.notes || ''} onChange={e => setCompleting(c => ({ ...c, notes: e.target.value }))} /></Field>
        <div className="row"><EvidenceUploader roId={ro.id} label="Add completion photo" onUploaded={ev => setCompleting(c => ({ ...c, evidenceIds: [...c.evidenceIds, ev.id] }))} /><span className="small muted">{completing?.evidenceIds.length || 0} attached</span></div>
      </Modal>

      <Modal open={Boolean(issuing)} title="Issue part to job" onClose={() => setIssuing(null)} footer={<Button variant="primary" loading={busy} onClick={() => run(async () => {
        await api.post('/stock/issue', { roId: ro.id, jobId: issuing.jobId, reservationId: issuing.reservation.id, quantity: Number(issuing.quantity), lotNumber: issuing.lotNumber || undefined, serialNumber: issuing.serialNumber || undefined }, { idempotencyKey: newIdempotencyKey() });
        setIssuing(null);
        reload();
      }, 'Part issued and recorded on the vehicle')}>Issue</Button>}>
        <div className="grid-3">
          <Field label="Quantity"><Input inputMode="numeric" value={issuing?.quantity || ''} onChange={e => setIssuing(x => ({ ...x, quantity: e.target.value }))} /></Field>
          <Field label="Lot number"><Input value={issuing?.lotNumber || ''} onChange={e => setIssuing(x => ({ ...x, lotNumber: e.target.value }))} /></Field>
          <Field label="Serial number"><Input value={issuing?.serialNumber || ''} onChange={e => setIssuing(x => ({ ...x, serialNumber: e.target.value }))} /></Field>
        </div>
      </Modal>

      <Modal open={Boolean(request)} title="Request a part" onClose={() => setRequest(null)} footer={<Button variant="primary" loading={busy} disabled={!request?.description?.trim()} onClick={() => run(async () => {
        await api.post('/part-requests', { roId: ro.id, ...request, quantity: Number(request.quantity) || 1 });
        setRequest(null);
        reload();
      }, 'Parts department notified')}>Send request</Button>}>
        <Field label="Part description / number"><Input value={request?.description || ''} onChange={e => setRequest(x => ({ ...x, description: e.target.value }))} /></Field>
        <div className="grid-2">
          <Field label="Quantity"><Input inputMode="numeric" value={request?.quantity || ''} onChange={e => setRequest(x => ({ ...x, quantity: e.target.value }))} /></Field>
          <Field label="Urgency"><Select value={request?.urgency} options={['normal', 'urgent']} onChange={e => setRequest(x => ({ ...x, urgency: e.target.value }))} /></Field>
        </div>
        <Field label="Notes"><Textarea value={request?.notes || ''} onChange={e => setRequest(x => ({ ...x, notes: e.target.value }))} /></Field>
      </Modal>
    </div>
  );
};
