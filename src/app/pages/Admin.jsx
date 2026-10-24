import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../../api/client.js';
import { useAuth } from '../auth.jsx';
import { useWorkspace } from '../Shell.jsx';
import { Card, PageHeader, Button, Field, Input, Select, Textarea, Table, StatusPill, Badge, Modal, Alert, Async, Tabs, useAsync, useAction, useConfirm, money, dt, label } from '../ui.jsx';
import { MoneyInput } from '../shared.jsx';

const STAFF_ROLES = ['advisor', 'technician', 'parts', 'accounting', 'manager', 'executive', 'admin'];

const Users = () => {
  const { user, can } = useAuth();
  const { locations } = useWorkspace();
  const confirm = useConfirm();
  const [run, busy] = useAction();
  const [form, setForm] = useState(null);
  const [invite, setInvite] = useState(null);
  const s = useAsync(() => api.get('/users').then(r => r.users), []);
  const roles = user.role === 'admin' ? STAFF_ROLES : STAFF_ROLES.filter(r => !['manager', 'executive', 'admin'].includes(r));
  const save = () => run(async () => {
    const body = { name: form.name, role: form.role, phone: form.phone || undefined, specialty: form.specialty || undefined, locationIds: form.locationIds, laborCostRateCents: form.laborCostRateCents ?? null };
    if (form.id) await api.patch(`/users/${form.id}`, { ...body, reason: 'Updated by administrator' });
    else setInvite(await api.post('/users', { ...body, email: form.email }));
    setForm(null);
    s.reload();
  }, form?.id ? 'User updated; their sessions were refreshed' : 'Invitation created');
  const act = async (u, action) => {
    if (action === 'mfa') {
      const c = await confirm({ title: `Reset MFA for ${u.name}?`, message: 'They must enroll a new authenticator at next sign-in.', reason: true, tone: 'danger' });
      if (c) run(async () => { await api.post(`/users/${u.id}/reset-mfa`, { reason: c.reason }); s.reload(); }, 'MFA reset');
    } else if (action === 'status') {
      const next = u.status === 'disabled' ? 'active' : 'disabled';
      const c = await confirm({ title: `${next === 'disabled' ? 'Disable' : 'Re-enable'} ${u.name}?`, reason: true, tone: next === 'disabled' ? 'danger' : undefined });
      if (c) run(async () => { await api.patch(`/users/${u.id}`, { status: next, reason: c.reason }); s.reload(); }, 'Access updated');
    } else if (action === 'invite') {
      run(async () => setInvite(await api.post(`/users/${u.id}/resend-invite`)), 'Invitation re-issued');
    }
  };
  return (
    <Card title="Staff accounts" actions={can('users:manage') && <Button size="sm" variant="primary" onClick={() => setForm({ name: '', email: '', role: 'advisor', locationIds: locations.map(l => l.id).slice(0, 1) })}><Plus size={13} />Invite staff</Button>}>
      {invite && <Alert tone={invite.inviteDelivery === 'sent' ? 'ok' : 'warn'}>{invite.inviteDelivery === 'sent' ? 'Invitation emailed.' : <>Email delivery is not configured. Share this one-time link securely: <span className="mono small" style={{ wordBreak: 'break-all' }}>{invite.inviteLink}</span></>}</Alert>}
      <Async state={s}>{rows => <Table rows={rows} columns={[
        { label: 'Name', render: u => <div><strong>{u.name}</strong><div className="small faint">{u.email}</div></div> }, { label: 'Role', render: u => <Badge>{label(u.role)}</Badge> },
        { label: 'Locations', render: u => u.locationIds.map(id => locations.find(l => l.id === id)?.code || id.slice(0, 6)).join(', ') || 'All' },
        { label: 'MFA', render: u => (u.mfaEnabled ? <Badge tone="ok">On</Badge> : u.mfaRequired ? <Badge tone="warn">Required</Badge> : <Badge>Off</Badge>) }, { label: 'Status', render: u => <StatusPill status={u.status} /> },
        { label: '', render: u => (u.id === user.id ? <span className="small faint">You</span> : can('users:manage') && (
          <div className="row">
            <Button size="sm" variant="ghost" onClick={() => setForm({ ...u })}>Edit</Button>
            {u.status === 'invited' ? <Button size="sm" variant="ghost" onClick={() => act(u, 'invite')}>Resend invite</Button> : <Button size="sm" variant="ghost" onClick={() => act(u, 'status')}>{u.status === 'disabled' ? 'Enable' : 'Disable'}</Button>}
            {u.mfaEnabled && <Button size="sm" variant="ghost" onClick={() => act(u, 'mfa')}>Reset MFA</Button>}
          </div>
        )) }
      ]} />}</Async>
      <Modal open={Boolean(form)} title={form?.id ? `Edit ${form.name}` : 'Invite staff member'} onClose={() => setForm(null)} footer={<Button variant="primary" loading={busy} disabled={!form?.name || (!form?.id && !form?.email)} onClick={save}>{form?.id ? 'Save' : 'Create invitation'}</Button>}>
        <div className="grid-2">
          <Field label="Name"><Input value={form?.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
          <Field label="Email"><Input type="email" value={form?.email || ''} disabled={Boolean(form?.id)} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></Field>
          <Field label="Role"><Select value={form?.role} options={roles} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} /></Field>
          <Field label="Specialty"><Input value={form?.specialty || ''} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} /></Field>
          {form?.role === 'technician' && <Field label="Labor cost rate (per hour)" hint="Used for profit-per-VIN"><MoneyInput cents={form?.laborCostRateCents} onChange={c => setForm(f => ({ ...f, laborCostRateCents: c }))} /></Field>}
        </div>
        <Field label="Locations">{locations.map(l => <label key={l.id} className="row small"><input type="checkbox" checked={form?.locationIds?.includes(l.id) || false} onChange={e => setForm(f => ({ ...f, locationIds: e.target.checked ? [...f.locationIds, l.id] : f.locationIds.filter(x => x !== l.id) }))} />{l.name}</label>)}</Field>
        {['manager', 'admin', 'accounting'].includes(form?.role) && <Alert tone="info">This role must enroll multi-factor authentication at first sign-in.</Alert>}
      </Modal>
    </Card>
  );
};

