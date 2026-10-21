import React, { useState } from 'react';
import { Plus, ThumbsUp, Check } from 'lucide-react';
import { api } from '../../api/client.js';
import { navigate } from '../../router.js';
import { useAuth } from '../auth.jsx';
import { useWorkspace } from '../Shell.jsx';
import { Card, PageHeader, Button, Field, Input, Select, Textarea, Table, StatusPill, Badge, Modal, Alert, Async, Tabs, Empty, useAsync, useAction, useConfirm, dt, d, label } from '../ui.jsx';
import { WiringViewer } from './WiringViewer.jsx';

const JsonEditor = ({ title, template, onSubmit, onClose }) => {
  const [text, setText] = useState(JSON.stringify(template, null, 2));
  const [err, setErr] = useState(null);
  const [run, busy] = useAction();
  return (
    <Modal open title={title} size="lg" onClose={onClose} footer={<Button variant="primary" loading={busy} onClick={() => {
      let parsed;
      try { parsed = JSON.parse(text); setErr(null); } catch (e) { setErr(e.message); return; }
      run(async () => { await onSubmit(parsed); onClose(); }, 'Saved as draft for review');
    }}>Save draft</Button>}>
      {err && <Alert tone="danger">Invalid JSON: {err}</Alert>}
      <Textarea className="mono" style={{ minHeight: 380, fontFamily: 'var(--ft-font-mono)', fontSize: 12 }} value={text} onChange={e => setText(e.target.value)} />
    </Modal>
  );
};

