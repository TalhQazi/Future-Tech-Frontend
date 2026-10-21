import React, { useEffect, useState } from 'react';
import { api, newIdempotencyKey } from '../../api/client.js';
import { navigate } from '../../router.js';
import { useAuth, MfaEnroll } from '../auth.jsx';
import { useWorkspace } from '../Shell.jsx';
import { useOfflineQueue, retry, discard } from '../offline.js';
import { Card, PageHeader, Button, Field, Input, Select, Table, StatusPill, Badge, Modal, Alert, Async, Stat, Tabs, Empty, useAsync, useAction, useConfirm, money, dt, d, label } from '../ui.jsx';
import { SearchPicker } from '../shared.jsx';
import { MessageThread, Composer } from './ro/RoMessages.jsx';

// ---------------------------------------------------------------------------
export const Memberships = ({ query }) => {
  const { can } = useAuth();
  const confirm = useConfirm();
  const [run, busy] = useAction();
  const [enroll, setEnroll] = useState(null);
  const plans = useAsync(() => api.get('/membership-plans').then(r => r.plans), []);
  const riders = useAsync(() => api.get('/service-riders').then(r => r.riders), []);
  const list = useAsync(() => api.get('/memberships').then(r => r.memberships), []);
  useEffect(() => { if (query?.customerId) api.get(`/customers/${query.customerId}`).then(r => setEnroll({ customer: r.customer, billingCycle: 'annual', riderIds: [], key: newIdempotencyKey() })); }, [query?.customerId]);
  const plan = plans.data?.find(p => p.planId === enroll?.planId);
  const submit = () => run(async () => {
    const res = await api.post('/memberships', { customerId: enroll.customer.id, planId: enroll.planId, billingCycle: enroll.billingCycle, riderIds: enroll.riderIds }, { idempotencyKey: enroll.key });
    setEnroll(null);
    list.reload();
    if (res.invoice) navigate(`#/app/accounting/${res.invoice.id}`);
  }, 'Membership created');
  return (
    <>
      <PageHeader title="Memberships" actions={can('memberships:sell') && <Button variant="primary" onClick={() => setEnroll({ billingCycle: 'annual', riderIds: [], key: newIdempotencyKey() })}>Enroll customer</Button>} />
      <Async state={plans}>{ps => (ps.length === 0 ? <Alert tone="info">No membership plans are published yet. A corporate administrator creates plans under Administration.</Alert> : (
        <div className="grid-3">{ps.map(p => (
          <Card key={p.id} title={`${p.name}`} actions={<Badge>v{p.version}</Badge>}>
            <div className="row"><strong style={{ fontSize: 20 }}>{money(p.priceAnnualCents, p.currency)}</strong><span className="muted">/ year · {money(p.priceMonthlyCents, p.currency)} / month</span></div>
            <ul className="small" style={{ paddingLeft: 16, margin: '8px 0' }}>{p.benefitsText.map((b, i) => <li key={i}>{b}</li>)}</ul>
            <div className="small faint">{p.entitlements.map(e => e.description || `${label(e.kind)}${e.valueBps ? ` ${e.valueBps / 100}%` : ''}`).join(' · ')}</div>
          </Card>
        ))}</div>
      ))}</Async>
      <Card title="Members">
        <Async state={list}>{rows => <Table rows={rows} empty="No memberships yet" columns={[
          { label: 'Number', render: m => <span className="mono">{m.number}</span> }, { label: 'Customer', render: m => <a href={`#/app/customers/${m.customerId}`}>{m.customerName}</a> },
          { label: 'Plan', render: m => (m.plan ? `${m.plan.name} v${m.plan.version}` : '—') }, { label: 'Status', render: m => <StatusPill status={m.status} /> },
          { label: 'Period', render: m => `${d(m.currentPeriodStart)} – ${d(m.currentPeriodEnd)}` },
          { label: '', render: m => (['active', 'pending_payment', 'past_due'].includes(m.status) && can('memberships:sell') ? <Button size="sm" variant="ghost" onClick={async () => { const c = await confirm({ title: `Cancel ${m.number}`, reason: true, tone: 'danger' }); if (c) run(async () => { await api.post(`/memberships/${m.id}/cancel`, { reason: c.reason }); list.reload(); }); }}>Cancel</Button> : null) }
        ]} />}</Async>
      </Card>
      <Modal open={Boolean(enroll)} title="Enroll customer" onClose={() => setEnroll(null)} footer={<Button variant="primary" loading={busy} disabled={!enroll?.customer || !enroll?.planId} onClick={submit}>Create membership</Button>}>
        {enroll?.customer ? <strong>{enroll.customer.name}</strong> : <SearchPicker label="Customer" path="/customers" listKey="customers" renderItem={c => <span>{c.name} · {c.phone}</span>} onPick={c => setEnroll(e => ({ ...e, customer: c }))} />}
        <Field label="Plan"><Select value={enroll?.planId || ''} placeholder="Choose plan" options={(plans.data || []).map(p => ({ value: p.planId, label: `${p.name} v${p.version}` }))} onChange={e => setEnroll(x => ({ ...x, planId: e.target.value, riderIds: [] }))} /></Field>
        <Field label="Billing"><Select value={enroll?.billingCycle} options={['annual', 'monthly']} onChange={e => setEnroll(x => ({ ...x, billingCycle: e.target.value }))} /></Field>
        {plan && (riders.data || []).filter(r => plan.ridersAllowed.includes(r.riderId)).map(r => (
          <label key={r.riderId} className="row small"><input type="checkbox" checked={enroll.riderIds.includes(r.riderId)} onChange={e => setEnroll(x => ({ ...x, riderIds: e.target.checked ? [...x.riderIds, r.riderId] : x.riderIds.filter(i => i !== r.riderId) }))} />{r.name} (+{money(r.priceMonthlyCents)}/mo)</label>
        ))}
        {plan && <Alert tone="info">The membership activates when its invoice is paid. Benefits apply from the published plan version {plan.version}.</Alert>}
      </Modal>
    </>
  );
};

