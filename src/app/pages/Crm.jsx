import React, { useState } from 'react';
import { Plus, Send, AlertTriangle } from 'lucide-react';
import { api } from '../../api/client.js';
import { navigate } from '../../router.js';
import { useAuth } from '../auth.jsx';
import { Card, PageHeader, Button, Input, Table, StatusPill, Badge, Modal, Alert, Async, Empty, Tabs, useAsync, useAction, useConfirm, money, dt, d, label, vehicleName } from '../ui.jsx';
import { NewCustomerForm, NewVehicleForm } from './CheckIn.jsx';
import { SearchPicker } from '../shared.jsx';

const CONSENTS = ['sms_transactional', 'sms_marketing', 'email_transactional', 'email_marketing', 'telematics_collection', 'data_processing'];

export const Customers = ({ id }) => {
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);
  const s = useAsync(() => api.get('/customers', { q, limit: 50 }), [q]);
  if (id) return <CustomerDetail id={id} />;
  return (
    <>
      <PageHeader title="Customers & vehicles" actions={<><Input placeholder="Search name, phone, email, plate or VIN" value={q} onChange={e => setQ(e.target.value)} style={{ width: 320 }} /><Button variant="primary" onClick={() => setCreating(true)}><Plus size={14} />New customer</Button></>} />
      <Async state={s}>{data => (
        <Table rows={data.customers} onRowClick={c => navigate(`#/app/customers/${c.id}`)} empty="No customers found" columns={[
          { label: 'Customer', render: c => <div><strong>{c.name}</strong>{c.companyName && <div className="small faint">{c.companyName}</div>}</div> },
          { label: 'Phone', render: c => c.phone || '—' }, { label: 'Email', render: c => c.email || '—' },
          { label: 'Vehicles', render: c => c.vehicleCount }, { label: 'Membership', render: c => (c.activeMembership ? <Badge tone="ok">{c.activeMembership.number}</Badge> : '—') }
        ]} />
      )}</Async>
      <Modal open={creating} title="New customer" size="lg" onClose={() => setCreating(false)}><NewCustomerForm onCreated={c => navigate(`#/app/customers/${c.id}`)} /></Modal>
    </>
  );
};

const CustomerDetail = ({ id }) => {
  const { can } = useAuth();
  const [run, busy] = useAction();
  const [addVehicle, setAddVehicle] = useState(false);
  const [invite, setInvite] = useState(null);
  const s = useAsync(() => api.get(`/customers/${id}`).then(r => r.customer), [id]);
  return (
    <Async state={s}>{c => (
      <>
        <a href="#/app/customers" className="small">← Customers</a>
        <PageHeader title={c.name} subtitle={[c.phone, c.email].filter(Boolean).join(' · ')} actions={<>
          {c.portalAccount ? <Badge tone="ok">Portal {c.portalAccount.status}</Badge> : can('customers:write') && <Button size="sm" loading={busy} disabled={!c.email} onClick={() => run(async () => setInvite(await api.post(`/customers/${id}/portal-invite`)))}><Send size={13} />Invite to portal</Button>}
          {can('appointments:write') && <Button size="sm" onClick={() => navigate(`#/app/appointments?customerId=${id}`)}>Book appointment</Button>}
        </>} />
        {invite && <Alert tone={invite.inviteDelivery === 'sent' ? 'ok' : 'warn'}>{invite.inviteDelivery === 'sent' ? 'Invitation emailed.' : <>Email is not configured. Share this one-time link securely: <span className="mono small" style={{ wordBreak: 'break-all' }}>{invite.inviteLink}</span></>}</Alert>}
        {c.openBalanceCents > 0 && <Alert tone="warn">Open balance {money(c.openBalanceCents)}</Alert>}
        <div className="grid-2">
          <Card title="Vehicles" actions={can('vehicles:write') && <Button size="sm" onClick={() => setAddVehicle(true)}><Plus size={13} />Add vehicle</Button>}>
            <Table rows={c.vehicles} onRowClick={v => navigate(`#/app/vehicles/${v.id}`)} empty="No vehicles" columns={[
              { label: 'Vehicle', render: v => vehicleName(v) }, { label: 'VIN', render: v => <span className="mono small">{v.vin || '—'}</span> }, { label: 'Plate', render: v => v.licensePlate || '—' }, { label: 'Miles', render: v => v.mileage?.toLocaleString() }
            ]} />
          </Card>
          <Card title="Consent">
            {c.consents ? (
              <div className="stack-sm">{CONSENTS.map(t => (
                <div key={t} className="row between">
                  <span>{label(t)}</span>
                  <div className="row"><StatusPill status={c.consents[t]?.granted ? 'active' : 'declined'} />{can('customers:write') && <Button size="sm" variant="ghost" onClick={() => run(async () => { await api.post(`/customers/${id}/consents`, { type: t, granted: !c.consents[t]?.granted, source: 'in_person' }); s.reload(); }, 'Consent updated')}>{c.consents[t]?.granted ? 'Withdraw' : 'Record consent'}</Button>}</div>
                </div>
              ))}</div>
            ) : <p className="muted">Contact details restricted for your role.</p>}
          </Card>
          <Card title="Repair orders">
            <Table rows={c.recentRepairOrders} onRowClick={r => navigate(`#/app/ro/${r.id}`)} empty="No visits" columns={[{ label: 'RO', render: r => <span className="mono">{r.roNumber}</span> }, { label: 'Status', render: r => <StatusPill status={r.status} /> }, { label: 'Opened', render: r => d(r.createdAt) }]} />
          </Card>
          <Card title="Memberships" actions={can('memberships:sell') && <Button size="sm" onClick={() => navigate(`#/app/memberships?customerId=${id}`)}>Enroll</Button>}>
            <Table rows={c.memberships} empty="No memberships" columns={[{ label: 'Number', render: m => <span className="mono">{m.number}</span> }, { label: 'Status', render: m => <StatusPill status={m.status} /> }, { label: 'Renews', render: m => d(m.currentPeriodEnd) }]} />
          </Card>
        </div>
        <Modal open={addVehicle} title="Add vehicle" size="lg" onClose={() => setAddVehicle(false)}><NewVehicleForm customerId={id} onCreated={() => { setAddVehicle(false); s.reload(); }} /></Modal>
      </>
    )}</Async>
  );
};