// ---------------------------------------------------------------------------
export const TechData = ({ id }) => {
  const { can, user } = useAuth();
  const confirm = useConfirm();
  const [run] = useAction();
  const [tab, setTab] = useState('specifications');
  const [editor, setEditor] = useState(null);
  const [srcForm, setSrcForm] = useState(null);
  const status = useAsync(() => api.get('/techdata/status').then(r => r.provider), []);
  const sources = useAsync(() => api.get('/techdata/sources').then(r => r.sources), []);
  const specs = useAsync(() => api.get('/techdata/specifications', { status: tab === 'review' ? 'draft' : 'active' }).then(r => r.specifications), [tab]);
  const procs = useAsync(() => api.get('/techdata/procedures', { status: 'published' }).then(r => r.procedures), []);
  const drafts = useAsync(() => api.get('/techdata/procedures', { status: 'draft' }).then(r => r.procedures), []);
  const wiring = useAsync(() => api.get('/wiring').then(r => r.diagrams), []);
  const diagram = useAsync(() => (id ? api.get(`/wiring/${id}`).then(r => r.diagram) : Promise.resolve(null)), [id]);
  const srcOptions = (sources.data || []).filter(s => s.status === 'active').map(s => ({ value: s.id, label: `${s.name} ${s.version}` }));
  if (id) return <Async state={diagram}>{dg => <><a href="#/app/techdata" className="small">← Technical data</a><PageHeader title={dg.title} subtitle={`${dg.system} · v${dg.version}`} /><WiringViewer diagram={dg} /></>}</Async>;

  return (
    <>
      <PageHeader title="Technical data" subtitle="Specifications, procedures and wiring with source provenance" />
      <Async state={status}>{st => (st.configured ? <Alert tone="ok">Licensed provider: {st.provider}</Alert> : <Alert tone="info">No licensed OEM data provider is connected. Records below are entered by your team from documents you are licensed to use, cite their source, and require review by a second person before use.</Alert>)}</Async>
      <Tabs tabs={['specifications', can('techdata:review') && 'review', 'procedures', 'wiring', 'sources'].filter(Boolean)} active={tab} onChange={setTab} />
      {(tab === 'specifications' || tab === 'review') && (
        <Card title={tab === 'review' ? 'Awaiting review' : 'Active specifications'} actions={can('techdata:manage') && <Button size="sm" onClick={() => setEditor({ kind: 'spec', template: { sourceId: srcOptions[0]?.value || '', sourceVersion: '', applicability: { makes: [], models: [], yearFrom: null, yearTo: null, engines: [] }, system: '', component: '', parameter: '', unit: '', comparison: 'range', minValue: 0, maxValue: 0, conditions: '' } })}><Plus size={13} />New specification</Button>}>
          <Async state={specs}>{rows => <Table rows={rows} empty="No specifications" columns={[
            { label: 'Component / parameter', render: s => <div><strong>{s.component}</strong> · {s.parameter}<div className="small faint">{s.conditions}</div></div> },
            { label: 'Spec', render: s => <span className="mono">{s.comparison === 'range' ? `${s.minValue}–${s.maxValue}` : s.comparison === 'min' ? `≥ ${s.minValue}` : s.comparison === 'max' ? `≤ ${s.maxValue}` : `${s.nominalValue} ± ${s.tolerance}`} {s.unit}</span> },
            { label: 'Applies to', render: s => [s.applicability.makes.join('/'), s.applicability.models.join('/'), s.applicability.yearFrom && `${s.applicability.yearFrom}-${s.applicability.yearTo || ''}`].filter(Boolean).join(' ') || 'All' },
            { label: 'Source', render: s => <span className="small">{s.source?.name} {s.sourceVersion}</span> },
            { label: '', render: s => (tab === 'review' && s.enteredBy !== user.id ? <div className="row"><Button size="sm" variant="primary" onClick={() => run(async () => { await api.post(`/techdata/specifications/${s.id}/review`, { approve: true }); specs.reload(); }, 'Specification activated')}>Approve</Button><Button size="sm" variant="ghost" onClick={async () => { const c = await confirm({ title: 'Reject specification', reason: true }); if (c) run(async () => { await api.post(`/techdata/specifications/${s.id}/review`, { approve: false, note: c.reason }); specs.reload(); }); }}>Reject</Button></div> : tab === 'review' ? <span className="small faint">Needs another reviewer</span> : null) }
          ]} />}</Async>
        </Card>
      )}
      {tab === 'procedures' && (
        <Card title="Diagnostic procedures" actions={can('techdata:manage') && <Button size="sm" onClick={() => setEditor({ kind: 'procedure', template: { title: '', summary: '', sourceId: srcOptions[0]?.value || '', sourceVersion: '', dtcCodes: [], applicability: { makes: [], models: [], engines: [] }, startNodeKey: 'step1', nodes: [{ key: 'step1', type: 'test', title: '', instructions: '', component: '', specificationId: null, onPass: 'done', onFail: 'repair1' }, { key: 'repair1', type: 'repair', title: '', instructions: '', onPass: 'done' }, { key: 'done', type: 'end', title: 'Procedure complete' }] } })}><Plus size={13} />New procedure</Button>}>
          <Async state={procs}>{rows => <Table rows={rows} empty="No published procedures" columns={[{ label: 'Title', render: p => p.title }, { label: 'DTCs', render: p => p.dtcCodes.join(', ') || '—' }, { label: 'Steps', render: p => p.nodes.length }, { label: 'Version', render: p => `v${p.version}` }, { label: 'Published', render: p => d(p.publishedAt) }]} />}</Async>
          {can('techdata:review') && <Async state={drafts}>{rows => rows.length > 0 && <div style={{ marginTop: 12 }}><h4 className="small faint">Drafts awaiting publication</h4><Table rows={rows} columns={[{ label: 'Title', render: p => p.title }, { label: 'Version', render: p => `v${p.version}` }, { label: '', render: p => <Button size="sm" variant="primary" onClick={() => run(async () => { await api.post(`/techdata/procedures/${p.id}/publish`); procs.reload(); drafts.reload(); }, 'Published')}>Publish</Button> }]} /></div>}</Async>}
        </Card>
      )}
      {tab === 'wiring' && (
        <Card title="Wiring diagrams" actions={can('techdata:manage') && <Button size="sm" onClick={() => setEditor({ kind: 'wiring', template: { title: '', system: '', sourceId: srcOptions[0]?.value || '', sourceVersion: '', applicability: { makes: [], models: [], engines: [] }, canvas: { width: 1200, height: 800 }, components: [{ id: 'ecm', label: 'ECM', type: 'module', x: 80, y: 120, connectors: [{ id: 'c1', label: 'C1', pins: [{ id: 'p12', number: '12', label: 'Signal', circuitId: 'w1' }] }] }, { id: 'sensor', label: 'Sensor', type: 'sensor', x: 600, y: 140, connectors: [] }], circuits: [{ id: 'w1', name: 'Sensor signal', wireColor: '#36d6f5', from: { componentId: 'ecm', pinId: 'p12' }, to: { componentId: 'sensor' }, points: [] }], testPoints: [{ id: 'tp1', label: 'TP1', circuitId: 'w1', x: 400, y: 170, instructions: '' }] } })}><Plus size={13} />Import diagram (JSON)</Button>}>
          <Async state={wiring}>{rows => <Table rows={rows} empty="No published diagrams" onRowClick={w => navigate(`#/app/techdata/${w.id}`)} columns={[{ label: 'Title', render: w => w.title }, { label: 'System', render: w => w.system }, { label: 'Version', render: w => `v${w.version}` }]} />}</Async>
        </Card>
      )}
      {tab === 'sources' && (
        <Card title="Technical sources & licensing" actions={can('techdata:manage') && <Button size="sm" onClick={() => setSrcForm({ name: '', publisher: '', kind: 'oem_service_information', version: '', documentRef: '', license: { licensor: '', agreementRef: '', permittedContexts: ['technician'], aiUseAllowed: false, attribution: '' } })}><Plus size={13} />Register source</Button>}>
          <Async state={sources}>{rows => <Table rows={rows} empty="No sources registered" columns={[
            { label: 'Source', render: s => <div><strong>{s.name}</strong> <span className="faint">{s.version}</span><div className="small faint">{s.publisher} · {label(s.kind)}</div></div> },
            { label: 'License', render: s => <span className="small">{s.license?.licensor || '—'} {s.license?.agreementRef ? `· ${s.license.agreementRef}` : ''}<br />contexts: {(s.license?.permittedContexts || []).join(', ')} · AI use {s.license?.aiUseAllowed ? 'allowed' : 'not allowed'}</span> },
            { label: 'Status', render: s => <StatusPill status={s.status} /> }
          ]} />}</Async>
        </Card>
      )}
      {editor && <JsonEditor title={`New ${editor.kind} (draft)`} template={editor.template} onClose={() => setEditor(null)} onSubmit={async (body) => {
        if (editor.kind === 'spec') { await api.post('/techdata/specifications', body); specs.reload(); }
        if (editor.kind === 'procedure') { await api.post('/techdata/procedures', body); drafts.reload(); }
        if (editor.kind === 'wiring') { const r = await api.post('/wiring', body); await confirm({ title: 'Draft saved', message: `Another reviewer must publish "${r.diagram.title}" before technicians can use it.` }); }
      }} />}
      <Modal open={Boolean(srcForm)} title="Register technical source" onClose={() => setSrcForm(null)} footer={<Button variant="primary" disabled={!srcForm?.name || !srcForm?.version} onClick={() => run(async () => { await api.post('/techdata/sources', srcForm); setSrcForm(null); sources.reload(); }, 'Source registered')}>Save</Button>}>
        <div className="grid-2">
          <Field label="Name"><Input value={srcForm?.name || ''} onChange={e => setSrcForm(f => ({ ...f, name: e.target.value }))} /></Field>
          <Field label="Version / edition"><Input value={srcForm?.version || ''} onChange={e => setSrcForm(f => ({ ...f, version: e.target.value }))} /></Field>
          <Field label="Publisher"><Input value={srcForm?.publisher || ''} onChange={e => setSrcForm(f => ({ ...f, publisher: e.target.value }))} /></Field>
          <Field label="Kind"><Select value={srcForm?.kind} options={['oem_service_information', 'technical_service_bulletin', 'licensed_aggregator', 'public_regulatory', 'shop_authored']} onChange={e => setSrcForm(f => ({ ...f, kind: e.target.value }))} /></Field>
          <Field label="Licensor"><Input value={srcForm?.license.licensor || ''} onChange={e => setSrcForm(f => ({ ...f, license: { ...f.license, licensor: e.target.value } }))} /></Field>
          <Field label="Agreement reference"><Input value={srcForm?.license.agreementRef || ''} onChange={e => setSrcForm(f => ({ ...f, license: { ...f.license, agreementRef: e.target.value } }))} /></Field>
        </div>
        <Field label="Document reference (manual, section, page)"><Input value={srcForm?.documentRef || ''} onChange={e => setSrcForm(f => ({ ...f, documentRef: e.target.value }))} /></Field>
        <label className="row small"><input type="checkbox" checked={srcForm?.license.permittedContexts.includes('advisor')} onChange={e => setSrcForm(f => ({ ...f, license: { ...f.license, permittedContexts: e.target.checked ? [...f.license.permittedContexts, 'advisor'] : f.license.permittedContexts.filter(x => x !== 'advisor') } }))} />License permits display to service advisors</label>
      </Modal>
    </>
  );
};

