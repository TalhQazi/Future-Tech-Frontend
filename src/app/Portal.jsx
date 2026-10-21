import React, { useState } from 'react';
import { Car, ClipboardList, Receipt, Calendar, MessageSquare, Heart, Fuel, LogOut, Plus } from 'lucide-react';
import { api, newIdempotencyKey } from '../api/client.js';
import { navigate } from '../router.js';
import { useAuth } from './auth.jsx';
import { Card, PageHeader, Button, Field, Input, Select, Table, StatusPill, Badge, Modal, Alert, Async, Empty, useAsync, useAction, useConfirm, money, dt, d, vehicleName, label } from './ui.jsx';
import { EvidenceThumb } from './shared.jsx';
import { OnlinePayment } from './payments.jsx';
import { MessageThread, Composer } from './pages/ro/RoMessages.jsx';
import { NewVehicleForm } from './pages/CheckIn.jsx';

const NAV = [['', 'My garage', Car], ['visits', 'Service visits', ClipboardList], ['invoices', 'Invoices', Receipt], ['appointments', 'Appointments', Calendar], ['messages', 'Messages', MessageSquare], ['membership', 'Membership', Heart], ['fuel', 'Fuel log', Fuel]];

const Garage = ({ summary, reload }) => {
  const { user } = useAuth();
  const [adding, setAdding] = useState(false);
  return (
    <>
      <PageHeader title="My garage" actions={<Button onClick={() => setAdding(true)}><Plus size={14} />Add vehicle</Button>} />
      {summary.pendingEstimates.length > 0 && <Alert tone="warn">You have {summary.pendingEstimates.length} estimate(s) waiting for your approval. {summary.pendingEstimates.map(e => <Button key={e.roId} size="sm" variant="primary" onClick={() => navigate(`#/portal/ro/${e.roId}`)}>Review {e.estimateNumber}</Button>)}</Alert>}
      <div className="grid-3">
        {summary.vehicles.map(v => {
          const open = summary.repairOrders.find(r => r.vehicleId === v.id && !['closed', 'cancelled'].includes(r.status));
          const recs = summary.recommendations.filter(r => r.vehicleId === v.id);
          return (
            <Card key={v.id} title={vehicleName(v)} actions={v.licensePlate && <Badge>{v.licensePlate}</Badge>}>
              <div className="small muted mono">{v.vin || 'VIN not recorded'}</div>
              <div className="small">{v.mileage?.toLocaleString()} {v.mileageUnit}</div>
              {open && <div className="row" style={{ marginTop: 8 }}><StatusPill status={open.status} /><a href={`#/portal/ro/${open.id}`}>View {open.roNumber}</a></div>}
              {recs.map(r => <div key={r.id} className="small" style={{ marginTop: 6 }}><Badge tone="info">Recommended</Badge> {r.title}<div className="faint">{r.reason}</div></div>)}
            </Card>
          );
        })}
        {summary.vehicles.length === 0 && <Empty title="No vehicles yet" hint="Add your vehicle or ask the service desk to link it." />}
      </div>
      <Modal open={adding} title="Add vehicle" size="lg" onClose={() => setAdding(false)}><NewVehicleForm customerId={user.customerId} onCreated={() => { setAdding(false); reload(); }} /></Modal>
    </>
  );
};

