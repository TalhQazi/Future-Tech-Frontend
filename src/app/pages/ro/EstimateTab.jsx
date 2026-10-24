import React, { useEffect, useRef, useState } from 'react';
import { Trash2, Send, Layers, PenLine, Wrench, Package, AlertCircle, Zap, Settings2, ChevronDown, Eye, Printer, Camera, ClipboardCheck, Activity, Search, Save } from 'lucide-react';
import { api, newIdempotencyKey } from '../../../api/client.js';
import { useAuth } from '../../auth.jsx';
import { Card, Button, Field, Input, Select, Textarea, StatusPill, Badge, Modal, Alert, Table, Async, useAsync, useAction, useConfirm, money, label, dt, d } from '../../ui.jsx';
import { MoneyInput } from '../../shared.jsx';

const blankLine = (kind) => ({ id: newIdempotencyKey(), kind, description: '', jobGroup: '', quantity: kind === 'part' || kind === 'sublet' ? 1 : undefined, hours: kind === 'labor' ? 1 : undefined, findingIds: [] });
const CELL = 'ft-input ft-cell';
const ESTIMATE_STATUS = { draft: 'Not sent', presented: 'Sent to customer', approved: 'Approved', partially_approved: 'Partially approved', declined: 'Declined' };

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
      <canvas ref={ref} width={560} height={160} style={{ width: '100%', borderRadius: 8, border: '1px solid var(--line-2)', touchAction: 'none', cursor: 'crosshair' }} onPointerDown={down} onPointerMove={move} onPointerUp={up} aria-label="Signature pad" />
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
            <Select value={decisions[l.id] || ''} placeholder="No decision" options={['approved', 'declined']} onChange={e => setDecisions(x => ({ ...x, [l.id]: e.target.value }))} />
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

// Printable / previewable estimate (customer-facing fields only).
const EstimateDocument = ({ ro, version, customerNotes }) => (
  <div className="ft-print stack">
    <div className="row between"><div><h2 style={{ fontSize: 20 }}>Estimate {version.estimateNumber || ''}</h2><div className="small muted">Repair order {ro.roNumber} · version {version.versionNumber} · {d(version.createdAt)}</div></div><div className="right small"><strong>{ro.customer?.name}</strong><div>{[ro.vehicle?.year, ro.vehicle?.make, ro.vehicle?.model].filter(Boolean).join(' ')}</div><div className="mono">{ro.vehicle?.vin}</div></div></div>
    <Table rows={version.lines} columns={[{ label: 'Description', render: l => <div><strong>{l.description}</strong>{l.safetyCritical && <> <Badge tone="danger">Safety</Badge></>}</div> }, { label: 'Qty / hrs', right: true, render: l => (l.kind === 'labor' ? l.hours : l.quantity) }, { label: 'Price', right: true, render: l => money(l.extendedCents) }, { label: 'Member', right: true, render: l => (l.discountCents ? `−${money(l.discountCents)}` : '') }, { label: 'Total', right: true, render: l => money(l.netCents) }]} />
    <div className="ft-side-card" style={{ maxWidth: 320, marginLeft: 'auto' }}><div className="body">
      <div className="ft-sum"><span>Subtotal</span><strong>{money(version.totals.subtotalCents)}</strong></div>
      {version.totals.discountCents > 0 && <div className="ft-sum"><span>Membership Auto savings</span><strong>−{money(version.totals.discountCents)}</strong></div>}
      <div className="ft-sum"><span>Tax</span><strong>{money(version.totals.taxCents)}</strong></div>
      <div className="ft-sum total"><span>Total</span><strong>{money(version.totals.totalCents)}</strong></div>
    </div></div>
    {customerNotes && <div className="small"><strong>Notes:</strong> {customerNotes}</div>}
  </div>
);