// ---------------------------------------------------------------------------
export const Fixes = () => {
  const { can, user } = useAuth();
  const [run] = useAction();
  const confirm = useConfirm();
  const [q, setQ] = useState({ dtc: '', make: '' });
  const verified = useAsync(() => api.get('/confirmed-fixes', { ...q, status: 'verified' }).then(r => r.confirmedFixes), [q.dtc, q.make]);
  const candidates = useAsync(() => (can('fixes:verify') ? api.get('/confirmed-fixes', { status: 'candidate' }).then(r => r.confirmedFixes) : Promise.resolve([])), []);
  return (
    <>
      <PageHeader title="Confirmed fixes" subtitle="Built only from repairs verified by a post-repair scan and reviewed by a second person" actions={<><Input placeholder="DTC" value={q.dtc} onChange={e => setQ(x => ({ ...x, dtc: e.target.value }))} style={{ width: 110 }} /><Input placeholder="Make" value={q.make} onChange={e => setQ(x => ({ ...x, make: e.target.value }))} style={{ width: 140 }} /></>} />
      {can('fixes:verify') && <Async state={candidates}>{rows => rows.length > 0 && (
        <Card title="Candidates awaiting verification">
          <Table rows={rows} columns={[
            { label: 'Codes', render: f => <span className="mono">{f.dtcCodes.join(', ')}</span> }, { label: 'Vehicle', render: f => `${f.vehicle.year} ${f.vehicle.make} ${f.vehicle.model}` },
            { label: 'Root cause → correction', render: f => <div className="small"><strong>{f.rootCause}</strong><div>{f.correction}</div></div> }, { label: 'Evidence', render: f => <span className="small">{f.evidence.dtcsBefore?.join(', ')} → cleared · RO {f.sourceRepairOrders?.join(', ')}</span> },
            { label: '', render: f => (f.technicianId === user.id ? <span className="small faint">Your repair</span> : <div className="row"><Button size="sm" variant="primary" onClick={() => run(async () => { await api.post(`/confirmed-fixes/${f.id}/review`, { approve: true }); candidates.reload(); verified.reload(); }, 'Fix verified')}>Verify</Button><Button size="sm" variant="ghost" onClick={async () => { const c = await confirm({ title: 'Reject candidate', reason: true }); if (c) run(async () => { await api.post(`/confirmed-fixes/${f.id}/review`, { approve: false, reason: c.reason }); candidates.reload(); }); }}>Reject</Button></div>) }
          ]} />
        </Card>
      )}</Async>}
      <Async state={verified}>{rows => (rows.length ? rows.map(f => (
        <Card key={f.id} title={<span><span className="mono">{f.dtcCodes.join(', ')}</span> · {f.vehicle.make} {f.vehicle.model}</span>} actions={<Badge tone="ok">{f.verifiedOccurrences} verified repair{f.verifiedOccurrences > 1 ? 's' : ''}</Badge>}>
          <p><strong>{f.rootCause}</strong></p><p className="muted">{f.correction}</p>
          {f.partsReplaced?.length > 0 && <p className="small faint">Parts: {f.partsReplaced.map(p => `${p.partNumber} ${p.description}`).join(', ')}</p>}
          <p className="small faint">Source repair orders: {f.sourceRepairOrders.join(', ')}</p>
        </Card>
      )) : <Empty title="No verified fixes yet" hint="Fixes appear after a diagnosis is verified with a post-repair scan and approved by a reviewer." />)}</Async>
    </>
  );
};

