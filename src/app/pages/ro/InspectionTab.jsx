import React, { useState } from 'react';
import { Lock, Plus } from 'lucide-react';
import { api } from '../../../api/client.js';
import { enqueue } from '../../offline.js';
import { useAuth } from '../../auth.jsx';
import { Card, Button, Field, Input, Select, Textarea, StatusPill, Badge, Modal, Alert, Async, useAsync, useAction, useConfirm, useToast, label, dt } from '../../ui.jsx';
import { EvidenceThumb, EvidenceUploader } from '../../shared.jsx';

const CONDITIONS = ['ok', 'attention', 'fail', 'not_inspected'];
const SEVERITY_FOR = { fail: ['safety', 'repair'], attention: ['repair', 'maintenance', 'monitor'] };

const FindingEditor = ({ ro, item, finding, evidence, locked, onSaved }) => {
  const { can } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [f, setF] = useState(() => ({
    condition: finding?.condition || 'not_inspected', severity: finding?.severity || '', notes: finding?.notes || '',
    recommendation: finding?.recommendation || '', measurements: finding?.measurements?.length ? finding.measurements : (item.measurementHints || []).map(h => ({ label: h.label, unit: h.unit, value: '' }))
  }));
  const [open, setOpen] = useState(false);
  const [correcting, setCorrecting] = useState(false);
  const [run, busy] = useAction();
  const payload = (extra = {}) => ({
    findingId: finding?.id, itemKey: item.key, category: item.category, name: item.name,
    condition: f.condition, severity: SEVERITY_FOR[f.condition] ? f.severity || null : null, notes: f.notes, recommendation: f.recommendation,
    measurements: f.measurements.filter(m => m.value !== '' && m.value !== null).map(m => ({ label: m.label, unit: m.unit || '', value: Number(m.value) })),
    ...extra
  });
  const save = async () => {
    let raiseEscalation = false;
    if (f.condition === 'fail' && f.severity === 'safety') {
      const c = await confirm({ title: 'Safety failure', message: 'Also raise a safety escalation to the manager and advisor now?', confirmLabel: 'Save and escalate' });
      raiseEscalation = Boolean(c);
    }
    if (!navigator.onLine) {
      await enqueue({ path: `/repair-orders/${ro.id}/inspection/findings`, body: payload({ raiseEscalation }), label: `Finding ${item.name}` });
      toast.info('Saved offline; it will sync when you reconnect');
      return setOpen(false);
    }
    return run(async () => { onSaved((await api.post(`/repair-orders/${ro.id}/inspection/findings`, payload({ raiseEscalation }), { ifMatch: finding?.version })).finding); setOpen(false); }, 'Finding saved');
  };
  const correct = async () => {
    const c = await confirm({ title: `Correct "${item.name}"`, message: 'The locked finding is kept; this correction becomes a new version with your reason.', reason: 'Why is this correction needed?' });
    if (!c) return;
    run(async () => {
      const { findingId, itemKey, category, name, ...rest } = payload();
      await api.post(`/findings/${finding.id}/corrections`, { ...rest, reason: c.reason });
      onSaved(null);
      setCorrecting(false);
    }, 'Correction recorded');
  };
  const setM = (i, v) => setF(x => ({ ...x, measurements: x.measurements.map((m, j) => (j === i ? { ...m, value: v } : m)) }));
  const editing = (!locked && open) || correcting;

  return (
    <div className="ft-card" style={{ background: 'var(--surface-2)', padding: 12 }}>
      <div className="row between wrap">
        <div className="row"><strong>{item.name}</strong>{finding?.supersedesId && <Badge tone="info">Corrected</Badge>}{locked && <Lock size={12} className="faint" />}</div>
        <div className="row">
          <StatusPill status={finding?.condition || 'not_inspected'} />
          {finding?.severity && <StatusPill status={finding.severity} />}
          {!locked && can('inspections:write') && !open && <Button size="sm" onClick={() => setOpen(true)}>{finding ? 'Edit' : 'Record'}</Button>}
          {locked && finding && can('findings:correct') && !correcting && <Button size="sm" variant="ghost" onClick={() => setCorrecting(true)}>Correct</Button>}
        </div>
      </div>
      {finding && !editing && (finding.notes || finding.recommendation || finding.measurements?.length > 0) && (
        <div className="small muted" style={{ marginTop: 6 }}>
          {finding.notes && <div>{finding.notes}</div>}
          {finding.recommendation && <div><span className="faint">Recommendation:</span> {finding.recommendation}</div>}
          {finding.measurements?.map((m, i) => <span key={i} className="mono">{m.label}: {m.value} {m.unit} · </span>)}
          {finding.customerDecision !== 'none' && <div>Customer decision: <StatusPill status={finding.customerDecision} /></div>}
        </div>
      )}
      {finding && <div className="row wrap" style={{ marginTop: 8 }}>{evidence.filter(e => e.findingId === finding.id).map(e => <EvidenceThumb key={e.id} evidence={e} />)}
        {!locked && can('evidence:write') && <EvidenceUploader roId={ro.id} findingId={finding.id} onUploaded={() => onSaved(finding)} />}</div>}
      {editing && (
        <div className="stack" style={{ marginTop: 10 }}>
          <div className="row wrap">{CONDITIONS.map(c => <Button key={c} size="sm" variant={f.condition === c ? 'primary' : ''} onClick={() => setF(x => ({ ...x, condition: c, severity: SEVERITY_FOR[c]?.includes(x.severity) ? x.severity : '' }))}>{label(c)}</Button>)}</div>
          {SEVERITY_FOR[f.condition] && <Field label="Severity"><Select value={f.severity} placeholder="Choose severity" options={SEVERITY_FOR[f.condition]} onChange={e => setF(x => ({ ...x, severity: e.target.value }))} /></Field>}
          {f.measurements.length > 0 && <div className="grid-3">{f.measurements.map((m, i) => <Field key={i} label={`${m.label} (${m.unit})`}><Input inputMode="decimal" value={m.value} onChange={e => setM(i, e.target.value)} /></Field>)}</div>}
          <Field label="Technician notes"><Textarea value={f.notes} onChange={e => setF(x => ({ ...x, notes: e.target.value }))} /></Field>
          {['fail', 'attention'].includes(f.condition) && <Field label="Recommendation"><Input value={f.recommendation} onChange={e => setF(x => ({ ...x, recommendation: e.target.value }))} /></Field>}
          <div className="row">
            <Button size="sm" variant="primary" loading={busy} disabled={SEVERITY_FOR[f.condition] && !f.severity} onClick={correcting ? correct : save}>{correcting ? 'Save correction' : 'Save finding'}</Button>
            <Button size="sm" onClick={() => { setOpen(false); setCorrecting(false); }}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export const InspectionTab = ({ ro, reloadRo }) => {
  const { can } = useAuth();
  const confirm = useConfirm();
  const [run, busy] = useAction();
  const [custom, setCustom] = useState(null);
  const s = useAsync(() => api.get(`/repair-orders/${ro.id}/inspection`), [ro.id]);

  return (
    <Async state={s}>{({ inspection, template, findings, evidence }) => {
      const locked = inspection.status === 'completed';
      const active = findings.filter(f => f.status === 'active');
      const byKey = new Map(active.filter(f => f.itemKey).map(f => [f.itemKey, f]));
      const items = (template?.sections || []).flatMap(sec => sec.items.map(it => ({ ...it, category: sec.name })));
      const customs = active.filter(f => !f.itemKey || !items.some(i => i.key === f.itemKey));
      const counts = active.reduce((a, f) => ({ ...a, [f.condition]: (a[f.condition] || 0) + 1 }), {});
      const complete = async () => {
        const c = await confirm({ title: 'Complete inspection?', message: 'All findings will be locked. Later changes are recorded as corrections with a reason.', confirmLabel: 'Complete and lock' });
        if (c) run(async () => { await api.post(`/repair-orders/${ro.id}/inspection/complete`); s.reload(); reloadRo(); }, 'Inspection completed');
      };
      return (
        <div className="stack">
          <Card title={`Inspection · ${template?.name || 'Custom'}`} actions={<>
            <StatusPill status={inspection.status} />
            {!locked && inspection.status === 'pending' && can('inspections:write') && <Button size="sm" onClick={() => run(async () => { await api.post(`/repair-orders/${ro.id}/inspection/start`); s.reload(); reloadRo(); })}>Start</Button>}
            {!locked && can('inspections:complete') && <Button size="sm" variant="primary" loading={busy} onClick={complete}>Complete & lock</Button>}
          </>}>
            <div className="row wrap small">
              <Badge tone="ok">{counts.ok || 0} OK</Badge><Badge tone="warn">{counts.attention || 0} attention</Badge><Badge tone="danger">{counts.fail || 0} fail</Badge><Badge>{items.length - active.filter(f => items.some(i => i.key === f.itemKey)).length} not recorded</Badge>
              {locked && <span className="muted">Locked {dt(inspection.completedAt)}</span>}
            </div>
          </Card>
          {!template && <Alert tone="info">No inspection template is active. Record custom findings, or ask an administrator to create a template.</Alert>}
          {(template?.sections || []).map(sec => (
            <Card key={sec.key} title={sec.name}>
              <div className="stack">{sec.items.map(it => <FindingEditor key={`${it.key}:${byKey.get(it.key)?.id || ''}:${byKey.get(it.key)?.version || 0}`} ro={ro} item={{ ...it, category: sec.name }} finding={byKey.get(it.key)} evidence={evidence} locked={locked} onSaved={() => s.reload()} />)}</div>
            </Card>
          ))}
          <Card title="Additional findings" actions={!locked && can('inspections:write') && <Button size="sm" onClick={() => setCustom({ name: '', category: 'General' })}><Plus size={13} />Add finding</Button>}>
            <div className="stack">{customs.length ? customs.map(f => <FindingEditor key={`${f.id}:${f.version}`} ro={ro} item={{ key: f.itemKey, name: f.name, category: f.category }} finding={f} evidence={evidence} locked={locked} onSaved={() => s.reload()} />) : <p className="muted">None</p>}</div>
          </Card>
          <Modal open={Boolean(custom)} title="Add finding" onClose={() => setCustom(null)} footer={<Button variant="primary" disabled={!custom?.name?.trim()} onClick={() => run(async () => {
            await api.post(`/repair-orders/${ro.id}/inspection/findings`, { name: custom.name, category: custom.category, condition: 'not_inspected', notes: '' });
            setCustom(null);
            s.reload();
          })}>Add</Button>}>
            <Field label="Item"><Input value={custom?.name || ''} onChange={e => setCustom(x => ({ ...x, name: e.target.value }))} /></Field>
            <Field label="Category"><Input value={custom?.category || ''} onChange={e => setCustom(x => ({ ...x, category: e.target.value }))} /></Field>
          </Modal>
        </div>
      );
    }}</Async>
  );
};