export const VehicleDetail = ({ id }) => {
  const { can } = useAuth();
  const confirm = useConfirm();
  const [run, busy] = useAction();
  const [tab, setTab] = useState('history');
  const [transfer, setTransfer] = useState(false);
  const [recalls, setRecalls] = useState(null);
  const s = useAsync(() => api.get(`/vehicles/${id}`).then(r => r.vehicle), [id]);
  const history = useAsync(() => api.get(`/vehicles/${id}/history`), [id]);
  const fuel = useAsync(() => api.get(`/fuel/${id}`).catch(() => null), [id]);
  return (
    <Async state={s}>{v => (
      <>
        {v.owner && <a href={`#/app/customers/${v.owner.id}`} className="small">← {v.owner.name}</a>}
        <PageHeader title={vehicleName(v)} subtitle={<span className="mono">{v.vin || 'No VIN'} · {v.licensePlate || 'no plate'} · {v.mileage?.toLocaleString()} {v.mileageUnit}</span>} actions={<>
          <Button size="sm" loading={busy} onClick={() => run(async () => setRecalls((await api.get(`/vehicles/${id}/recalls`)).recalls))}><AlertTriangle size={13} />Check NHTSA recalls</Button>
          {can('vehicles:transfer') && <Button size="sm" onClick={() => setTransfer(true)}>Transfer ownership</Button>}
          {can('vehicles:write') && <Button size="sm" onClick={async () => {
            const odo = window.prompt('Current odometer reading');
            if (odo && /^\d+$/.test(odo)) run(async () => { await api.post(`/vehicles/${id}/mileage`, { odometer: Number(odo) }); s.reload(); }, 'Mileage recorded');
          }}>Record mileage</Button>}
        </>} />
        {recalls && (
          <Card title={`Recall campaigns (${recalls.recalls.length})`}>
            <Alert tone="info">{recalls.note}</Alert>
            <Table rows={recalls.recalls} rowKey="campaignNumber" empty="No NHTSA campaigns for this make/model/year" columns={[
              { label: 'Campaign', render: r => <span className="mono">{r.campaignNumber}</span> }, { label: 'Component', render: r => r.component },
              { label: 'Summary', render: r => <span className="small">{r.summary}</span> }, { label: 'Park it', render: r => (r.parkIt ? <Badge tone="danger">Yes</Badge> : '—') }
            ]} />
          </Card>
        )}
        <Tabs tabs={['history', 'recommendations', 'mileage', 'ownership', 'fuel']} active={tab} onChange={setTab} />
        {tab === 'history' && <Async state={history}>{h => (
          <div className="stack">
            <Table rows={h.visits} rowKey="roId" onRowClick={r => navigate(`#/app/ro/${r.roId}`)} empty="No service history" columns={[
              { label: 'RO', render: r => <span className="mono">{r.roNumber}</span> }, { label: 'Date', render: r => d(r.date) }, { label: 'Odometer', render: r => r.odometerIn?.toLocaleString() || '—' },
              { label: 'Work', render: r => r.jobs.map(j => j.title).join(', ') || r.concerns.map(c => c.text).join('; ') }, { label: 'Invoice', render: r => (r.invoice ? money(r.invoice.totalCents) : '—') }
            ]} />
            {h.declinedRecommendations.length > 0 && <Card title="Declined recommendations"><Table rows={h.declinedRecommendations} columns={[{ label: 'Item', render: f => f.name }, { label: 'Severity', render: f => <StatusPill status={f.severity} /> }, { label: 'Recommendation', render: f => f.recommendation }, { label: 'Date', render: f => d(f.createdAt) }]} /></Card>}
            {h.installedParts.length > 0 && <Card title="Installed parts"><Table rows={h.installedParts} columns={[{ label: 'Part', render: p => `${p.partNumber} ${p.description}` }, { label: 'Lot / serial', render: p => [p.lotNumber, p.serialNumber].filter(Boolean).join(' / ') || '—' }, { label: 'Installed', render: p => d(p.installedAt) }, { label: 'Status', render: p => <StatusPill status={p.status} /> }]} /></Card>}
          </div>
        )}</Async>}
        {tab === 'recommendations' && (v.predictiveSignals.length ? v.predictiveSignals.map(sg => (
          <Card key={sg.id} title={sg.title} actions={<><StatusPill status={sg.confidence} />{can('predictive:read') && <Button size="sm" variant="ghost" onClick={async () => { const c = await confirm({ title: 'Dismiss recommendation', reason: 'Why?' }); if (c) run(async () => { await api.patch(`/predictive/signals/${sg.id}`, { status: 'dismissed', note: c.reason }); s.reload(); }); }}>Dismiss</Button>}</>}>
            <p>{sg.recommendation}</p><p className="small muted">{sg.reason}</p><p className="small faint">{sg.uncertainty} · rule {sg.ruleKey} v{sg.ruleVersion}</p>
          </Card>
        )) : <Empty title="No open recommendations" />)}
        {tab === 'mileage' && <Table rows={v.mileageHistory} columns={[{ label: 'Odometer', render: m => m.odometer.toLocaleString() }, { label: 'Source', render: m => label(m.source) }, { label: 'Recorded', render: m => dt(m.recordedAt) }, { label: '', render: m => (m.flagged ? <Badge tone="warn">Lower than previous</Badge> : null) }]} />}
        {tab === 'ownership' && <Table rows={v.ownershipHistory} columns={[{ label: 'Customer', render: o => <a href={`#/app/customers/${o.customerId}`}>{o.customerId.slice(0, 8)}</a> }, { label: 'From', render: o => d(o.startedAt) }, { label: 'To', render: o => (o.endedAt ? d(o.endedAt) : 'current') }, { label: 'Reason', render: o => label(o.reason) }]} />}
        {tab === 'fuel' && <Async state={fuel}>{f => (f ? (
          <div className="stack">
            <div className="grid-3"><Card title="Average MPG"><strong style={{ fontSize: 22 }}>{f.averageMpg ?? '—'}</strong></Card><Card title="Fill-ups"><strong style={{ fontSize: 22 }}>{f.events.length}</strong></Card><Card title="Anomalies"><strong style={{ fontSize: 22 }}>{f.anomalies}</strong></Card></div>
            <Table rows={f.events} columns={[{ label: 'Date', render: e => d(e.at) }, { label: 'Odometer', render: e => e.odometer.toLocaleString() }, { label: 'Volume', render: e => `${e.volume} ${e.volumeUnit}` }, { label: 'MPG', render: e => e.economy?.mpg ?? '—' }, { label: 'Anomaly', render: e => (e.anomaly?.flagged ? <span className="small" title={e.anomaly.explanation}><Badge tone="warn">{e.anomaly.deviationPct}%</Badge></span> : '—') }]} />
          </div>
        ) : <Empty title="Fuel history unavailable" />)}</Async>}
        <Modal open={transfer} title="Transfer ownership" onClose={() => setTransfer(false)}>
          <Alert tone="info">VIN identity stays the same; the ownership history records the change. Memberships do not transfer with the vehicle.</Alert>
          <SearchPicker label="New owner" path="/customers" listKey="customers" renderItem={c => <span>{c.name} · {c.phone}</span>} onPick={async (c) => {
            const ok = await confirm({ title: `Transfer to ${c.name}?`, confirmLabel: 'Transfer' });
            if (ok) run(async () => { await api.post(`/vehicles/${id}/transfer`, { toCustomerId: c.id, reason: 'purchase' }); setTransfer(false); s.reload(); }, 'Ownership transferred');
          }} />
        </Modal>
      </>
    )}</Async>
  );
};