// ---------------------------------------------------------------------------
export const PartsIntel = () => {
  const [groupBy, setGroupBy] = useState('part');
  const s = useAsync(() => api.get('/parts-intelligence/reliability', { groupBy }).then(r => r.report), [groupBy]);
  const repeats = useAsync(() => api.get('/parts-intelligence/repeat-failures').then(r => r.repeatFailures), []);
  return (
    <>
      <PageHeader title="Parts intelligence" subtitle="Failure and warranty rates from installed-part records (last 12 months)" actions={<Select value={groupBy} options={['part', 'supplier', 'lot']} onChange={e => setGroupBy(e.target.value)} style={{ width: 'auto' }} />} />
      <Async state={s}>{rows => <Table rows={rows} rowKey="label" empty="No installed parts recorded yet" columns={[
        { label: label(groupBy), render: r => <div><strong>{r.label}</strong><div className="small faint">{r.description}</div></div> },
        { label: 'Installed', right: true, render: r => r.installed }, { label: 'Failed', right: true, render: r => r.failed }, { label: 'Defective', right: true, render: r => r.defective },
        { label: 'Failure rate', right: true, render: r => `${r.failureRatePct}%` }, { label: 'Avg days', right: true, render: r => r.avgDaysToFailure ?? '—' }, { label: '', render: r => (r.sampleSizeNote ? <span className="small faint">{r.sampleSizeNote}</span> : null) }
      ]} />}</Async>
      <Card title="Repeat failures on the same vehicle">
        <Async state={repeats}>{rows => <Table rows={rows} rowKey="vehicleId" empty="None" onRowClick={r => navigate(`#/app/vehicles/${r.vehicleId}`)} columns={[{ label: 'Vehicle', render: r => r.vehicleId.slice(0, 8) }, { label: 'Part', render: r => r.partId.slice(0, 8) }, { label: 'Failures', render: r => r.failures }, { label: 'Last', render: r => d(r.lastFailedAt) }]} />}</Async>
      </Card>
    </>
  );
};