const RoView = ({ id }) => {
  const confirm = useConfirm();
  const [run, busy] = useAction();
  const ro = useAsync(() => api.get(`/repair-orders/${id}`).then(r => r.repairOrder), [id]);
  const est = useAsync(() => api.get(`/repair-orders/${id}/estimate`), [id]);
  const insp = useAsync(() => api.get(`/repair-orders/${id}/inspection`).catch(() => null), [id]);
  const [decisions, setDecisions] = useState({});
  const [reasons, setReasons] = useState({});
  const [key] = useState(newIdempotencyKey);
  return (
    <Async state={ro}>{r => (
      <>
        <a href="#/portal/visits" className="small">← Service visits</a>
        <PageHeader title={`${vehicleName(r.vehicle)} · ${r.roNumber}`} actions={<StatusPill status={r.status} />} />
        {r.safetyEscalations?.length > 0 && <Alert tone="danger">Safety notice: {r.safetyEscalations.map(s => s.description).join('; ')}</Alert>}
        <div className="grid-2">
          <Card title="Progress"><div className="ft-timeline">{r.timeline.slice().reverse().map((t, i) => <div key={i}><div>{t.summary}</div><div className="small faint">{dt(t.at)}</div></div>)}</div></Card>
          <Card title="Your concerns">{r.concerns.map(c => <div key={c.id} className="small" style={{ marginBottom: 8 }}><strong>{c.text}</strong>{c.cause && <div>Cause: {c.cause}</div>}{c.correction && <div>Correction: {c.correction}</div>}</div>)}</Card>
        </div>
        <Async state={insp}>{i => (i?.findings?.length ? (
          <Card title="Inspection results">
            <div className="stack">{i.findings.map(f => (
              <div key={f.id} className="row wrap"><StatusPill status={f.condition} /><strong>{f.name}</strong><span className="small muted">{f.notes}</span>{i.evidence.filter(e => e.findingId === f.id).map(e => <EvidenceThumb key={e.id} evidence={e} />)}</div>
            ))}</div>
          </Card>
        ) : null)}</Async>
        <Async state={est}>{e => {
          const v = e.currentVersion;
          if (!v) return <Card title="Estimate"><p className="muted">Your service advisor has not sent an estimate yet.</p></Card>;
          const pending = v.lines.filter(l => e.authorization[l.id]?.status === 'pending');
          const submit = async () => {
            const approved = Object.entries(decisions).filter(([, x]) => x === 'approved').map(([lineId]) => v.lines.find(l => l.id === lineId));
            const total = approved.reduce((s, l) => s + l.totalCents, 0);
            const c = await confirm({ title: 'Authorize repairs', message: `You are authorizing ${approved.length} item(s) totaling ${money(total, v.currency)} on estimate version ${v.versionNumber}. Declined items will not be performed.`, confirmLabel: 'Authorize' });
            if (!c) return;
            run(async () => {
              await api.post(`/repair-orders/${id}/estimate/approvals`, { versionId: v.id, decisions: Object.entries(decisions).map(([lineId, decision]) => ({ lineId, decision, declineReason: reasons[lineId] })) }, { idempotencyKey: key });
              est.reload();
              ro.reload();
            }, 'Thank you — your decision was sent to the shop');
          };
          return (
            <Card title={`Estimate ${e.estimate.estimateNumber} · version ${v.versionNumber}`}>
              <Table rows={v.lines} columns={[
                { label: 'Item', render: l => <div><strong>{l.description}</strong>{l.safetyCritical && <> <Badge tone="danger">Safety</Badge></>}{l.recommendationReason && <div className="small faint">{l.recommendationReason}</div>}</div> },
                { label: 'Price', right: true, render: l => <div>{money(l.totalCents, v.currency)}{l.discountCents > 0 && <div className="small" style={{ color: 'var(--ok)' }}>member savings {money(l.discountCents)}</div>}</div> },
                { label: 'Your decision', render: l => (e.authorization[l.id]?.status !== 'pending' ? <StatusPill status={e.authorization[l.id].status} /> : (
                  <div className="stack-sm">
                    <div className="row"><Button size="sm" variant={decisions[l.id] === 'approved' ? 'primary' : ''} onClick={() => setDecisions(x => ({ ...x, [l.id]: 'approved' }))}>Approve</Button><Button size="sm" variant={decisions[l.id] === 'declined' ? 'danger' : ''} onClick={() => setDecisions(x => ({ ...x, [l.id]: 'declined' }))}>Decline</Button></div>
                    {decisions[l.id] === 'declined' && l.safetyCritical && <Input placeholder="Please tell us why (required for safety items)" value={reasons[l.id] || ''} onChange={ev => setReasons(x => ({ ...x, [l.id]: ev.target.value }))} />}
                  </div>
                )) }
              ]} />
              <div className="row between" style={{ marginTop: 12 }}>
                <span>Estimate total {money(v.totals.totalCents, v.currency)} (tax {money(v.totals.taxCents)})</span>
                {pending.length > 0 && e.canApprove && <Button variant="primary" loading={busy} disabled={!Object.keys(decisions).length || v.lines.some(l => decisions[l.id] === 'declined' && l.safetyCritical && !reasons[l.id])} onClick={submit}>Submit decision</Button>}
              </div>
            </Card>
          );
        }}</Async>
        {r.invoice && <Card title="Invoice"><div className="row between"><span>{r.invoice.number} · <StatusPill status={r.invoice.paymentStatus} /></span><Button size="sm" onClick={() => navigate('#/portal/invoices')}>View & pay</Button></div></Card>}
      </>
    )}</Async>
  );
};

