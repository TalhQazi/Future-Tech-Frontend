import React, { useState } from 'react';
import { Plus, Cpu, ListChecks } from 'lucide-react';
import { api, newIdempotencyKey } from '../../../api/client.js';
import { enqueue } from '../../offline.js';
import { useAuth } from '../../auth.jsx';
import { Card, Button, Field, Input, Select, Textarea, StatusPill, Badge, Modal, Alert, Table, Async, Empty, useAsync, useAction, useConfirm, label, dt } from '../../ui.jsx';

const ScanModal = ({ open, onClose, sessionId, phase, onSaved }) => {
  const [dtcs, setDtcs] = useState([{ code: '', description: '', module: '', status: 'active' }]);
  const [notes, setNotes] = useState('');
  const [source, setSource] = useState('manual_entry');
  const [run, busy] = useAction();
  const save = () => run(async () => {
    const res = await api.action(`/diagnostics/${sessionId}/scans`, { phase, source, notes, dtcs: dtcs.filter(d => d.code.trim()).map(d => ({ ...d, code: d.code.trim().toUpperCase() })) });
    onSaved(res.session);
    onClose();
  }, 'Scan recorded');
  return (
    <Modal open={open} title={phase === 'post_repair' ? 'Record post-repair scan' : 'Record scan results'} onClose={onClose} size="lg" footer={<Button variant="primary" loading={busy} onClick={save}>Save scan</Button>}>
      <Alert tone="info">Enter codes exactly as your scan tool reports them. Leave the list empty to record a scan with no codes.</Alert>
      <Field label="Source"><Select value={source} onChange={e => setSource(e.target.value)} options={[{ value: 'manual_entry', label: 'Typed from scan tool' }, { value: 'scan_report', label: 'From attached scan report' }]} /></Field>
      {dtcs.map((d, i) => (
        <div key={i} className="grid-4">
          <Field label="DTC"><Input className="ft-input mono" value={d.code} placeholder="P0302" onChange={e => setDtcs(xs => xs.map((x, j) => (j === i ? { ...x, code: e.target.value } : x)))} /></Field>
          <Field label="Description (from tool)"><Input value={d.description} onChange={e => setDtcs(xs => xs.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} /></Field>
          <Field label="Module"><Input value={d.module} onChange={e => setDtcs(xs => xs.map((x, j) => (j === i ? { ...x, module: e.target.value } : x)))} /></Field>
          <Field label="Status"><Select value={d.status} options={['active', 'pending', 'permanent', 'history']} onChange={e => setDtcs(xs => xs.map((x, j) => (j === i ? { ...x, status: e.target.value } : x)))} /></Field>
        </div>
      ))}
      <Button size="sm" onClick={() => setDtcs(xs => [...xs, { code: '', description: '', module: '', status: 'active' }])}><Plus size={13} />Add code</Button>
      <Field label="Notes"><Textarea value={notes} onChange={e => setNotes(e.target.value)} /></Field>
    </Modal>
  );
};

const MeasurementForm = ({ ro, session, specs, preset, onSaved, onClose }) => {
  const [f, setF] = useState({ component: '', parameter: '', value: '', unit: '', method: 'manual_meter', classification: 'authoritative', specificationId: '', conditions: '', ...preset });
  const [run, busy] = useAction();
  const set = (k) => (e) => setF(x => ({ ...x, [k]: e.target.value }));
  const pickSpec = (e) => {
    const spec = specs.find(s => s.id === e.target.value);
    setF(x => ({ ...x, specificationId: e.target.value, component: spec?.component || x.component, parameter: spec?.parameter || x.parameter, unit: spec?.unit || x.unit }));
  };
  const save = () => run(async () => {
    const { linkToStep, ...fields } = f;
    const body = { ...fields, value: Number(f.value), specificationId: f.specificationId || undefined, clientId: newIdempotencyKey() };
    if (!navigator.onLine) {
      await enqueue({ path: `/diagnostics/${session.id}/measurements`, body, label: `Measurement ${f.parameter}` });
      return onClose();
    }
    const res = await api.action(`/diagnostics/${session.id}/measurements`, body);
    onSaved(res.measurement);
    return onClose();
  });
  return (
    <div className="stack">
      <Field label="Specification" hint="Only reviewed, applicable, licensed specifications can produce a pass/fail result">
        <Select value={f.specificationId} onChange={pickSpec} placeholder="No specification (record only)" options={specs.map(s => ({ value: s.id, label: `${s.component} · ${s.parameter} (${s.unit}) — ${s.source?.name || 'source'} ${s.sourceVersion}` }))} />
      </Field>
      <div className="grid-3">
        <Field label="Component"><Input value={f.component} onChange={set('component')} /></Field>
        <Field label="Parameter"><Input value={f.parameter} onChange={set('parameter')} /></Field>
        <Field label="Value"><Input inputMode="decimal" value={f.value} onChange={set('value')} /></Field>
        <Field label="Unit"><Input value={f.unit} onChange={set('unit')} /></Field>
        <Field label="Method"><Select value={f.method} onChange={set('method')} options={['manual_meter', 'oscilloscope', 'pressure_gauge', 'precision_gauge', 'scan_tool_pid', 'visual', 'other']} /></Field>
        <Field label="Classification"><Select value={f.classification} onChange={set('classification')} options={['authoritative', 'comparative', 'observation']} /></Field>
      </div>
      <Field label="Test conditions"><Input value={f.conditions} placeholder="e.g. engine at operating temperature, key on engine off" onChange={set('conditions')} /></Field>
      <Button variant="primary" loading={busy} disabled={!f.parameter || f.value === '' || !f.unit} onClick={save}>Save measurement</Button>
    </div>
  );
};

export const DiagnosticsTab = ({ ro }) => {
  const { can } = useAuth();
  const confirm = useConfirm();
  const [run, busy] = useAction();
  const [scan, setScan] = useState(null);
  const [measure, setMeasure] = useState(null);
  const [conclusion, setConclusion] = useState(null);
  const s = useAsync(() => api.get(`/repair-orders/${ro.id}/diagnostics`), [ro.id]);
  const specs = useAsync(() => api.get('/techdata/specifications', { vehicleId: ro.vehicleId }).then(r => r.specifications).catch(() => []), [ro.vehicleId]);
  const session = s.data?.session;
  const codes = [...new Set((session?.dtcs || []).map(d => d.code))];
  const procedures = useAsync(() => (session ? Promise.all((codes.length ? codes : [undefined]).map(c => api.get('/techdata/procedures', { vehicleId: ro.vehicleId, dtc: c }).then(r => r.procedures))).then(l => [...new Map(l.flat().map(p => [p.id, p])).values()]) : Promise.resolve([])), [session?.id, codes.join(',')]);
  const causes = useAsync(() => (session ? api.get(`/diagnostics/${session.id}/causes`) : Promise.resolve(null)), [session?.id, session?.version]);
  const devices = useAsync(() => api.get('/automind/devices').then(r => r.devices).catch(() => []), []);
  const amStatus = useAsync(() => api.get('/automind/status').then(r => r.status).catch(() => null), []);
  const setSession = (sess) => s.setData({ ...s.data, session: sess });

  if (s.loading && !s.data) return <Async state={s}>{() => null}</Async>;
  if (!session) {
    return (
      <Card title="Diagnostics">
        <Empty title="No diagnostic session" hint="Start one to record codes, measurements and guided tests." action={can('diagnostics:write') && <Button variant="primary" loading={busy} onClick={() => run(async () => { await api.post(`/repair-orders/${ro.id}/diagnostics`); s.reload(); })}>Start diagnosis</Button>} />
      </Card>
    );
  }
  const activeRun = session.procedureRuns.find(r => r.status === 'active');
  const activeProc = procedures.data?.find(p => p.id === activeRun?.procedureDocId);
  const node = activeProc?.nodes.find(n => n.key === activeRun?.currentNodeKey);
  const advance = (body) => run(async () => setSession((await api.post(`/diagnostics/${session.id}/procedures/${activeRun.id}/advance`, body)).session));
  const postScans = session.scans.filter(x => x.phase === 'post_repair');
  const device = devices.data?.find(d => d.id === session.deviceId);
  const sendCommand = async (command, privileged) => {
    let authorizationReason;
    if (privileged) {
      const c = await confirm({ title: `${label(command)} changes vehicle state`, message: 'This command requires manager authorization and is recorded.', reason: 'Authorization reason', tone: 'danger' });
      if (!c) return;
      authorizationReason = c.reason;
    }
    run(async () => { await api.action(`/automind/devices/${device.id}/commands`, { sessionId: session.id, command, authorizationReason }); s.reload(); }, 'Command sent to AutoMind');
  };

  return (
    <div className="grid-2">
      <div className="stack">
        <Card title="Trouble codes" actions={can('diagnostics:write') && <Button size="sm" onClick={() => setScan('pre_repair')}><Plus size={13} />Record scan</Button>}>
          <Table rows={session.dtcs} empty="No codes recorded" rowKey="id" columns={[
            { label: 'Code', render: d => <span className="mono">{d.code}</span> },
            { label: 'Description', render: d => d.description || <span className="faint">not provided</span> },
            { label: 'Status', render: d => <StatusPill status={d.status} /> },
            { label: 'Source', render: d => <Badge tone={d.source === 'device_scan' ? 'info' : ''}>{d.source === 'device_scan' ? 'AutoMind' : label(d.source)}</Badge> },
            { label: 'Freeze frame', render: d => (d.freezeFrame?.length ? d.freezeFrame.map(f => `${f.name} ${f.value}${f.unit || ''}`).join(', ') : '—') }
          ]} />
        </Card>

        <Card title="Measurements" actions={can('diagnostics:write') && <Button size="sm" onClick={() => setMeasure({})}><Plus size={13} />Add measurement</Button>}>
          <Table rows={s.data.measurements} empty="No measurements" columns={[
            { label: 'Measurement', render: m => <div><strong>{m.component} {m.parameter}</strong><div className="small faint">{label(m.method)} · {m.classification}</div></div> },
            { label: 'Value', render: m => <span className="mono">{m.value} {m.unit}</span> },
            { label: 'Result', render: m => <div><StatusPill status={m.evaluation.result} /><div className="small faint">{m.evaluation.reason}</div></div> }
          ]} />
        </Card>

        <Card title="AutoMind" actions={<Cpu size={16} />}>
          {!amStatus.data?.configured ? <Alert tone="info">AutoMind gateway is not configured. Record scans and measurements manually.</Alert> : (
            <div className="stack">
              {!device ? (
                <Field label="Attach device"><Select placeholder="Choose device" options={(devices.data || []).filter(d => d.locationId === ro.locationId).map(d => ({ value: d.id, label: `${d.label || d.serialNumber} (${d.status})` }))} onChange={e => e.target.value && run(async () => { await api.post(`/diagnostics/${session.id}/device`, { deviceId: e.target.value }); s.reload(); })} /></Field>
              ) : (
                <div className="row wrap">
                  <Badge tone={device.status === 'online' ? 'ok' : 'warn'}>{device.label || device.serialNumber} · {device.status}</Badge>
                  {['READ_DTCS', 'READ_FREEZE_FRAME', 'READ_PIDS'].map(c => <Button key={c} size="sm" onClick={() => sendCommand(c, false)}>{label(c)}</Button>)}
                  {can('devices:command_privileged') && ['CLEAR_DTCS'].map(c => <Button key={c} size="sm" variant="danger" onClick={() => sendCommand(c, true)}>{label(c)}</Button>)}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      <div className="stack">
        <Card title="Evidence-ranked causes" actions={<ListChecks size={16} />}>
          <Async state={causes}>{c => (c ? (
            <div className="stack">
              {c.candidates.length === 0 && <p className="muted">{c.note}</p>}
              {c.candidates.slice(0, 5).map((cand, i) => (
                <div key={i} className="ft-card" style={{ background: 'var(--surface-2)', padding: 12 }}>
                  <div className="row between"><strong>{cand.cause}</strong><StatusPill status={cand.confidence} /></div>
                  <ul className="small muted" style={{ margin: '6px 0 0', paddingLeft: 16 }}>{cand.evidence.map((e, j) => <li key={j}>{e.summary}</li>)}</ul>
                  <div className="small faint">{cand.basis}</div>
                </div>
              ))}
              {c.nextTest && <Alert tone="info"><strong>Next test:</strong> {c.nextTest.title}<div className="small">{c.nextTest.reason}</div></Alert>}
              {c.candidates.length > 0 && <p className="small faint">{c.note}</p>}
            </div>
          ) : null)}</Async>
        </Card>

        <Card title="Guided procedure">
          {activeRun && node ? (
            <div className="stack">
              <div className="small faint">{activeProc.title} v{activeProc.version}</div>
              <strong>{node.title}</strong>
              {node.instructions && <p className="muted" style={{ whiteSpace: 'pre-wrap' }}>{node.instructions}</p>}
              {node.safetyNotes && <Alert tone="warn">{node.safetyNotes}</Alert>}
              {node.type === 'question' && <div className="row wrap">{node.options.map(o => <Button key={o.label} size="sm" onClick={() => advance({ optionLabel: o.label })}>{o.label}</Button>)}</div>}
              {['test', 'verify', 'inspection'].includes(node.type) && (node.specificationId
                ? <Button size="sm" variant="primary" onClick={() => setMeasure({ specificationId: node.specificationId, nodeKey: node.key, procedureRunId: activeRun.id, linkToStep: true })}>Record measurement for this step</Button>
                : <div className="row"><Button size="sm" onClick={() => advance({ result: 'pass' })}>Pass</Button><Button size="sm" variant="danger" onClick={() => advance({ result: 'fail' })}>Fail</Button></div>)}
              {['repair', 'end'].includes(node.type) && <Button size="sm" onClick={() => advance({ result: 'done' })}>Mark done</Button>}
              <Button size="sm" variant="ghost" onClick={async () => { const c = await confirm({ title: 'Escalate', reason: 'What help do you need?' }); if (c) run(async () => setSession((await api.post(`/diagnostics/${session.id}/escalate`, { reason: c.reason })).session), 'Manager notified'); }}>Escalate for help</Button>
            </div>
          ) : (
            <Async state={procedures}>{list => (list.length ? (
              <div className="stack-sm">{list.map(p => <div key={p.id} className="row between"><span>{p.title} <span className="faint small">v{p.version}</span></span>{can('diagnostics:write') && <Button size="sm" onClick={() => run(async () => setSession((await api.post(`/diagnostics/${session.id}/procedures`, { procedureDocId: p.id })).session))}>Start</Button>}</div>)}</div>
            ) : <p className="muted">No published procedure applies to this vehicle{codes.length ? ` and ${codes.join(', ')}` : ''}.</p>)}</Async>
          )}
          {session.procedureRuns.filter(r => r.status !== 'active').length > 0 && <div className="small faint" style={{ marginTop: 8 }}>{session.procedureRuns.filter(r => r.status !== 'active').length} completed procedure run(s)</div>}
        </Card>

        <Card title="Conclusion & verification">
          <div className="stack">
            {session.conclusion?.rootCause ? (
              <div className="small"><div><span className="faint">Root cause:</span> {session.conclusion.rootCause}</div><div><span className="faint">Correction:</span> {session.conclusion.correction}</div></div>
            ) : can('diagnostics:write') && <Button size="sm" onClick={() => setConclusion({ rootCause: '', component: '', correction: '' })}>Record conclusion</Button>}
            {session.status === 'concluded' && can('diagnostics:write') && (
              <div className="row wrap">
                <Button size="sm" onClick={() => setScan('post_repair')}>Record post-repair scan</Button>
                {postScans.map(ps => <Button key={ps.id} size="sm" variant="primary" onClick={async () => {
                  const c = await confirm({ title: 'Verify repair', message: `Use the post-repair scan from ${dt(ps.at)} (${ps.dtcCodes.length} code(s)). If the original codes are gone, a Confirmed Fix candidate is created for review.`, confirmLabel: 'Verify' });
                  if (c) run(async () => setSession((await api.post(`/diagnostics/${session.id}/verify`, { postRepairScanId: ps.id, roadTestPerformed: true })).session), 'Verification recorded');
                }}>Verify with scan {dt(ps.at)}</Button>)}
              </div>
            )}
            {session.verification?.result && <Alert tone={session.verification.result === 'passed' ? 'ok' : 'danger'}>Verification {session.verification.result}{session.verification.dtcsRemaining?.length ? `: ${session.verification.dtcsRemaining.join(', ')} still present` : ''}</Alert>}
          </div>
        </Card>
      </div>

      <ScanModal open={Boolean(scan)} phase={scan} sessionId={session.id} onClose={() => setScan(null)} onSaved={setSession} />
      <Modal open={Boolean(measure)} title="Record measurement" size="lg" onClose={() => setMeasure(null)}>
        {measure && <MeasurementForm ro={ro} session={session} specs={specs.data || []} preset={measure} onClose={() => setMeasure(null)} onSaved={(m) => {
          s.reload();
          if (measure.linkToStep && m.evaluation.result !== 'not_evaluated') advance({ measurementId: m.id });
        }} />}
      </Modal>
      <Modal open={Boolean(conclusion)} title="Diagnosis conclusion" onClose={() => setConclusion(null)} footer={<Button variant="primary" loading={busy} disabled={!conclusion?.rootCause || !conclusion?.correction} onClick={() => run(async () => { setSession((await api.post(`/diagnostics/${session.id}/conclude`, conclusion)).session); setConclusion(null); }, 'Conclusion recorded')}>Save</Button>}>
        <Field label="Root cause"><Textarea value={conclusion?.rootCause || ''} onChange={e => setConclusion(x => ({ ...x, rootCause: e.target.value }))} /></Field>
        <Field label="Component"><Input value={conclusion?.component || ''} onChange={e => setConclusion(x => ({ ...x, component: e.target.value }))} /></Field>
        <Field label="Correction performed / recommended"><Textarea value={conclusion?.correction || ''} onChange={e => setConclusion(x => ({ ...x, correction: e.target.value }))} /></Field>
      </Modal>
    </div>
  );
};

