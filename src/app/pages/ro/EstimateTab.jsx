import React, { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Send, Layers, PenLine } from 'lucide-react';
import { api, newIdempotencyKey } from '../../../api/client.js';
import { useAuth } from '../../auth.jsx';
import { Card, Button, Field, Input, Select, Textarea, StatusPill, Badge, Modal, Alert, Table, Async, useAsync, useAction, useConfirm, money, label, dt } from '../../ui.jsx';
import { MoneyInput } from '../../shared.jsx';

const blankLine = (kind) => ({ id: newIdempotencyKey(), kind, description: '', jobGroup: '', quantity: kind === 'part' || kind === 'sublet' ? 1 : undefined, hours: kind === 'labor' ? 1 : undefined, findingIds: [] });

const SignaturePad = ({ onSigned }) => {
  const ref = useRef(null);
  const drawing = useRef(false);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    const c = ref.current;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = '#0b1220';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
  }, []);
  const pos = (e) => {
    const r = ref.current.getBoundingClientRect();
    return [(e.clientX - r.left) * (ref.current.width / r.width), (e.clientY - r.top) * (ref.current.height / r.height)];
  };
  const down = (e) => { drawing.current = true; const ctx = ref.current.getContext('2d'); ctx.beginPath(); ctx.moveTo(...pos(e)); ref.current.setPointerCapture(e.pointerId); };
  const move = (e) => { if (!drawing.current) return; const ctx = ref.current.getContext('2d'); ctx.lineTo(...pos(e)); ctx.stroke(); setDirty(true); };
  const up = () => { drawing.current = false; };
  return (
    <div className="stack-sm">
      <canvas ref={ref} width={560} height={160} style={{ width: '100%', borderRadius: 8, touchAction: 'none', cursor: 'crosshair' }} onPointerDown={down} onPointerMove={move} onPointerUp={up} aria-label="Signature pad" />
      <Button size="sm" disabled={!dirty} onClick={() => ref.current.toBlob(b => onSigned(b), 'image/png')}><PenLine size={13} />Use this signature</Button>
    </div>
  );
};