const Visits = () => {
  const s = useAsync(() => api.get('/repair-orders', { limit: 50 }).then(r => r.repairOrders), []);
  return <><PageHeader title="Service visits" /><Async state={s}>{rows => <Table rows={rows} empty="No visits yet" onRowClick={r => navigate(`#/portal/ro/${r.id}`)} columns={[{ label: 'Visit', render: r => r.roNumber }, { label: 'Vehicle', render: r => vehicleName(r.vehicle) }, { label: 'Status', render: r => <StatusPill status={r.status} /> }, { label: 'Date', render: r => d(r.createdAt) }]} />}</Async></>;
};

const Invoices = () => {
  const [open, setOpen] = useState(null);
  const s = useAsync(() => api.get('/invoices', { limit: 50 }).then(r => r.invoices), []);
  const inv = useAsync(() => (open ? api.get(`/invoices/${open}`).then(r => r.invoice) : Promise.resolve(null)), [open]);
  return (
    <>
      <PageHeader title="Invoices" />
      <Async state={s}>{rows => <Table rows={rows} empty="No invoices" onRowClick={i => setOpen(i.id)} columns={[{ label: 'Invoice', render: i => i.invoiceNumber }, { label: 'For', render: i => i.vehicleName || label(i.kind) }, { label: 'Status', render: i => <StatusPill status={i.paymentStatus} /> }, { label: 'Total', right: true, render: i => money(i.totals?.totalCents, i.currency) }, { label: 'Balance', right: true, render: i => money(i.balanceCents, i.currency) }]} />}</Async>
      <Modal open={Boolean(open)} title="Invoice" size="lg" onClose={() => setOpen(null)}>
        <Async state={inv}>{i => (i ? (
          <div className="stack">
            <Table rows={i.lineItems} columns={[{ label: 'Item', render: l => l.description }, { label: 'Amount', right: true, render: l => money(l.totalCents, i.currency) }]} />
            <div className="row between"><span>Total {money(i.totals.totalCents, i.currency)}</span><strong>Balance {money(i.balanceCents, i.currency)}</strong></div>
            {i.payments.filter(p => p.status === 'succeeded').map(p => <div key={p.id} className="small muted">Paid {money(p.amountCents)} · {label(p.method)} · receipt {p.receiptNumber} · {dt(p.receivedAt)}</div>)}
            {i.balanceCents > 0 && <OnlinePayment invoice={i} onPaid={() => { inv.reload(); s.reload(); }} />}
            <Button variant="ghost" onClick={() => window.print()}>Print</Button>
          </div>
        ) : null)}</Async>
      </Modal>
    </>
  );
};