// ---------------------------------------------------------------------------
export const Devices = () => {
  const { can } = useAuth();
  const { locationId } = useWorkspace();
  const [run, busy] = useAction();
  const [reg, setReg] = useState(null);
  const [key, setKey] = useState(null);
  const status = useAsync(() => api.get('/automind/status').then(r => r.status), []);
  const s = useAsync(() => api.get('/automind/devices').then(r => r.devices), []);
  return (
    <>
      <PageHeader title="AutoMind devices" actions={can('devices:manage') && <Button variant="primary" onClick={() => setReg({ serialNumber: '', label: '' })}><Plus size={14} />Register device</Button>} />
      <Async state={status}>{st => (st.configured ? <Alert tone="ok">Gateway connected: {st.gatewayUrl}. Device push ingest {st.ingestConfigured ? 'enabled' : 'uses per-device keys'}.</Alert> : <Alert tone="warn">AutoMind gateway is not configured (AUTOMIND_GATEWAY_URL). Devices can be registered, but commands are unavailable; technicians record diagnostics manually.</Alert>)}</Async>
      {key && <Alert tone="info">Device ingest key (shown once — configure it on the device bridge): <span className="mono" style={{ wordBreak: 'break-all' }}>{key}</span></Alert>}
      <Async state={s}>{rows => <Table rows={rows} empty="No devices registered" columns={[
        { label: 'Device', render: x => <div><strong>{x.label || x.serialNumber}</strong><div className="mono small faint">{x.serialNumber}</div></div> }, { label: 'Model / firmware', render: x => `${x.model || '—'} ${x.firmwareVersion || ''}` },
        { label: 'Status', render: x => <StatusPill status={x.status} /> }, { label: 'Last seen', render: x => dt(x.lastSeenAt) }, { label: 'Capabilities', render: x => (x.capabilities?.discoveredAt ? `${x.capabilities.supportedPids.length} PIDs · ${x.capabilities.commands.length} commands` : 'not discovered') },
        { label: '', render: x => can('devices:manage') && <Button size="sm" loading={busy} onClick={() => run(async () => { await api.post(`/automind/devices/${x.id}/discover`); s.reload(); }, 'Capabilities refreshed')}>Discover</Button> }
      ]} />}</Async>
      <Modal open={Boolean(reg)} title="Register AutoMind device" onClose={() => setReg(null)} footer={<Button variant="primary" disabled={!reg?.serialNumber} onClick={() => run(async () => { const r = await api.post('/automind/devices', { ...reg, locationId }); setKey(r.ingestKey); setReg(null); s.reload(); }, 'Device registered')}>Register</Button>}>
        <Field label="Serial number"><Input value={reg?.serialNumber || ''} onChange={e => setReg(r => ({ ...r, serialNumber: e.target.value }))} /></Field>
        <Field label="Label"><Input value={reg?.label || ''} onChange={e => setReg(r => ({ ...r, label: e.target.value }))} /></Field>
      </Modal>
    </>
  );
};