export const EstimateTab = ({ ro, reloadRo, est: s, setTab }) => {
  const { can } = useAuth();
  const confirm = useConfirm();
  const [run, busy] = useAction();
  const catalog = useAsync(() => Promise.all([
    api.get('/labor-operations').then(r => r.laborOperations).catch(() => []),
    api.get('/fees', { locationId: ro.locationId }).then(r => r.fees).catch(() => []),
    api.get(`/repair-orders/${ro.id}/inspection`).then(r => r.findings.filter(f => f.status === 'active' && ['fail', 'attention'].includes(f.condition))).catch(() => []),
    api.get('/predictive/signals', { vehicleId: ro.vehicleId }).then(r => r.signals).catch(() => [])
  ]), [ro.id]);
  const [lines, setLines] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [approving, setApproving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [picker, setPicker] = useState(null);
  const [partQuery, setPartQuery] = useState('');
  const [partResults, setPartResults] = useState([]);
  const [notes, setNotes] = useState({ advisorNotes: ro.advisorNotes || '', customerNotes: ro.customerNotes || '' });
  useEffect(() => { if (s.data) { setLines(s.data.estimate?.draftLines?.length ? s.data.estimate.draftLines : (s.data.currentVersion?.lines || [])); setDirty(false); } }, [s.data]);
  useEffect(() => setNotes({ advisorNotes: ro.advisorNotes || '', customerNotes: ro.customerNotes || '' }), [ro.advisorNotes, ro.customerNotes]);
  useEffect(() => {
    if (partQuery.length < 2) { setPartResults([]); return undefined; }
    const t = setTimeout(() => api.get('/parts', { q: partQuery, locationId: ro.locationId, limit: 8 }).then(r => setPartResults(r.parts)).catch(() => {}), 250);
    return () => clearTimeout(t);
  }, [partQuery, ro.locationId]);

  const editable = can('estimates:write') && !['closed', 'cancelled', 'ready_for_pickup'].includes(ro.status);
  const upd = (id, patch) => { setLines(ls => ls.map(l => (l.id === id ? { ...l, ...patch } : l))); setDirty(true); };
  const addLine = (l) => { setLines(ls => [...ls, l]); setDirty(true); };
  const removeLine = (id) => { setLines(ls => ls.filter(x => x.id !== id)); setDirty(true); };
  const saveDraft = () => run(async () => s.setData(await api.put(`/repair-orders/${ro.id}/estimate/draft`, { lines: lines.map(({ extendedCents, discountCents, netCents, taxCents, totalCents, taxable, ...l }) => l) }, { ifMatch: s.data.estimate?.version })), 'Draft saved and priced');
  const createVersion = async () => {
    const c = await confirm({ title: 'Create estimate version', message: 'Freezes the current draft as an immutable commercial snapshot. Changed lines will need customer re-approval.', reason: s.data.currentVersion ? 'Summary of changes' : undefined, confirmLabel: 'Create version' });
    if (c) run(async () => { s.setData(await api.action(`/repair-orders/${ro.id}/estimate/versions`, { changeSummary: c.reason })); reloadRo(); }, 'Version created');
  };
  const present = () => run(async () => { const res = await api.post(`/repair-orders/${ro.id}/estimate/present`, { notifyCustomer: true }); s.setData(res); reloadRo(); return res; }, 'Estimate sent to the customer');
  const addConcern = async () => {
    const c = await confirm({ title: 'Add customer concern', reason: 'Concern in the customer\'s words', confirmLabel: 'Add concern' });
    if (c) run(async () => { await api.post(`/repair-orders/${ro.id}/concerns`, { text: c.reason, source: 'customer' }); reloadRo(); }, 'Concern added');
  };
  const saveNotes = () => run(async () => { await api.patch(`/repair-orders/${ro.id}/notes`, notes); reloadRo(); }, 'Notes saved');

  return (
    <Async state={s}>{data => {
      const v = data.currentVersion;
      const auth = data.authorization || {};
      const [ops = [], fees = [], findings = [], signals = []] = catalog.data || [];
      const rows = editable ? (lines || []) : (v?.lines || []);
      const priced = new Map(((editable ? data.draftPreview?.lines : v?.lines) || []).map(l => [l.id, l]));
      const t = v?.totals || data.draftPreview?.totals;
      const canPresent = can('estimates:present') && v && data.estimate.presentedVersionId !== v.id && !data.estimate.draftDirty && !dirty;
      const quickAdd = (val) => {
        if (val === 'sublet') addLine(blankLine('sublet'));
        else if (val.startsWith('fee:')) { const fee = fees.find(f => f.code === val.slice(4)); addLine({ ...blankLine('fee'), feeCode: fee.code, description: fee.name }); }
        else if (val.startsWith('finding:')) { const fd = findings.find(f => f.id === val.slice(8)); addLine({ ...blankLine('labor'), description: fd.recommendation || fd.name, jobGroup: fd.name, findingIds: [fd.id], safetyCritical: fd.severity === 'safety', recommendationReason: fd.notes }); }
        else if (val.startsWith('signal:')) { const sg = signals.find(x => x.id === val.slice(7)); addLine({ ...blankLine('labor'), description: sg.recommendation, jobGroup: sg.title, predictiveSignalId: sg.id, recommendationReason: sg.reason }); }
      };
      const roAction = (val) => ({ save: saveDraft, version: createVersion, authorize: () => setApproving(true), preview: () => setPreview(true), refresh: s.reload })[val]?.();

      // plain render function (not a component) so inputs keep focus while typing
      const renderRow = (l) => {
        const p = priced.get(l.id);
        const a = auth[l.id];
        const stale = editable && dirty && !p;
        const Icon = l.kind === 'labor' ? Wrench : l.kind === 'part' ? Package : Settings2;
        return (
          <tr key={l.id} className={stale ? 'unsaved' : ''}>
            <td><span className="ico"><Icon size={16} /></span></td>
            <td style={{ minWidth: 220 }}>
              {editable ? <input className={CELL} value={l.description || ''} onChange={e => upd(l.id, { description: e.target.value })} aria-label="Description" /> : <strong>{l.description}</strong>}
              <div className="row small faint" style={{ marginTop: 2 }}>{l.jobGroup}{l.safetyCritical && <Badge tone="danger">Safety</Badge>}{p?.discountCents > 0 && <Badge tone="ok">Membership covered</Badge>}</div>
            </td>
            <td className="num" style={{ width: 84 }}>
              {editable && l.kind !== 'fee'
                ? <input className={CELL} style={{ width: 70, textAlign: 'right' }} inputMode="decimal" value={(l.kind === 'labor' ? l.hours : l.quantity) ?? ''} onChange={e => upd(l.id, l.kind === 'labor' ? { hours: e.target.value === '' ? undefined : Number(e.target.value) } : { quantity: e.target.value === '' ? undefined : Number(e.target.value) })} aria-label={l.kind === 'labor' ? 'Hours' : 'Quantity'} />
                : l.kind === 'labor' ? `${l.hours ?? '—'} hrs` : (l.quantity ?? 1)}
            </td>
            <td style={{ width: 190 }}>
              {l.kind === 'labor' && (editable
                ? <Select className="ft-cell" value={l.laborOpCode || ''} placeholder="Op code…" options={ops.map(o => ({ value: o.code, label: `${o.code} · ${o.name}` }))} onChange={e => { const op = ops.find(o => o.code === e.target.value); upd(l.id, { laborOpCode: e.target.value || undefined, hours: op?.defaultHours ?? l.hours, laborRateType: op?.rateType, description: l.description || op?.name }); }} />
                : <span className="mono small">{l.laborOpCode || '—'}</span>)}
              {l.kind === 'part' && (editable
                ? <div className="row"><input className={CELL} value={l.partNumber || ''} readOnly={Boolean(l.partId)} onChange={e => upd(l.id, { partNumber: e.target.value })} aria-label="Part number" />{!l.partId && <Button size="sm" variant="ghost" onClick={() => { setPicker(l.id); setPartQuery(l.partNumber || l.description || ''); }} aria-label="Find in inventory"><Search size={13} /></Button>}</div>
                : <span className="mono small">{l.partNumber || '—'}</span>)}
              {l.kind === 'fee' && <span className="mono small">{l.feeCode}</span>}
              {l.kind === 'sublet' && <span className="small faint">Sublet</span>}
            </td>
            <td className="num" style={{ width: 110 }}>
              {(l.kind === 'part' || l.kind === 'sublet')
                ? (editable ? <MoneyInput className={CELL} style={{ width: 96, textAlign: 'right' }} cents={l.unitPriceCents} onChange={c => upd(l.id, { unitPriceCents: c ?? undefined })} placeholder={l.partId ? 'Catalog' : '0.00'} /> : money(l.unitPriceCents ?? p?.unitPriceCents))
                : l.kind === 'labor' ? (p?.rateCents != null ? <span className="small">{money(p.rateCents)}/h</span> : '—') : (p ? money(p.extendedCents) : '—')}
            </td>
            <td className="num">{l.kind === 'labor' && p ? money(p.extendedCents) : ''}</td>
            <td className="num">{p ? <>{p.discountCents > 0 && <div className="small" style={{ textDecoration: 'line-through', color: 'var(--faint)' }}>{money(p.extendedCents)}</div>}<strong>{money(p.netCents ?? p.extendedCents)}</strong></> : <span className="small faint">{stale ? 'unsaved' : '—'}</span>}</td>
            <td>{a ? <StatusPill status={a.status} /> : <span className="small faint">{editable ? 'Draft' : '—'}</span>}</td>
            <td style={{ whiteSpace: 'nowrap' }}>{editable && <>
              <label className="small" title="Safety-critical"><input type="checkbox" checked={Boolean(l.safetyCritical)} onChange={e => upd(l.id, { safetyCritical: e.target.checked })} aria-label="Safety-critical" /></label>
              <Button size="sm" variant="ghost" aria-label="Remove line" onClick={() => removeLine(l.id)}><Trash2 size={14} /></Button>
            </>}</td>
          </tr>
        );
      };
      const section = (title, list, empty) => <>
        <tr className="sec"><td colSpan={9}><ChevronDown size={13} style={{ verticalAlign: -2 }} /> {title}</td></tr>
        {list.length ? list.map(renderRow) : <tr><td colSpan={9} className="small faint">{empty}</td></tr>}
      </>;

      return (
        <div className="ft-ro-layout">
          <div className="stack" style={{ minWidth: 0 }}>
            {editable && (
              <div className="ft-toolbar">
                <Button onClick={() => addLine(blankLine('labor'))}><Wrench size={15} />Add Labor</Button>
                <Button onClick={() => addLine(blankLine('part'))}><Package size={15} />Add Part</Button>
                {can('ros:write') && <Button onClick={addConcern}><AlertCircle size={15} color="var(--danger)" />Add Concern</Button>}
                <div className="row" style={{ gap: 0 }}><Zap size={15} color="var(--warn)" style={{ marginRight: -22, zIndex: 1, pointerEvents: 'none' }} /><Select value="" placeholder="Quick Add" style={{ width: 'auto', height: 36, paddingLeft: 28, fontWeight: 650 }} onChange={e => e.target.value && quickAdd(e.target.value)} options={[
                  { value: 'sublet', label: 'Sublet line' },
                  ...fees.map(f => ({ value: `fee:${f.code}`, label: `Fee · ${f.name}` })),
                  ...findings.map(f => ({ value: `finding:${f.id}`, label: `Inspection · ${f.name}` })),
                  ...signals.map(sg => ({ value: `signal:${sg.id}`, label: `Maintenance due · ${sg.title}` }))
                ]} /></div>
                <div className="grow" />
                <Select value="" placeholder="RO Actions" style={{ width: 'auto', height: 36, fontWeight: 650 }} onChange={e => roAction(e.target.value)} options={[
                  { value: 'save', label: 'Save & price draft' }, { value: 'version', label: 'Create estimate version' },
                  ...(can('approvals:record') && data.canApprove ? [{ value: 'authorize', label: 'Record customer authorization' }] : []),
                  ...(v ? [{ value: 'preview', label: 'Preview / print' }] : []), { value: 'refresh', label: 'Reload estimate' }
                ]} />
              </div>
            )}
            {data.estimate?.draftDirty && !dirty && <Alert tone="warn">The draft has changes that are not in a version yet. Create a version to send it to the customer.</Alert>}
            {dirty && <Alert tone="info">Unsaved changes — use <strong>Save & price</strong> to calculate prices and membership coverage.</Alert>}
            {data.draftPreview?.error && <Alert tone="danger">{data.draftPreview.error}</Alert>}
            <div className="ft-table-wrap">
              <table className="ft-est">
                <thead><tr><th>Type</th><th>Description</th><th className="num">Qty/Hours</th><th>Part # / Op Code</th><th className="num">Price</th><th className="num">Labor</th><th className="num">Total</th><th>Status</th><th /></tr></thead>
                <tbody>
                  <tr className="sec"><td colSpan={9}><ChevronDown size={13} style={{ verticalAlign: -2 }} /> Customer Concerns</td></tr>
                  {ro.concerns?.length ? ro.concerns.map((c, i) => <tr key={c.id}><td><span className="row"><strong>{i + 1}</strong><AlertCircle size={15} color="var(--danger)" /></span></td><td colSpan={7}>{c.text}{c.cause && <div className="small faint">Cause: {c.cause}{c.correction ? ` · Correction: ${c.correction}` : ''}</div>}</td><td /></tr>) : <tr><td colSpan={9} className="small faint">No concerns recorded</td></tr>}
                  {section('Labor', rows.filter(l => l.kind === 'labor'), 'No labor lines')}
                  {section('Parts', rows.filter(l => l.kind === 'part'), 'No parts')}
                  {section('Miscellaneous', rows.filter(l => l.kind === 'fee' || l.kind === 'sublet'), 'No fees or sublet work')}
                </tbody>
              </table>
            </div>
            {editable && <div className="row">
              <Button loading={busy} onClick={saveDraft}><Save size={14} />Save & price draft</Button>
              <Button variant="primary" loading={busy} disabled={dirty || !data.estimate?.draftDirty} onClick={createVersion}><Layers size={14} />Create version</Button>
            </div>}
            <div className="grid-2">
              <Field label="Internal Notes (not shown on customer estimate)"><Textarea value={notes.advisorNotes} disabled={!can('ros:write')} onChange={e => setNotes(n => ({ ...n, advisorNotes: e.target.value }))} placeholder="Add internal notes here…" /></Field>
              <Field label="Customer Notes (shown on estimate)"><Textarea value={notes.customerNotes} disabled={!can('ros:write')} onChange={e => setNotes(n => ({ ...n, customerNotes: e.target.value }))} placeholder="Notes the customer will see" /></Field>
            </div>
            {can('ros:write') && (notes.advisorNotes !== (ro.advisorNotes || '') || notes.customerNotes !== (ro.customerNotes || '')) && <div><Button size="sm" variant="primary" loading={busy} onClick={saveNotes}>Save notes</Button></div>}
            {data.versions.length > 0 && (
              <details>
                <summary className="small" style={{ cursor: 'pointer', fontWeight: 700 }}>Version history ({data.versions.length}) and authorizations</summary>
                <Table rows={data.versions} columns={[
                  { label: 'Version', render: x => `v${x.versionNumber}` }, { label: 'Reason', render: x => label(x.reason) }, { label: 'Total', right: true, render: x => money(x.totals.totalCents) },
                  { label: 'Created', render: x => `${dt(x.createdAt)} · ${x.createdByName || ''}` }, { label: 'Changes', render: x => x.changeSummary || '—' }
                ]} />
                {data.approvals.map(a => <div key={a.id} className="small" style={{ marginTop: 6 }}><strong>{a.approverName}</strong> · {label(a.method)} · v{a.versionNumber} · {a.decisions.filter(x => x.decision === 'approved').length} approved / {a.decisions.filter(x => x.decision === 'declined').length} declined · {money(a.approvedTotalCents)} · {dt(a.at)}</div>)}
              </details>
            )}
          </div>

          <div className="stack">
            <div className="ft-side-card">
              <h4>Quick Estimate</h4>
              <div className="body row wrap">
                <Button size="sm" disabled={!v} onClick={() => setPreview(true)}><Eye size={13} />Preview</Button>
                <Button size="sm" disabled={!canPresent} loading={busy} onClick={present}><Send size={13} />Send to Customer</Button>
                <Button size="sm" disabled={!v} onClick={() => { setPreview(true); setTimeout(() => window.print(), 300); }}><Printer size={13} />Print</Button>
              </div>
            </div>
            <div className="ft-side-card">
              <h4>Repair Order Summary</h4>
              <div className="body">
                {t ? <>
                  <div className="ft-sum"><span>Labor Subtotal</span><strong>{money(t.laborCents)}</strong></div>
                  <div className="ft-sum"><span>Parts Subtotal</span><strong>{money(t.partsCents)}</strong></div>
                  <div className="ft-sum"><span>Miscellaneous</span><strong>{money((t.feesCents || 0) + (t.subletCents || 0))}</strong></div>
                  {t.discountCents > 0 && <div className="ft-sum"><span>Membership Auto</span><strong style={{ color: 'var(--ok)' }}>−{money(t.discountCents)}</strong></div>}
                  <div className="ft-sum"><span>Subtotal</span><strong>{money(t.subtotalCents)}</strong></div>
                  <div className="ft-sum"><span>Tax</span><strong>{money(t.taxCents)}</strong></div>
                  <div className="ft-sum total"><span>Total</span><strong>{money(t.totalCents)}</strong></div>
                  <div className="small faint">{v ? `Version ${v.versionNumber}` : 'Priced draft (not sent)'}</div>
                </> : <span className="small muted">Save & price the draft to see totals.</span>}
              </div>
            </div>
            <div className="ft-side-card">
              <h4>Approval Status</h4>
              <div className="body">
                <div><Badge tone={data.estimate?.status === 'approved' ? 'ok' : data.estimate?.status === 'presented' ? 'info' : 'warn'}>{ESTIMATE_STATUS[data.estimate?.status] || 'No estimate yet'}</Badge></div>
                {data.estimate?.presentedAt && <span className="small faint">Sent {dt(data.estimate.presentedAt)}</span>}
                <div className="grid-2" style={{ gap: 8 }}>
                  <Button variant="primary" disabled={!canPresent} loading={busy} onClick={present}>Send Estimate</Button>
                  <Button variant="success" disabled={!(can('approvals:record') && data.canApprove)} onClick={() => setApproving(true)}>Record Approval</Button>
                </div>
                {!v && editable && <span className="small faint">Create a version first; the customer approves a fixed version.</span>}
              </div>
            </div>
            <div className="ft-side-card">
              <h4>Related Documents</h4>
              <div className="body row wrap">
                <button type="button" className="ft-chip" onClick={() => setTab('inspection')}><Camera size={13} />Photos ({ro.documentCounts?.photos ?? 0})</button>
                <button type="button" className="ft-chip" onClick={() => setTab('inspection')}><ClipboardCheck size={13} />Inspections ({ro.documentCounts?.inspections ?? 0})</button>
                <button type="button" className="ft-chip" onClick={() => setTab('diagnostics')}><Activity size={13} />Diagnostics ({ro.documentCounts?.diagnostics ?? 0})</button>
              </div>
            </div>
          </div>

          {preview && v && <Modal open title="Estimate preview" size="lg" onClose={() => setPreview(false)} footer={<Button onClick={() => window.print()}><Printer size={14} />Print</Button>}><EstimateDocument ro={ro} version={{ ...v, estimateNumber: data.estimate.estimateNumber }} customerNotes={ro.customerNotes} /></Modal>}
          {picker && <Modal open title="Link an inventory part" onClose={() => setPicker(null)}>
            <Input autoFocus placeholder="Search part number or description" value={partQuery} onChange={e => setPartQuery(e.target.value)} />
            <div className="stack-sm">{partResults.map(p => <Button key={p.id} variant="ghost" onClick={() => { const line = lines.find(x => x.id === picker); upd(picker, { partId: p.id, partNumber: p.partNumber, description: line?.description || p.description }); setPicker(null); setPartQuery(''); }}>{p.partNumber} · {p.description} · {money(p.listPriceCents)} · {p.stock.reduce((sum, x) => sum + x.available, 0)} available</Button>)}</div>
            {partQuery.length >= 2 && !partResults.length && <span className="small muted">No matching parts at this location.</span>}
          </Modal>}
          {approving && v && <ApprovalModal ro={ro} version={v} authorization={auth} onClose={() => setApproving(false)} onDone={() => { setApproving(false); s.reload(); reloadRo(); }} />}
        </div>
      );
    }}</Async>
  );
};