const Appointments = ({ summary }) => {
  const [run, busy] = useAction();
  const confirm = useConfirm();
  const [f, setF] = useState(null);
  const locations = useAsync(() => api.get('/locations').then(r => r.locations), []);
  const list = useAsync(() => api.get('/appointments').then(r => r.appointments), []);
  const slots = useAsync(() => (f?.locationId && f?.date ? api.get('/appointments/availability', { locationId: f.locationId, date: f.date, durationMinutes: 60 }) : Promise.resolve(null)), [f?.locationId, f?.date]);
  return (
    <>
      <PageHeader title="Appointments" actions={<Button variant="primary" onClick={() => setF({ date: new Date(Date.now() + 86400000).toISOString().slice(0, 10) })}>Book service</Button>} />
      <Async state={list}>{rows => <Table rows={rows} empty="No appointments" columns={[{ label: 'When', render: a => `${a.scheduledDate} ${a.scheduledTime}` }, { label: 'Vehicle', render: a => vehicleName(a.vehicle) }, { label: 'Service', render: a => a.serviceRequested || a.concerns?.join('; ') }, { label: 'Status', render: a => <StatusPill status={a.status} /> },
        { label: '', render: a => (['scheduled', 'confirmed'].includes(a.status) ? <Button size="sm" variant="ghost" onClick={async () => { const c = await confirm({ title: 'Cancel appointment', reason: 'Reason' }); if (c) run(async () => { await api.post(`/appointments/${a.id}/status`, { status: 'cancelled', reason: c.reason }); list.reload(); }); }}>Cancel</Button> : null) }]} />}</Async>
      <Modal open={Boolean(f)} title="Book service" onClose={() => setF(null)} footer={<Button variant="primary" loading={busy} disabled={!f?.vehicleId || !f?.time || !f?.locationId} onClick={() => run(async () => {
        await api.post('/appointments', { locationId: f.locationId, vehicleId: f.vehicleId, date: f.date, time: f.time, durationMinutes: 60, serviceRequested: f.service, concerns: f.service ? [f.service] : [] });
        setF(null);
        list.reload();
      }, 'Appointment requested')}>Book</Button>}>
        <Field label="Location"><Select value={f?.locationId || ''} placeholder="Choose" options={(locations.data || []).map(l => ({ value: l.id, label: `${l.name} — ${l.city || ''}` }))} onChange={e => setF(x => ({ ...x, locationId: e.target.value }))} /></Field>
        <Field label="Vehicle"><Select value={f?.vehicleId || ''} placeholder="Choose" options={summary.vehicles.map(v => ({ value: v.id, label: vehicleName(v) }))} onChange={e => setF(x => ({ ...x, vehicleId: e.target.value }))} /></Field>
        <Field label="Date"><Input type="date" value={f?.date || ''} onChange={e => setF(x => ({ ...x, date: e.target.value, time: '' }))} /></Field>
        <Async state={slots}>{sl => (sl ? (sl.open ? <div className="row wrap">{sl.slots.filter(x => x.available).map(x => <Button key={x.startAt} size="sm" variant={f.time === x.time ? 'primary' : ''} onClick={() => setF(y => ({ ...y, time: x.time }))}>{x.time}</Button>)}</div> : <Alert tone="warn">Closed on this day.</Alert>) : null)}</Async>
        <Field label="What do you need?"><Input value={f?.service || ''} onChange={e => setF(x => ({ ...x, service: e.target.value }))} /></Field>
      </Modal>
    </>
  );
};

const Messages = () => {
  const s = useAsync(async () => {
    const convs = (await api.get('/conversations')).conversations;
    return Promise.all(convs.map(c => api.get(`/conversations/${c.id}`)));
  }, []);
  return (
    <>
      <PageHeader title="Messages" />
      <Card title="Message the shop"><Composer channels={['portal']} onSend={async ({ body }) => { await api.post('/messages', { body, channel: 'portal' }); s.reload(); }} /></Card>
      <Async state={s}>{threads => threads.map(t => <Card key={t.conversation.id} title={t.conversation.subject || 'Conversation'}><MessageThread messages={t.messages} /></Card>)}</Async>
    </>
  );
};

const Membership = ({ summary }) => {
  const plans = useAsync(() => api.get('/membership-plans').then(r => r.plans), []);
  return (
    <>
      <PageHeader title="Membership" />
      {summary.memberships.length ? summary.memberships.map(m => (
        <Card key={m.id} title={m.plan ? `${m.plan.name}` : m.number} actions={<StatusPill status={m.status} />}>
          <div className="small">Member number <span className="mono">{m.number}</span> · {d(m.currentPeriodStart)} – {d(m.currentPeriodEnd)}</div>
          {m.status === 'pending_payment' && <Alert tone="warn">Your membership activates when its invoice is paid.</Alert>}
        </Card>
      )) : <Alert tone="info">You are not a member yet. Ask your service advisor about these plans:</Alert>}
      <Async state={plans}>{ps => <div className="grid-3">{ps.map(p => <Card key={p.id} title={p.name}><strong>{money(p.priceAnnualCents, p.currency)} / year</strong><ul className="small" style={{ paddingLeft: 16 }}>{p.benefitsText.map((b, i) => <li key={i}>{b}</li>)}</ul></Card>)}</div>}</Async>
    </>
  );
};