// ---------------------------------------------------------------------------
const RULE_TEMPLATES = {
  maintenance_interval: { intervalKey: 'oil_change', leadMiles: 500, leadDays: 14 },
  declined_finding_followup: { severities: ['safety', 'repair'] },
  repeat_dtc: { minOccurrences: 2 },
  fuel_economy_anomaly: {},
  part_warranty_expiry: { leadDays: 30 }
};
export const Predictive = () => {
  const { can } = useAuth();
  const [run] = useAction();
  const [editor, setEditor] = useState(null);
  const rules = useAsync(() => api.get('/predictive/rules').then(r => r.rules), []);
  return (
    <>
      <PageHeader title="Predictive maintenance" subtitle="Deterministic, versioned rules. Signals are recommendations only and never create paid work." actions={can('predictive:manage') && <Button variant="primary" onClick={() => setEditor({ key: '', name: '', kind: 'maintenance_interval', parameters: RULE_TEMPLATES.maintenance_interval })}><Plus size={14} />New rule version</Button>} />
      <Alert tone="info">Maintenance-interval rules use the intervals your shop defines in corporate settings, measured from the last recorded service on each vehicle.</Alert>
      <Async state={rules}>{rows => <Table rows={rows} empty="No rules yet" columns={[
        { label: 'Rule', render: r => <div><strong>{r.name}</strong><div className="mono small faint">{r.key} v{r.version}</div></div> }, { label: 'Kind', render: r => label(r.kind) },
        { label: 'Parameters', render: r => <span className="mono small">{JSON.stringify(r.parameters)}</span> }, { label: 'Active', render: r => <StatusPill status={r.active ? 'active' : 'retired'} /> }
      ]} />}</Async>
      <Modal open={Boolean(editor)} title="Publish rule version" onClose={() => setEditor(null)} footer={<Button variant="primary" disabled={!editor?.key || !editor?.name} onClick={() => run(async () => { await api.post('/predictive/rules', editor); setEditor(null); rules.reload(); }, 'Rule published')}>Publish</Button>}>
        <Field label="Key"><Input value={editor?.key || ''} onChange={e => setEditor(x => ({ ...x, key: e.target.value }))} /></Field>
        <Field label="Name"><Input value={editor?.name || ''} onChange={e => setEditor(x => ({ ...x, name: e.target.value }))} /></Field>
        <Field label="Kind"><Select value={editor?.kind} options={Object.keys(RULE_TEMPLATES)} onChange={e => setEditor(x => ({ ...x, kind: e.target.value, parameters: RULE_TEMPLATES[e.target.value] }))} /></Field>
        <Field label="Parameters (JSON)"><Textarea className="mono" value={JSON.stringify(editor?.parameters || {}, null, 2)} onChange={e => { try { const p = JSON.parse(e.target.value); setEditor(x => ({ ...x, parameters: p })); } catch { /* keep typing */ } }} /></Field>
      </Modal>
    </>
  );
};