const ApprovalModal = ({ ro, version, authorization, onClose, onDone }) => {
  const [decisions, setDecisions] = useState(() => Object.fromEntries(version.lines.map(l => [l.id, authorization[l.id]?.status === 'pending' ? 'approved' : authorization[l.id]?.status])));
  const [reasons, setReasons] = useState({});
  const [f, setF] = useState({ method: 'in_person_signature', approverName: ro.customer?.name || '', approverRelation: 'owner', authorizationStatement: '' });
  const [signatureId, setSignatureId] = useState(null);
  const [run, busy] = useAction();
  const [key] = useState(newIdempotencyKey);
  const approvedTotal = version.lines.filter(l => decisions[l.id] === 'approved').reduce((s, l) => s + l.totalCents, 0);
  const upload = (blob) => run(async () => {
    const form = new FormData();
    form.append('roId', ro.id);
    form.append('kind', 'signature');
    form.append('visibility', 'internal');
    form.append('file', new File([blob], 'signature.png', { type: 'image/png' }));
    setSignatureId((await api.upload('/evidence', form)).evidence.id);
  }, 'Signature captured');
  const submit = () => run(async () => {
    await api.post(`/repair-orders/${ro.id}/estimate/approvals`, {
      versionId: version.id,
      decisions: Object.entries(decisions).filter(([, v]) => v === 'approved' || v === 'declined').map(([lineId, decision]) => ({ lineId, decision, declineReason: reasons[lineId] })),
      ...f, signatureEvidenceId: signatureId || undefined, authorizationStatement: f.authorizationStatement || undefined
    }, { idempotencyKey: key });
    onDone();
  }, 'Customer authorization recorded');
  const ready = f.approverName && (f.method !== 'in_person_signature' || signatureId) && (!['phone', 'email'].includes(f.method) || f.authorizationStatement)
    && version.lines.every(l => decisions[l.id] !== 'declined' || !l.safetyCritical || reasons[l.id]);
  return (
    <Modal open title={`Record customer authorization · v${version.versionNumber}`} size="lg" onClose={onClose} footer={<><span className="grow muted">Approved total {money(approvedTotal, version.currency)}</span><Button variant="primary" loading={busy} disabled={!ready} onClick={submit}>Record authorization</Button></>}>
      <Table rows={version.lines} columns={[
        { label: 'Line', render: l => <div><strong>{l.description}</strong>{l.safetyCritical && <Badge tone="danger">Safety</Badge>}<div className="small faint">{l.jobGroup}</div></div> },
        { label: 'Total', right: true, render: l => money(l.totalCents, version.currency) },
        { label: 'Decision', render: l => (
          <div className="stack-sm">
            <Select value={decisions[l.id] || ''} placeholder="No decision" options={['approved', 'declined']} onChange={e => setDecisions(d => ({ ...d, [l.id]: e.target.value }))} />
            {decisions[l.id] === 'declined' && <Input placeholder={l.safetyCritical ? 'Reason (required)' : 'Reason'} value={reasons[l.id] || ''} onChange={e => setReasons(r => ({ ...r, [l.id]: e.target.value }))} />}
          </div>
        ) }
      ]} />
      <div className="grid-3">
        <Field label="How was it authorized?"><Select value={f.method} onChange={e => setF(x => ({ ...x, method: e.target.value }))} options={['in_person_signature', 'phone', 'email', 'sms_link']} /></Field>
        <Field label="Authorized by"><Input value={f.approverName} onChange={e => setF(x => ({ ...x, approverName: e.target.value }))} /></Field>
        <Field label="Relationship"><Select value={f.approverRelation} onChange={e => setF(x => ({ ...x, approverRelation: e.target.value }))} options={['owner', 'authorized_agent', 'fleet_manager']} /></Field>
      </div>
      {f.method === 'in_person_signature' && (signatureId ? <Alert tone="ok">Signature captured.</Alert> : <SignaturePad onSigned={upload} />)}
      {f.method !== 'in_person_signature' && <Field label="Authorization record" hint="Who you spoke with, when, and what they approved"><Textarea value={f.authorizationStatement} onChange={e => setF(x => ({ ...x, authorizationStatement: e.target.value }))} /></Field>}
    </Modal>
  );
};