const FuelLog = ({ summary }) => {
  const [run, busy] = useAction();
  const [vehicleId, setVehicleId] = useState(summary.vehicles[0]?.id || '');
  const [f, setF] = useState({ odometer: '', volume: '', fullTank: true });
  const s = useAsync(() => (vehicleId ? api.get(`/fuel/${vehicleId}`) : Promise.resolve(null)), [vehicleId]);
  return (
    <>
      <PageHeader title="Fuel log" actions={<Select value={vehicleId} options={summary.vehicles.map(v => ({ value: v.id, label: vehicleName(v) }))} onChange={e => setVehicleId(e.target.value)} style={{ width: 'auto' }} />} />
      {vehicleId && <Card title="Add fill-up">
        <div className="grid-3">
          <Field label="Odometer"><Input inputMode="numeric" value={f.odometer} onChange={e => setF(x => ({ ...x, odometer: e.target.value }))} /></Field>
          <Field label="Gallons"><Input inputMode="decimal" value={f.volume} onChange={e => setF(x => ({ ...x, volume: e.target.value }))} /></Field>
          <label className="row small" style={{ alignSelf: 'end' }}><input type="checkbox" checked={f.fullTank} onChange={e => setF(x => ({ ...x, fullTank: e.target.checked }))} />Filled to full</label>
        </div>
        <div style={{ marginTop: 10 }}><Button variant="primary" loading={busy} disabled={!f.odometer || !f.volume} onClick={() => run(async () => { await api.action('/fuel', { vehicleId, odometer: Number(f.odometer), volume: Number(f.volume), fullTank: f.fullTank }); setF({ odometer: '', volume: '', fullTank: true }); s.reload(); }, 'Fill-up saved')}>Save</Button></div>
      </Card>}
      <Async state={s}>{h => (h ? <Table rows={h.events} empty="No fill-ups yet" columns={[{ label: 'Date', render: e => d(e.at) }, { label: 'Odometer', render: e => e.odometer.toLocaleString() }, { label: 'Gallons', render: e => e.volume }, { label: 'MPG', render: e => e.economy?.mpg ?? '—' }, { label: '', render: e => (e.anomaly?.flagged ? <Badge tone="warn">Lower than usual</Badge> : null) }]} /> : null)}</Async>
    </>
  );
};

export const Portal = ({ route }) => {
  const { user, logout } = useAuth();
  const summary = useAsync(() => api.get('/portal/summary'), []);
  const [section, id] = route.path;
  return (
    <div className="ft">
      <div className="ft-shell">
        <aside className="ft-side">
          <div className="ft-brand"><span>FutureTech · My Garage</span></div>
          <nav className="ft-nav">{NAV.map(([key, text, Icon]) => <a key={key} href={`#/portal/${key}`} className={(section || '') === key ? 'active' : ''}><Icon size={16} />{text}</a>)}</nav>
          <div className="grow" />
          <div className="small faint" style={{ padding: '0 10px' }}>{user.name}</div>
        </aside>
        <div className="ft-main">
          <header className="ft-top"><div className="grow" /><a href="#/portal/account" className="small">Account</a><Button variant="ghost" onClick={logout} aria-label="Sign out"><LogOut size={16} /></Button></header>
          <main className="ft-content">
            <Async state={summary}>{s => (
              <>
                {!section && <Garage summary={s} reload={summary.reload} />}
                {section === 'ro' && <RoView id={id} />}
                {section === 'visits' && <Visits />}
                {section === 'invoices' && <Invoices />}
                {section === 'appointments' && <Appointments summary={s} />}
                {section === 'messages' && <Messages />}
                {section === 'membership' && <Membership summary={s} />}
                {section === 'fuel' && <FuelLog summary={s} />}
                {section === 'account' && <PortalAccount />}
              </>
            )}</Async>
          </main>
        </div>
      </div>
    </div>
  );
};

const PortalAccount = () => {
  const [run, busy] = useAction();
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  return (
    <Card title="Change password">
      <div className="stack">
        <Field label="Current password"><Input type="password" value={pw.currentPassword} onChange={e => setPw(p => ({ ...p, currentPassword: e.target.value }))} /></Field>
        <Field label="New password"><Input type="password" value={pw.newPassword} onChange={e => setPw(p => ({ ...p, newPassword: e.target.value }))} /></Field>
        <Button variant="primary" loading={busy} onClick={() => run(async () => { await api.post('/auth/password/change', pw); setPw({ currentPassword: '', newPassword: '' }); }, 'Password updated')}>Update</Button>
      </div>
    </Card>
  );
};