// ---------------------------------------------------------------------------
export const Forum = ({ id }) => {
  const { can, user } = useAuth();
  const [run, busy] = useAction();
  const [q, setQ] = useState('');
  const [post, setPost] = useState(null);
  const [replyText, setReplyText] = useState('');
  const list = useAsync(() => api.get('/forum', { q: q || undefined }).then(r => r.threads), [q]);
  const thread = useAsync(() => (id ? api.get(`/forum/${id}`) : Promise.resolve(null)), [id]);
  if (id) {
    return (
      <Async state={thread}>{t => (
        <>
          <a href="#/app/forum" className="small">← Forum</a>
          <Card title={t.thread.title} actions={<><StatusPill status={t.thread.status} /><Button size="sm" variant="ghost" disabled={t.thread.votedByMe} onClick={() => run(async () => { await api.post(`/forum/${id}/vote`); thread.reload(); })}><ThumbsUp size={13} />{t.thread.voteCount}</Button></>}>
            <p className="small faint">{t.thread.authorName} · {label(t.thread.authorRole)} · {dt(t.thread.createdAt)}{t.thread.context?.dtcCodes?.length ? ` · ${t.thread.context.dtcCodes.join(', ')}` : ''}{t.thread.context?.make ? ` · ${t.thread.context.make} ${t.thread.context.model || ''}` : ''}</p>
            <p style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{t.thread.body}</p>
            {t.verifiedFix ? <Alert tone="ok">Linked to a verified repair outcome: {t.verifiedFix.rootCause}</Alert> : t.thread.status === 'solved' && <Alert tone="info">Accepted by the author; not linked to a verified repair outcome.</Alert>}
          </Card>
          {t.replies.map(r => (
            <Card key={r.id} title={<span className="small">{r.authorName} · {label(r.authorRole)} · {dt(r.createdAt)}</span>} actions={<>
              {r.isAccepted && <Badge tone="ok"><Check size={11} />Accepted</Badge>}
              <Button size="sm" variant="ghost" disabled={r.votedByMe} onClick={() => run(async () => { await api.post(`/forum/replies/${r.id}/vote`); thread.reload(); })}><ThumbsUp size={13} />{r.voteCount}</Button>
              {!r.isAccepted && (t.thread.authorId === user.id || can('forum:moderate')) && <Button size="sm" onClick={() => run(async () => { await api.post(`/forum/${id}/accept/${r.id}`); thread.reload(); }, 'Solution accepted')}>Accept solution</Button>}
            </>}><p style={{ whiteSpace: 'pre-wrap' }}>{r.body}</p></Card>
          ))}
          {t.thread.status !== 'locked' && <Card title="Reply"><Textarea value={replyText} onChange={e => setReplyText(e.target.value)} /><div style={{ marginTop: 8 }}><Button variant="primary" loading={busy} disabled={!replyText.trim()} onClick={() => run(async () => { await api.post(`/forum/${id}/replies`, { body: replyText }); setReplyText(''); thread.reload(); })}>Post reply</Button></div></Card>}
        </>
      )}</Async>
    );
  }
  return (
    <>
      <PageHeader title="Technician forum" actions={<><Input placeholder="Search" value={q} onChange={e => setQ(e.target.value)} style={{ width: 220 }} />{can('forum:write') && <Button variant="primary" onClick={() => setPost({ title: '', body: '', make: '', model: '', dtc: '' })}><Plus size={14} />New thread</Button>}</>} />
      <Alert tone="info">Do not post customer names, contact details or VINs. Link repair orders only through the context fields.</Alert>
      <Async state={list}>{rows => <Table rows={rows} empty="No threads yet" onRowClick={t => navigate(`#/app/forum/${t.id}`)} columns={[
        { label: 'Thread', render: t => <div><strong>{t.title}</strong><div className="small faint">{t.authorName} · {t.context?.dtcCodes?.join(', ')} {t.context?.make}</div></div> },
        { label: 'Status', render: t => <StatusPill status={t.status} /> }, { label: 'Replies', right: true, render: t => t.replyCount }, { label: 'Votes', right: true, render: t => t.voteCount }, { label: 'Activity', render: t => dt(t.lastActivityAt) }
      ]} />}</Async>
      <Modal open={Boolean(post)} title="New thread" size="lg" onClose={() => setPost(null)} footer={<Button variant="primary" loading={busy} disabled={!post?.title || !post?.body} onClick={() => run(async () => {
        const r = await api.post('/forum', { title: post.title, body: post.body, context: { make: post.make || undefined, model: post.model || undefined, dtcCodes: post.dtc ? post.dtc.split(/[ ,]+/).filter(Boolean).map(x => x.toUpperCase()) : [] } });
        setPost(null);
        navigate(`#/app/forum/${r.thread.id}`);
      })}>Post</Button>}>
        <Field label="Title"><Input value={post?.title || ''} onChange={e => setPost(p => ({ ...p, title: e.target.value }))} /></Field>
        <div className="grid-3">
          <Field label="Make"><Input value={post?.make || ''} onChange={e => setPost(p => ({ ...p, make: e.target.value }))} /></Field>
          <Field label="Model"><Input value={post?.model || ''} onChange={e => setPost(p => ({ ...p, model: e.target.value }))} /></Field>
          <Field label="DTCs"><Input value={post?.dtc || ''} onChange={e => setPost(p => ({ ...p, dtc: e.target.value }))} /></Field>
        </div>
        <Field label="Details, tests performed, measurements"><Textarea style={{ minHeight: 160 }} value={post?.body || ''} onChange={e => setPost(p => ({ ...p, body: e.target.value }))} /></Field>
      </Modal>
    </>
  );
};