const LocationSettings = () => {
  const { can } = useAuth();
  const { location } = useWorkspace();
  const [run, busy] = useAction();
  const [f, setF] = useState(null);
  const current = f || (location && { taxRateBps: location.taxRateBps, laborRates: location.laborRates, laborTaxable: location.laborTaxable, partsTaxable: location.partsTaxable, timezone: location.timezone, hours: location.hours, bays: location.bays, appointmentSlotMinutes: location.appointmentSlotMinutes, partsMarkupMatrix: location.partsMarkupMatrix || [] });
  if (!current) return null;
  const set = (patch) => setF({ ...current, ...patch });
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  return (
    <Card title={`Location settings · ${location.name}`} actions={can('locations:manage') && <Button size="sm" variant="primary" loading={busy} disabled={!f} onClick={() => run(async () => { await api.patch(`/locations/${location.id}`, current, { ifMatch: location.version }); setF(null); window.location.reload(); }, 'Location updated')}>Save</Button>}>
      <div className="stack">
        <div className="grid-4">
          <Field label="Sales tax (%)" hint="Basis points stored exactly"><Input inputMode="decimal" value={(current.taxRateBps / 100).toString()} onChange={e => set({ taxRateBps: Math.round(Number(e.target.value || 0) * 100) })} /></Field>
          <Field label="Standard labor / hr"><MoneyInput cents={current.laborRates?.standardCents} onChange={c => set({ laborRates: { ...current.laborRates, standardCents: c || 0 } })} /></Field>
          <Field label="Diagnostic labor / hr"><MoneyInput cents={current.laborRates?.diagnosticCents} onChange={c => set({ laborRates: { ...current.laborRates, diagnosticCents: c || 0 } })} /></Field>
          <Field label="EV / hybrid labor / hr"><MoneyInput cents={current.laborRates?.evCents} onChange={c => set({ laborRates: { ...current.laborRates, evCents: c || 0 } })} /></Field>
          <Field label="Time zone"><Input value={current.timezone || ''} onChange={e => set({ timezone: e.target.value })} /></Field>
          <Field label="Appointment slot (min)"><Input inputMode="numeric" value={current.appointmentSlotMinutes || 30} onChange={e => set({ appointmentSlotMinutes: Number(e.target.value) || 30 })} /></Field>
          <label className="row small"><input type="checkbox" checked={Boolean(current.laborTaxable)} onChange={e => set({ laborTaxable: e.target.checked })} />Labor is taxable</label>
          <label className="row small"><input type="checkbox" checked={Boolean(current.partsTaxable)} onChange={e => set({ partsTaxable: e.target.checked })} />Parts are taxable</label>
        </div>
        <h4 className="small faint">Opening hours</h4>
        <div className="grid-4">{days.map(dk => (
          <div key={dk} className="row small"><strong style={{ width: 34 }}>{dk}</strong>
            <input type="checkbox" checked={!current.hours?.[dk]?.closed} onChange={e => set({ hours: { ...current.hours, [dk]: { ...current.hours[dk], closed: !e.target.checked } } })} aria-label={`${dk} open`} />
            <Input type="time" value={current.hours?.[dk]?.open || '08:00'} onChange={e => set({ hours: { ...current.hours, [dk]: { ...current.hours[dk], open: e.target.value } } })} disabled={current.hours?.[dk]?.closed} />
            <Input type="time" value={current.hours?.[dk]?.close || '17:00'} onChange={e => set({ hours: { ...current.hours, [dk]: { ...current.hours[dk], close: e.target.value } } })} disabled={current.hours?.[dk]?.closed} />
          </div>
        ))}</div>
        <h4 className="small faint">Bays</h4>
        <div className="stack-sm">{current.bays.map((b, i) => (
          <div key={b.id || i} className="row"><Input value={b.name} onChange={e => set({ bays: current.bays.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} /><Input value={b.type} style={{ width: 160 }} onChange={e => set({ bays: current.bays.map((x, j) => (j === i ? { ...x, type: e.target.value } : x)) })} /><label className="row small"><input type="checkbox" checked={b.active !== false} onChange={e => set({ bays: current.bays.map((x, j) => (j === i ? { ...x, active: e.target.checked } : x)) })} />Active</label></div>
        ))}<Button size="sm" onClick={() => set({ bays: [...current.bays, { name: `Bay ${current.bays.length + 1}`, type: 'general', active: true }] })}><Plus size={13} />Add bay</Button></div>
        <h4 className="small faint">Parts pricing matrix (markup by unit cost)</h4>
        <div className="stack-sm">{current.partsMarkupMatrix.map((t, i) => (
          <div key={i} className="row small">Up to <MoneyInput cents={t.maxCostCents} onChange={c => set({ partsMarkupMatrix: current.partsMarkupMatrix.map((x, j) => (j === i ? { ...x, maxCostCents: c } : x)) })} placeholder="no limit" /> markup % <Input inputMode="decimal" value={t.markupBps / 100} onChange={e => set({ partsMarkupMatrix: current.partsMarkupMatrix.map((x, j) => (j === i ? { ...x, markupBps: Math.round(Number(e.target.value || 0) * 100) } : x)) })} style={{ width: 90 }} /></div>
        ))}<Button size="sm" onClick={() => set({ partsMarkupMatrix: [...current.partsMarkupMatrix, { maxCostCents: null, markupBps: 5000 }] })}><Plus size={13} />Add tier</Button></div>
      </div>
    </Card>
  );
};

const Catalog = () => {
  const [run] = useAction();
  const [op, setOp] = useState(null);
  const [fee, setFee] = useState(null);
  const ops = useAsync(() => api.get('/labor-operations', { includeInactive: true }).then(r => r.laborOperations), []);
  const fees = useAsync(() => api.get('/fees', { includeInactive: true }).then(r => r.fees), []);
  return (
    <div className="grid-2">
      <Card title="Labor operations" actions={<Button size="sm" onClick={() => setOp({ code: '', name: '', category: 'General', defaultHours: 1, rateType: 'standard', active: true })}><Plus size={13} />New</Button>}>
        <Async state={ops}>{rows => <Table rows={rows} onRowClick={setOp} columns={[{ label: 'Code', render: o => <span className="mono">{o.code}</span> }, { label: 'Name', render: o => o.name }, { label: 'Hours', render: o => o.defaultHours }, { label: 'Rate', render: o => label(o.rateType) }, { label: '', render: o => (o.active ? null : <Badge>inactive</Badge>) }]} />}</Async>
      </Card>
      <Card title="Fees" actions={<Button size="sm" onClick={() => setFee({ code: '', name: '', kind: 'flat', amountCents: 0, rateBps: 0, taxable: false, active: true })}><Plus size={13} />New</Button>}>
        <Async state={fees}>{rows => <Table rows={rows} onRowClick={setFee} columns={[{ label: 'Code', render: x => <span className="mono">{x.code}</span> }, { label: 'Name', render: x => x.name }, { label: 'Amount', render: x => (x.kind === 'flat' ? money(x.amountCents) : `${x.rateBps / 100}% of ${x.kind === 'percent_of_labor' ? 'labor' : 'parts'}`) }]} />}</Async>
      </Card>
      <Modal open={Boolean(op)} title="Labor operation" onClose={() => setOp(null)} footer={<Button variant="primary" onClick={() => run(async () => { const { id, version, createdAt, updatedAt, createdBy, ...body } = op; if (id) await api.patch(`/labor-operations/${id}`, body); else await api.post('/labor-operations', body); setOp(null); ops.reload(); }, 'Saved')}>Save</Button>}>
        <div className="grid-2">
          <Field label="Code"><Input value={op?.code || ''} disabled={Boolean(op?.id)} onChange={e => setOp(o => ({ ...o, code: e.target.value }))} /></Field>
          <Field label="Name"><Input value={op?.name || ''} onChange={e => setOp(o => ({ ...o, name: e.target.value }))} /></Field>
          <Field label="Category"><Input value={op?.category || ''} onChange={e => setOp(o => ({ ...o, category: e.target.value }))} /></Field>
          <Field label="Default hours"><Input inputMode="decimal" value={op?.defaultHours ?? ''} onChange={e => setOp(o => ({ ...o, defaultHours: Number(e.target.value) || 0 }))} /></Field>
          <Field label="Rate type"><Select value={op?.rateType} options={['standard', 'diagnostic', 'ev']} onChange={e => setOp(o => ({ ...o, rateType: e.target.value }))} /></Field>
          <Field label="Hours source"><Select value={op?.hoursSource || 'shop_policy'} options={['shop_policy', 'licensed_labor_guide']} onChange={e => setOp(o => ({ ...o, hoursSource: e.target.value }))} /></Field>
        </div>
        <label className="row small"><input type="checkbox" checked={op?.active !== false} onChange={e => setOp(o => ({ ...o, active: e.target.checked }))} />Active</label>
      </Modal>
      <Modal open={Boolean(fee)} title="Fee" onClose={() => setFee(null)} footer={<Button variant="primary" onClick={() => run(async () => { const { id, version, createdAt, updatedAt, createdBy, ...body } = fee; if (id) await api.patch(`/fees/${id}`, body); else await api.post('/fees', body); setFee(null); fees.reload(); }, 'Saved')}>Save</Button>}>
        <div className="grid-2">
          <Field label="Code"><Input value={fee?.code || ''} disabled={Boolean(fee?.id)} onChange={e => setFee(o => ({ ...o, code: e.target.value }))} /></Field>
          <Field label="Name"><Input value={fee?.name || ''} onChange={e => setFee(o => ({ ...o, name: e.target.value }))} /></Field>
          <Field label="Kind"><Select value={fee?.kind} options={['flat', 'percent_of_labor', 'percent_of_parts']} onChange={e => setFee(o => ({ ...o, kind: e.target.value }))} /></Field>
          {fee?.kind === 'flat' ? <Field label="Amount"><MoneyInput cents={fee?.amountCents} onChange={c => setFee(o => ({ ...o, amountCents: c || 0 }))} /></Field>
            : <Field label="Percent"><Input inputMode="decimal" value={(fee?.rateBps || 0) / 100} onChange={e => setFee(o => ({ ...o, rateBps: Math.round(Number(e.target.value || 0) * 100) }))} /></Field>}
          {fee?.kind !== 'flat' && <Field label="Maximum"><MoneyInput cents={fee?.maxCents} onChange={c => setFee(o => ({ ...o, maxCents: c }))} /></Field>}
        </div>
        <label className="row small"><input type="checkbox" checked={Boolean(fee?.taxable)} onChange={e => setFee(o => ({ ...o, taxable: e.target.checked }))} />Taxable</label>
        <label className="row small"><input type="checkbox" checked={fee?.active !== false} onChange={e => setFee(o => ({ ...o, active: e.target.checked }))} />Active</label>
      </Modal>
    </div>
  );
};

const JsonForm = ({ title, initial, onSave, onClose }) => {
  const [text, setText] = useState(JSON.stringify(initial, null, 2));
  const [err, setErr] = useState(null);
  const [run, busy] = useAction();
  return (
    <Modal open title={title} size="lg" onClose={onClose} footer={<Button variant="primary" loading={busy} onClick={() => { try { const v = JSON.parse(text); setErr(null); run(async () => { await onSave(v); onClose(); }, 'Published'); } catch (e) { setErr(e.message); } }}>Publish version</Button>}>
      {err && <Alert tone="danger">{err}</Alert>}
      <Textarea style={{ minHeight: 380, fontFamily: 'var(--ft-font-mono)', fontSize: 12 }} value={text} onChange={e => setText(e.target.value)} />
    </Modal>
  );
};

const Plans = () => {
  const [edit, setEdit] = useState(null);
  const plans = useAsync(() => api.get('/membership-plans', { includeRetired: true }).then(r => r.plans), []);
  const riders = useAsync(() => api.get('/service-riders', { includeRetired: true }).then(r => r.riders), []);
  const planTemplate = { code: 'GOLD', name: '', tier: '', currency: 'USD', priceMonthlyCents: 0, priceAnnualCents: 0, termMonths: 12, benefitsText: [], entitlements: [{ key: 'labor_discount', kind: 'labor_discount_bps', valueBps: 1000, period: 'unlimited', description: '10% off labor' }, { key: 'free_diag', kind: 'free_diagnostic', period: 'per_term', quantityPerPeriod: 2, description: 'Two diagnostic visits per term' }], ridersAllowed: [] };
  const riderTemplate = { code: 'TIRE', name: '', currency: 'USD', priceMonthlyCents: 0, coverageText: '', entitlements: [] };
  return (
    <div className="stack">
      <Alert tone="info">Plans and riders are immutable versions. Editing publishes a new version; existing members keep the version they enrolled in, so every evaluation stays reproducible. Amounts are in cents; discounts in basis points (1000 = 10%).</Alert>
      <Card title="Membership plans" actions={<Button size="sm" variant="primary" onClick={() => setEdit({ kind: 'plan', value: planTemplate })}><Plus size={13} />New plan</Button>}>
        <Async state={plans}>{rows => <Table rows={rows} columns={[{ label: 'Plan', render: p => `${p.name} (${p.code})` }, { label: 'Version', render: p => `v${p.version}` }, { label: 'Price', render: p => `${money(p.priceAnnualCents)}/yr · ${money(p.priceMonthlyCents)}/mo` }, { label: 'Benefits', render: p => p.entitlements.length }, { label: 'Status', render: p => <StatusPill status={p.status} /> }, { label: '', render: p => <Button size="sm" variant="ghost" onClick={() => { const { id, version, status, createdAt, updatedAt, createdBy, effectiveFrom, ...rest } = p; setEdit({ kind: 'plan', value: rest }); }}>New version</Button> }]} />}</Async>
      </Card>
      <Card title="Service riders" actions={<Button size="sm" onClick={() => setEdit({ kind: 'rider', value: riderTemplate })}><Plus size={13} />New rider</Button>}>
        <Async state={riders}>{rows => <Table rows={rows} columns={[{ label: 'Rider', render: r => `${r.name} (${r.code})` }, { label: 'Version', render: r => `v${r.version}` }, { label: 'Price', render: r => `${money(r.priceMonthlyCents)}/mo` }, { label: 'Id', render: r => <span className="mono small">{r.riderId}</span> }, { label: 'Status', render: r => <StatusPill status={r.status} /> }]} />}</Async>
      </Card>
      {edit && <JsonForm title={edit.kind === 'plan' ? 'Publish plan version' : 'Publish rider version'} initial={edit.value} onClose={() => setEdit(null)} onSave={async (v) => { await api.post(edit.kind === 'plan' ? '/membership-plans' : '/service-riders', v); plans.reload(); riders.reload(); }} />}
    </div>
  );
};

const Templates = () => {
  const [edit, setEdit] = useState(null);
  const s = useAsync(() => api.get('/inspection-templates').then(r => r.templates), []);
  return (
    <Card title="Inspection templates" actions={<Button size="sm" onClick={() => setEdit({ name: 'New template', sections: [{ name: 'Section', items: [{ name: 'Item', measurementHints: [] }] }] })}><Plus size={13} />New</Button>}>
      <Async state={s}>{rows => <Table rows={rows} columns={[{ label: 'Name', render: t => t.name }, { label: 'Version', render: t => `v${t.version}` }, { label: 'Items', render: t => t.sections.reduce((n, x) => n + x.items.length, 0) }, { label: '', render: t => <Button size="sm" variant="ghost" onClick={() => setEdit({ templateId: t.id, name: t.name, sections: t.sections })}>New version</Button> }]} />}</Async>
      {edit && <JsonForm title="Publish inspection template" initial={edit} onClose={() => setEdit(null)} onSave={async (v) => { await api.post('/inspection-templates', v); s.reload(); }} />}
    </Card>
  );
};

const Corporate = () => {
  const [edit, setEdit] = useState(null);
  const s = useAsync(() => api.get('/corporate-settings').then(r => r.settings), []);
  return (
    <Async state={s}>{st => (
      <Card title="Corporate settings" actions={<Button size="sm" onClick={() => setEdit({ companyName: st.companyName, estimateValidityDays: st.estimateValidityDays, comebackWindowDays: st.comebackWindowDays, confirmedFixRequiresApproval: st.confirmedFixRequiresApproval, maintenanceIntervals: st.maintenanceIntervals })}>Edit</Button>}>
        <div className="grid-3 small">
          <div className="ft-kv"><span>Company</span><strong>{st.companyName}</strong></div>
          <div className="ft-kv"><span>Comeback window</span><strong>{st.comebackWindowDays} days</strong></div>
          <div className="ft-kv"><span>Fix review required</span><strong>{st.confirmedFixRequiresApproval ? 'Yes' : 'No'}</strong></div>
        </div>
        <h4 className="small faint" style={{ margin: '12px 0 6px' }}>Maintenance intervals (shop policy, used by predictive rules)</h4>
        <Table rows={st.maintenanceIntervals} rowKey="key" empty="None defined" columns={[{ label: 'Key', render: i => <span className="mono">{i.key}</span> }, { label: 'Name', render: i => i.name }, { label: 'Labor op', render: i => i.laborOpCode || '—' }, { label: 'Every', render: i => [i.intervalMiles && `${i.intervalMiles} mi`, i.intervalMonths && `${i.intervalMonths} mo`].filter(Boolean).join(' / ') }]} />
        {edit && <JsonForm title="Corporate settings" initial={edit} onClose={() => setEdit(null)} onSave={async (v) => { await api.patch('/corporate-settings', v); s.reload(); }} />}
      </Card>
    )}</Async>
  );
};

const Audit = () => {
  const [f, setF] = useState({ category: '' });
  const s = useAsync(() => api.get('/audit', { limit: 200, category: f.category || undefined }).then(r => r.auditLogs), [f.category]);
  return (
    <Card title="Audit history (append-only)" actions={<Select value={f.category} placeholder="All categories" options={['security', 'financial', 'permission', 'safety', 'approval', 'override', 'inventory', 'data', 'operational']} onChange={e => setF({ category: e.target.value })} style={{ width: 200 }} />}>
      <Async state={s}>{rows => <Table rows={rows} columns={[
        { label: 'When', render: a => dt(a.timestamp) }, { label: 'Category', render: a => <Badge>{a.category}</Badge> }, { label: 'Event', render: a => <span className="mono small">{a.eventType}</span> },
        { label: 'Action', render: a => <div>{a.action}{a.reason && <div className="small faint">Reason: {a.reason}</div>}</div> }, { label: 'By', render: a => `${a.actorName || a.actorId} (${a.actorRole})` }
      ]} />}</Async>
    </Card>
  );
};

const Integrations = () => {
  const { can } = useAuth();
  const [run] = useAction();
  const s = useAsync(() => api.get('/integrations').then(r => r.integrations), []);
  const jobs = useAsync(() => (can('corporate:manage') ? api.get('/jobs').then(r => r.jobs) : Promise.resolve([])), []);
  const row = (name, ok, detail) => ({ id: name, name, ok, detail });
  return (
    <div className="stack">
      <Async state={s}>{i => <Table rows={[
        row('Evidence storage', true, `${i.storage.driver} · max ${Math.round(i.storage.maxUploadBytes / 1048576)} MB`),
        row('In-store payments', true, 'Cash, check, card terminal, ACH, fleet'),
        row('Online card payments (Stripe)', i.payments.stripe.configured, i.payments.stripe.configured ? `webhook ${i.payments.stripe.webhookConfigured ? 'configured' : 'missing'}` : 'Not configured'),
        row('SMS (Twilio)', i.notifications.sms.configured, i.notifications.sms.configured ? 'Configured' : 'Not configured — SMS messages are not sent'),
        row('Email (SendGrid)', i.notifications.email.configured, i.notifications.email.configured ? 'Configured' : 'Not configured — invitations show a one-time link instead'),
        row('AutoMind gateway', i.automind.configured, i.automind.mode),
        row('Licensed technical data', i.technicalData.configured, i.technicalData.mode),
        row('VIN decode & recalls (NHTSA)', true, 'Public NHTSA APIs'),
        row('AI assistance', i.ai.enabled, i.ai.note)
      ]} columns={[{ label: 'Integration', render: r => r.name }, { label: 'Status', render: r => <StatusPill status={r.ok ? 'active' : 'disabled'} /> }, { label: 'Detail', render: r => <span className="small">{r.detail}</span> }]} />}</Async>
      {can('corporate:manage') && <Card title="Background jobs" actions={<Button size="sm" onClick={() => run(async () => { await api.post('/jobs/run'); jobs.reload(); }, 'Processed due jobs')}>Run due jobs now</Button>}>
        <Async state={jobs}>{rows => <Table rows={rows} rowKey="type" columns={[{ label: 'Type', render: j => j.type }, { label: 'Status', render: j => <StatusPill status={j.status} /> }, { label: 'Count', right: true, render: j => j.count }]} />}</Async>
      </Card>}
    </div>
  );
};

export const Admin = () => {
  const { can } = useAuth();
  const tabs = [can('users:manage') && 'users', can('locations:manage') && 'location', can('catalog:manage') && 'catalog', can('memberships:plans') && 'plans', can('catalog:manage') && 'templates', can('corporate:manage') && 'corporate', can('audit:read') && 'audit', 'integrations'].filter(Boolean);
  const [tab, setTab] = useState(tabs[0]);
  return (
    <>
      <PageHeader title="Administration" />
      <Tabs tabs={tabs} active={tab} onChange={setTab} />
      {tab === 'users' && <Users />}
      {tab === 'location' && <LocationSettings />}
      {tab === 'catalog' && <Catalog />}
      {tab === 'plans' && <Plans />}
      {tab === 'templates' && <Templates />}
      {tab === 'corporate' && <Corporate />}
      {tab === 'audit' && <Audit />}
      {tab === 'integrations' && <Integrations />}
    </>
  );
};