export const EstimateTab = ({ ro, reloadRo }) => {
  const { can } = useAuth();
  const confirm = useConfirm();
  const [run, busy] = useAction();
  const s = useAsync(() => api.get(`/repair-orders/${ro.id}/estimate`), [ro.id]);
  const catalog = useAsync(() => Promise.all([
    api.get('/labor-operations').then(r => r.laborOperations).catch(() => []),
    api.get('/fees', { locationId: ro.locationId }).then(r => r.fees).catch(() => []),
    api.get(`/repair-orders/${ro.id}/inspection`).then(r => r.findings.filter(f => f.status === 'active' && ['fail', 'attention'].includes(f.condition))).catch(() => []),
    api.get('/predictive/signals', { vehicleId: ro.vehicleId }).then(r => r.signals).catch(() => [])
  ]), [ro.id]);
  const [lines, setLines] = useState(null);
  const [approving, setApproving] = useState(false);
  const [partQuery, setPartQuery] = useState('');
  const [partResults, setPartResults] = useState([]);
  useEffect(() => { if (s.data) setLines(s.data.estimate?.draftLines?.length ? s.data.estimate.draftLines : (s.data.currentVersion?.lines || [])); }, [s.data]);
  useEffect(() => {
    if (partQuery.length < 2) { setPartResults([]); return undefined; }
    const t = setTimeout(() => api.get('/parts', { q: partQuery, locationId: ro.locationId, limit: 8 }).then(r => setPartResults(r.parts)).catch(() => {}), 250);
    return () => clearTimeout(t);
  }, [partQuery, ro.locationId]);

  const editable = can('estimates:write') && !['closed', 'cancelled', 'ready_for_pickup'].includes(ro.status);
  const upd = (id, patch) => setLines(ls => ls.map(l => (l.id === id ? { ...l, ...patch } : l)));
  const saveDraft = () => run(async () => s.setData(await api.put(`/repair-orders/${ro.id}/estimate/draft`, { lines: lines.map(({ extendedCents, discountCents, netCents, taxCents, totalCents, taxable, ...l }) => l) }, { ifMatch: s.data.estimate?.version })), 'Draft saved and priced');
  const createVersion = async () => {
    const c = await confirm({ title: 'Create estimate version', message: 'Freezes the current draft as an immutable commercial snapshot. Changed lines will need customer re-approval.', reason: s.data.currentVersion ? 'Summary of changes' : undefined, confirmLabel: 'Create version' });
    if (c) run(async () => { s.setData(await api.action(`/repair-orders/${ro.id}/estimate/versions`, { changeSummary: c.reason })); reloadRo(); }, 'Version created');
  };
  const present = () => run(async () => {
    const res = await api.post(`/repair-orders/${ro.id}/estimate/present`, { notifyCustomer: true });
    s.setData(res);
    reloadRo();
    return res;
  }, 'Estimate sent to the customer');

  return (
    <Async state={s}>{data => {
      const v = data.currentVersion;
      const preview = data.draftPreview;
      const auth = data.authorization || {};
      const [ops = [], fees = [], findings = [], signals = []] = catalog.data || [];
      return (
        <div className="stack">
          {v && (
            <Card title={`Estimate ${data.estimate.estimateNumber} · version ${v.versionNumber}`} actions={<>
              <StatusPill status={data.estimate.status} />
              {can('estimates:present') && data.estimate.presentedVersionId !== v.id && !data.estimate.draftDirty && <Button size="sm" variant="primary" loading={busy} onClick={present}><Send size={13} />Send to customer</Button>}
              {can('approvals:record') && data.canApprove && <Button size="sm" variant="primary" onClick={() => setApproving(true)}>Record authorization</Button>}
            </>}>
              {data.estimate.draftDirty && <Alert tone="warn">The draft below has changes that are not in a version yet. Create a new version to present it.</Alert>}
              <Table rows={v.lines} columns={[
                { label: 'Line', render: l => <div><strong>{l.description}</strong>{l.safetyCritical && <> <Badge tone="danger">Safety</Badge></>}<div className="small faint">{label(l.kind)}{l.jobGroup ? ` · ${l.jobGroup}` : ''}{l.kind === 'labor' ? ` · ${l.hours} h @ ${money(l.rateCents)}` : l.quantity ? ` · ${l.quantity} × ${money(l.unitPriceCents)}` : ''}</div></div> },
                { label: 'Discount', right: true, render: l => (l.discountCents ? `−${money(l.discountCents)}` : '—') },
                { label: 'Total', right: true, render: l => money(l.totalCents, v.currency) },
                { label: 'Customer', render: l => <div><StatusPill status={auth[l.id]?.status} />{auth[l.id]?.decidedAt && <div className="small faint">{label(auth[l.id].method)} · {dt(auth[l.id].decidedAt)}</div>}</div> }
              ]} />
              <div className="grid-4" style={{ marginTop: 12 }}>
                <div className="ft-kv"><span>Subtotal</span><strong>{money(v.totals.subtotalCents, v.currency)}</strong></div>
                <div className="ft-kv"><span>Member discount</span><strong>{money(v.totals.discountCents, v.currency)}</strong></div>
                <div className="ft-kv"><span>Tax</span><strong>{money(v.totals.taxCents, v.currency)}</strong></div>
                <div className="ft-kv"><span>Total</span><strong style={{ fontSize: 18 }}>{money(v.totals.totalCents, v.currency)}</strong></div>
              </div>
              {v.membershipEvaluation?.memberships?.length > 0 && <p className="small muted" style={{ marginTop: 8 }}>Membership: {v.membershipEvaluation.memberships.map(m => `${m.number} (${m.planName} v${m.planVersion})`).join(', ')} · {v.membershipEvaluation.applied.length} benefit(s) applied</p>}
            </Card>
          )}

          {editable && lines && (
            <Card title="Draft" actions={<>
              <Button size="sm" onClick={() => setLines(ls => [...ls, blankLine('labor')])}><Plus size={13} />Labor</Button>
              <Button size="sm" onClick={() => setLines(ls => [...ls, blankLine('part')])}><Plus size={13} />Part</Button>
              <Button size="sm" onClick={() => setLines(ls => [...ls, blankLine('sublet')])}><Plus size={13} />Sublet</Button>
              {fees.length > 0 && <Select value="" placeholder="+ Fee" options={fees.map(f => ({ value: f.code, label: f.name }))} onChange={e => e.target.value && setLines(ls => [...ls, { ...blankLine('fee'), feeCode: e.target.value, description: fees.find(f => f.code === e.target.value)?.name }])} style={{ width: 'auto' }} />}
            </>}>
              <div className="stack">
                {(findings.length > 0 || signals.length > 0) && (
                  <div className="row wrap small">
                    <span className="faint">Recommendations:</span>
                    {findings.map(fd => <Button key={fd.id} size="sm" variant="ghost" onClick={() => setLines(ls => [...ls, { ...blankLine('labor'), description: fd.recommendation || fd.name, jobGroup: fd.name, findingIds: [fd.id], safetyCritical: fd.severity === 'safety', recommendationReason: fd.notes }])}>+ {fd.name} <StatusPill status={fd.severity || fd.condition} /></Button>)}
                    {signals.map(sg => <Button key={sg.id} size="sm" variant="ghost" onClick={() => setLines(ls => [...ls, { ...blankLine('labor'), description: sg.recommendation, jobGroup: sg.title, predictiveSignalId: sg.id, recommendationReason: sg.reason }])}>+ {sg.title}</Button>)}
                  </div>
                )}
                {lines.length === 0 && <p className="muted">Add labor, parts or fees. Recommendations from the inspection appear above.</p>}
                {lines.map(l => (
                  <div key={l.id} className="ft-card" style={{ background: 'var(--surface-2)', padding: 10 }}>
                    <div className="row" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
                      <Badge>{label(l.kind)}</Badge>
                      <div className="grow" style={{ minWidth: 220 }}><Field label="Description"><Input value={l.description || ''} onChange={e => upd(l.id, { description: e.target.value })} /></Field></div>
                      <div style={{ width: 160 }}><Field label="Job group"><Input value={l.jobGroup || ''} onChange={e => upd(l.id, { jobGroup: e.target.value })} /></Field></div>
                      {l.kind === 'labor' && <>
                        <div style={{ width: 200 }}><Field label="Labor operation"><Select value={l.laborOpCode || ''} placeholder="—" options={ops.map(o => ({ value: o.code, label: `${o.code} ${o.name}` }))} onChange={e => { const op = ops.find(o => o.code === e.target.value); upd(l.id, { laborOpCode: e.target.value || undefined, hours: op?.defaultHours ?? l.hours, laborRateType: op?.rateType, description: l.description || op?.name }); }} /></Field></div>
                        <div style={{ width: 90 }}><Field label="Hours"><Input inputMode="decimal" value={l.hours ?? ''} onChange={e => upd(l.id, { hours: e.target.value === '' ? undefined : Number(e.target.value) })} /></Field></div>
                        <div style={{ width: 130 }}><Field label="Rate type"><Select value={l.laborRateType || 'standard'} options={['standard', 'diagnostic', 'ev']} onChange={e => upd(l.id, { laborRateType: e.target.value })} /></Field></div>
                      </>}
                      {(l.kind === 'part' || l.kind === 'sublet') && <>
                        {l.kind === 'part' && <div style={{ width: 140 }}><Field label="Part #"><Input value={l.partNumber || ''} readOnly={Boolean(l.partId)} onChange={e => upd(l.id, { partNumber: e.target.value })} /></Field></div>}
                        <div style={{ width: 80 }}><Field label="Qty"><Input inputMode="decimal" value={l.quantity ?? ''} onChange={e => upd(l.id, { quantity: e.target.value === '' ? undefined : Number(e.target.value) })} /></Field></div>
                        <div style={{ width: 120 }}><Field label="Unit price"><MoneyInput cents={l.unitPriceCents} onChange={c => upd(l.id, { unitPriceCents: c ?? undefined })} placeholder={l.partId ? 'Catalog' : ''} /></Field></div>
                      </>}
                      <label className="row small"><input type="checkbox" checked={Boolean(l.safetyCritical)} onChange={e => upd(l.id, { safetyCritical: e.target.checked })} />Safety</label>
                      <Button variant="ghost" aria-label="Remove line" onClick={() => setLines(ls => ls.filter(x => x.id !== l.id))}><Trash2 size={14} /></Button>
                    </div>
                    {l.kind === 'part' && !l.partId && (
                      <div className="stack-sm" style={{ marginTop: 6 }}>
                        <Input placeholder="Search inventory to link a catalog part" value={partQuery} onChange={e => setPartQuery(e.target.value)} />
                        {partResults.map(p => <Button key={p.id} size="sm" variant="ghost" onClick={() => { upd(l.id, { partId: p.id, partNumber: p.partNumber, description: l.description || p.description }); setPartQuery(''); }}>{p.partNumber} · {p.description} · {money(p.listPriceCents)} · {p.stock.reduce((s, x) => s + x.available, 0)} avail</Button>)}
                      </div>
                    )}
                  </div>
                ))}
                {preview?.totals && <Alert tone="info">Draft pricing: subtotal {money(preview.totals.subtotalCents)} · discounts {money(preview.totals.discountCents)} · tax {money(preview.totals.taxCents)} · <strong>total {money(preview.totals.totalCents)}</strong></Alert>}
                {preview?.error && <Alert tone="danger">{preview.error}</Alert>}
                <div className="row">
                  <Button loading={busy} onClick={saveDraft}>Save & price draft</Button>
                  <Button variant="primary" loading={busy} disabled={!data.estimate?.draftDirty} onClick={createVersion}><Layers size={14} />Create version</Button>
                </div>
              </div>
            </Card>
          )}

          {data.versions.length > 0 && (
            <Card title="Version history">
              <Table rows={data.versions} columns={[
                { label: 'Version', render: x => `v${x.versionNumber}` }, { label: 'Reason', render: x => label(x.reason) }, { label: 'Total', right: true, render: x => money(x.totals.totalCents) },
                { label: 'Created', render: x => `${dt(x.createdAt)} · ${x.createdByName || ''}` }, { label: 'Changes', render: x => x.changeSummary || '—' }
              ]} />
              {data.approvals.length > 0 && <div className="stack-sm" style={{ marginTop: 12 }}>{data.approvals.map(a => <div key={a.id} className="small"><strong>{a.approverName}</strong> · {label(a.method)} · v{a.versionNumber} · {a.decisions.filter(d => d.decision === 'approved').length} approved / {a.decisions.filter(d => d.decision === 'declined').length} declined · {money(a.approvedTotalCents)} · {dt(a.at)}</div>)}</div>}
            </Card>
          )}
          {approving && v && <ApprovalModal ro={ro} version={v} authorization={auth} onClose={() => setApproving(false)} onDone={() => { setApproving(false); s.reload(); reloadRo(); }} />}
        </div>
      );
    }}</Async>
  );
};