// ---------------------------------------------------------------------------
export const Messages = ({ id }) => {
  const { can } = useAuth();
  const { locationId } = useWorkspace();
  const list = useAsync(() => api.get('/conversations', { locationId }).then(r => r.conversations), [locationId]);
  const thread = useAsync(() => (id ? api.get(`/conversations/${id}`) : Promise.resolve(null)), [id]);
  return (
    <>
      <PageHeader title="Messages" />
      <div className="grid-2" style={{ gridTemplateColumns: 'minmax(260px, 1fr) 2fr' }}>
        <Card title="Conversations">
          <Async state={list}>{rows => (rows.length ? rows.map(c => (
            <a key={c.id} href={`#/app/messages/${c.id}`} className="ft-ro-card" style={{ marginBottom: 6, borderColor: c.id === id ? 'var(--primary)' : undefined, textDecoration: 'none' }}>
              <div className="row between"><strong>{c.customerName}</strong>{c.unreadForStaff > 0 && <Badge tone="danger">{c.unreadForStaff}</Badge>}</div>
              <span className="small muted truncate">{c.roNumber ? `${c.roNumber} · ` : ''}{c.lastMessagePreview}</span>
              <span className="small faint">{dt(c.lastMessageAt)}</span>
            </a>
          )) : <Empty title="No conversations" />)}</Async>
        </Card>
        <Card title="Thread">
          {!id ? <Empty title="Select a conversation" /> : <Async state={thread}>{t => (
            <div className="stack">
              <MessageThread messages={t.messages} />
              <Composer channels={can('messages:send') ? ['portal', 'sms', 'email', 'internal_note'] : ['internal_note']} onSend={async ({ body, channel }) => { await api.post('/messages', { customerId: t.conversation.customerId, roId: t.conversation.roId || undefined, body, channel }); thread.reload(); list.reload(); }} />
            </div>
          )}</Async>}
        </Card>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
export const Analytics = () => {
  const { can } = useAuth();
  const { locationId } = useWorkspace();
  const [scope, setScope] = useState('location');
  const [range, setRange] = useState({ from: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10), to: new Date(Date.now() + 86400000).toISOString().slice(0, 10) });
  const q = { ...range, locationId: scope === 'location' ? locationId : undefined };
  const dash = useAsync(() => api.get('/analytics/dashboard', q), [scope, locationId, range.from, range.to]);
  const locs = useAsync(() => (scope === 'corporate' ? api.get('/analytics/locations', q).then(r => r.locations) : Promise.resolve([])), [scope, range.from, range.to]);
  const pvin = useAsync(() => api.get('/analytics/profit-per-vin', q).then(r => r.vehicles), [scope, locationId, range.from, range.to]);
  return (
    <>
      <PageHeader title="Analytics" subtitle="Derived from posted invoices, payments, time and inventory records" actions={<>
        <Input type="date" value={range.from} onChange={e => setRange(r => ({ ...r, from: e.target.value }))} style={{ width: 160 }} />
        <Input type="date" value={range.to} onChange={e => setRange(r => ({ ...r, to: e.target.value }))} style={{ width: 160 }} />
        {can('analytics:corporate') && <Select value={scope} options={['location', 'corporate']} onChange={e => setScope(e.target.value)} style={{ width: 'auto' }} />}
      </>} />
      <Async state={dash}>{data => (
        <div className="grid-4">
          <Stat label="Revenue (ex tax)" value={money(data.kpis.revenueCents)} hint={`${data.kpis.invoicesPosted} invoices`} />
          <Stat label="Collected" value={money(data.kpis.collectedCents)} hint="Payments minus refunds" />
          <Stat label="Average repair order" value={money(data.kpis.averageRepairOrderCents)} />
          <Stat label="Car count" value={data.kpis.carCount} />
          <Stat label="Parts gross margin" value={data.kpis.partsGrossMarginPct != null ? `${data.kpis.partsGrossMarginPct}%` : '—'} />
          <Stat label="Labor efficiency" value={data.kpis.laborEfficiencyPct != null ? `${data.kpis.laborEfficiencyPct}%` : '—'} hint={`${data.kpis.laborHoursSold} sold / ${data.kpis.laborHoursClocked} clocked`} />
          <Stat label="Approval rate (value)" value={data.kpis.approvalRateByValuePct != null ? `${data.kpis.approvalRateByValuePct}%` : '—'} />
          <Stat label="Comebacks" value={data.kpis.comebacks} />
        </div>
      )}</Async>
      {scope === 'corporate' && <Card title="Locations"><Async state={locs}>{rows => <Table rows={rows} rowKey="location" columns={[
        { label: 'Location', render: r => r.location.name }, { label: 'Revenue', right: true, render: r => money(r.revenueCents) }, { label: 'ARO', right: true, render: r => money(r.averageRepairOrderCents) },
        { label: 'Car count', right: true, render: r => r.carCount }, { label: 'Efficiency', right: true, render: r => (r.laborEfficiencyPct != null ? `${r.laborEfficiencyPct}%` : '—') }, { label: 'Open ROs', right: true, render: r => r.openRepairOrders }
      ]} />}</Async></Card>}
      <Card title="Profit per VIN">
        <Async state={pvin}>{rows => <Table rows={rows} rowKey="vehicleId" empty="No posted invoices in this period" onRowClick={r => navigate(`#/app/vehicles/${r.vehicleId}`)} columns={[
          { label: 'Vehicle', render: r => <div>{r.vehicle}<div className="mono small faint">{r.vin}</div></div> }, { label: 'Visits', right: true, render: r => r.visits },
          { label: 'Revenue', right: true, render: r => money(r.revenueCents) }, { label: 'Parts cost', right: true, render: r => money(r.partsCostCents) }, { label: 'Labor cost', right: true, render: r => money(r.laborCostCents) },
          { label: 'Gross profit', right: true, render: r => <strong>{money(r.grossProfitCents)}</strong> }, { label: 'Margin', right: true, render: r => (r.marginPct != null ? `${r.marginPct}%` : '—') },
          { label: '', render: r => (r.note ? <span className="small faint" title={r.note}>labor cost incomplete</span> : null) }
        ]} />}</Async>
      </Card>
    </>
  );
};

// ---------------------------------------------------------------------------
export const Account = () => {
  const { user, reloadMe, logout } = useAuth();
  const confirm = useConfirm();
  const [run, busy] = useAction();
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [enrolling, setEnrolling] = useState(false);
  const offline = useOfflineQueue();
  return (
    <>
      <PageHeader title="My account" subtitle={`${user.name} · ${user.email} · ${label(user.role)}`} />
      {user.mustChangePassword && <Alert tone="warn">Please choose a new password.</Alert>}
      <div className="grid-2">
        <Card title="Multi-factor authentication">
          {user.mfaEnabled ? <Alert tone="ok">Authenticator app enabled.{user.mfaRequired ? ' Required for your role.' : ''}</Alert>
            : enrolling ? <MfaEnroll onDone={() => { setEnrolling(false); reloadMe(); }} /> : <Button variant="primary" onClick={() => setEnrolling(true)}>Set up authenticator app</Button>}
        </Card>
        <Card title="Change password">
          <div className="stack">
            <Field label="Current password"><Input type="password" value={pw.currentPassword} onChange={e => setPw(p => ({ ...p, currentPassword: e.target.value }))} autoComplete="current-password" /></Field>
            <Field label="New password" hint="At least 10 characters with letters and numbers"><Input type="password" value={pw.newPassword} onChange={e => setPw(p => ({ ...p, newPassword: e.target.value }))} autoComplete="new-password" /></Field>
            <Button variant="primary" loading={busy} disabled={!pw.currentPassword || !pw.newPassword} onClick={() => run(async () => { await api.post('/auth/password/change', pw); setPw({ currentPassword: '', newPassword: '' }); reloadMe(); }, 'Password changed; other sessions signed out')}>Update password</Button>
          </div>
        </Card>
        <Card title="Sessions">
          <Button variant="danger" onClick={async () => { const c = await confirm({ title: 'Sign out everywhere?', message: 'All devices, including this one, will need to sign in again.', tone: 'danger' }); if (c) { await api.post('/auth/logout-all'); logout(); } }}>Sign out of all devices</Button>
        </Card>
        <Card title="Offline changes">
          {offline.items.length === 0 ? <p className="muted">Everything is synced.</p> : (
            <Table rows={offline.items} rowKey="key" columns={[
              { label: 'Change', render: i => i.label }, { label: 'Status', render: i => <StatusPill status={i.status === 'failed' ? 'failed' : 'queued'} /> },
              { label: 'Error', render: i => i.error || '—' },
              { label: '', render: i => <div className="row"><Button size="sm" onClick={() => retry(i.key)}>Retry</Button><Button size="sm" variant="ghost" onClick={() => discard(i.key)}>Discard</Button></div> }
            ]} />
          )}
        </Card>
      </div>
    </>
  );
};
