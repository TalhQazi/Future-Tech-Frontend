import React, { useEffect, useState } from 'react';
import { Plus, LogIn, Clock } from 'lucide-react';
import { api } from '../../api/client.js';
import { navigate } from '../../router.js';
import { useAuth } from '../auth.jsx';
import { useWorkspace } from '../Shell.jsx';
import { Card, PageHeader, Button, Field, Input, Select, Textarea, Table, StatusPill, Badge, Modal, Alert, Async, Stat, useAsync, useAction, useConfirm, vehicleName, dt, label } from '../ui.jsx';
import { SearchPicker } from '../shared.jsx';

const todayStr = () => new Date().toISOString().slice(0, 10);

export const Appointments = ({ query }) => {
  const { can } = useAuth();
  const { locationId, location } = useWorkspace();
  const confirm = useConfirm();
  const [run, busy] = useAction();
  const [date, setDate] = useState(todayStr());
  const [form, setForm] = useState(null);
  const list = useAsync(() => api.get('/appointments', { locationId, date }).then(r => r.appointments), [locationId, date]);
  const cap = useAsync(() => api.get('/appointments/capacity', { locationId, date }), [locationId, date]);
  useEffect(() => {
    if (query?.customerId) api.get(`/customers/${query.customerId}`).then(r => setForm({ customer: r.customer, date, time: '', durationMinutes: 60, concerns: '' })).catch(() => {});
  }, [query?.customerId, date]);

  const status = async (a, st) => {
    const c = st === 'cancelled' ? await confirm({ title: 'Cancel appointment', reason: 'Cancellation reason', tone: 'danger' }) : { reason: undefined };
    if (c) run(async () => { await api.post(`/appointments/${a.id}/status`, { status: st, reason: c.reason }); list.reload(); cap.reload(); }, `Appointment ${label(st)}`);
  };

  return (
    <>
      <PageHeader title="Appointments" subtitle={location?.name} actions={<><Input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: 170 }} />{can('appointments:write') && <Button variant="primary" onClick={() => setForm({ date, time: '', durationMinutes: 60, concerns: '' })}><Plus size={14} />Book</Button>}</>} />
      <Async state={cap}>{c => (
        <div className="grid-4">
          <Stat label="Opening hours" value={c.open ? `${c.hours.open}–${c.hours.close}` : 'Closed'} hint={c.timezone} />
          <Stat label="Bay capacity" value={`${c.capacityHours} h`} hint={`${c.activeBays} active bays`} />
          <Stat label="Booked" value={`${c.bookedHours} h`} hint={`${c.appointmentsCount} appointments`} />
          <Stat label="Utilization" value={`${c.utilizationPercent}%`} hint={`${c.availableHours} h available`} />
        </div>
      )}</Async>
      <Async state={list}>{rows => (
        <Table rows={rows} empty="No appointments on this day" columns={[
          { label: 'Time', render: a => <strong>{a.scheduledTime}</strong> },
          { label: 'Customer', render: a => a.customer?.name }, { label: 'Vehicle', render: a => (a.vehicleId ? <a href={`#/app/intelligence/vehicle/${a.vehicleId}`} onClick={e => e.stopPropagation()}>{vehicleName(a.vehicle)}</a> : vehicleName(a.vehicle)) },
          { label: 'Service', render: a => a.serviceRequested || a.concerns?.join('; ') || '—' }, { label: 'Status', render: a => <StatusPill status={a.status} /> },
          { label: '', render: a => (
            <div className="row">
              {['scheduled', 'confirmed', 'arrived'].includes(a.status) && can('ros:write') && <Button size="sm" variant="primary" onClick={() => navigate(`#/app/check-in?appointmentId=${a.id}`)}><LogIn size={13} />Check in</Button>}
              {a.status === 'scheduled' && <Button size="sm" onClick={() => status(a, 'confirmed')}>Confirm</Button>}
              {['scheduled', 'confirmed'].includes(a.status) && <Button size="sm" onClick={() => status(a, 'no_show')}>No-show</Button>}
              {['scheduled', 'confirmed', 'arrived'].includes(a.status) && <Button size="sm" variant="ghost" onClick={() => status(a, 'cancelled')}>Cancel</Button>}
              {a.roId && <a href={`#/app/ro/${a.roId}`} className="small">Repair order</a>}
            </div>
          ) }
        ]} />
      )}</Async>
      {form && <BookModal form={form} setForm={setForm} locationId={locationId} busy={busy} run={run} onBooked={() => { setForm(null); list.reload(); cap.reload(); }} />}
    </>
  );
};

const BookModal = ({ form, setForm, locationId, run, busy, onBooked }) => {
  const { can } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const slots = useAsync(() => (form.date ? api.get('/appointments/availability', { locationId, date: form.date, durationMinutes: form.durationMinutes }) : Promise.resolve(null)), [form.date, form.durationMinutes, locationId]);
  useEffect(() => { if (form.customer) api.get('/vehicles', { customerId: form.customer.id }).then(r => setVehicles(r.vehicles)); }, [form.customer]);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const book = () => run(async () => {
    await api.post('/appointments', {
      locationId, customerId: form.customer.id, vehicleId: form.vehicleId, date: form.date, time: form.time, durationMinutes: Number(form.durationMinutes),
      serviceRequested: form.serviceRequested, concerns: form.concerns ? form.concerns.split('\n').filter(Boolean) : [], transportation: form.transportation || 'unknown',
      overrideCapacity: form.override || undefined, overrideReason: form.overrideReason || undefined
    });
    onBooked();
  }, 'Appointment booked');
  return (
    <Modal open title="Book appointment" size="lg" onClose={() => setForm(null)} footer={<Button variant="primary" loading={busy} disabled={!form.customer || !form.vehicleId || !form.time} onClick={book}>Book</Button>}>
      {form.customer ? <div className="row"><strong>{form.customer.name}</strong><Button size="sm" variant="ghost" onClick={() => setForm(f => ({ ...f, customer: null, vehicleId: '' }))}>Change</Button></div>
        : <SearchPicker label="Customer" path="/customers" listKey="customers" renderItem={c => <span>{c.name} · {c.phone}</span>} onPick={c => setForm(f => ({ ...f, customer: c }))} />}
      {form.customer && <Field label="Vehicle"><Select value={form.vehicleId || ''} placeholder="Choose vehicle" options={vehicles.map(v => ({ value: v.id, label: vehicleName(v) }))} onChange={set('vehicleId')} /></Field>}
      <div className="grid-3">
        <Field label="Date"><Input type="date" value={form.date} onChange={set('date')} /></Field>
        <Field label="Duration (minutes)"><Input inputMode="numeric" value={form.durationMinutes} onChange={set('durationMinutes')} /></Field>
        <Field label="Transportation"><Select value={form.transportation || 'unknown'} options={['unknown', 'wait', 'drop_off', 'loaner', 'shuttle']} onChange={set('transportation')} /></Field>
      </div>
      <Async state={slots}>{sl => (sl?.open ? (
        <div className="row wrap">{sl.slots.map(x => <Button key={x.startAt} size="sm" variant={form.time === x.time ? 'primary' : ''} disabled={!x.available && !form.override} onClick={() => setForm(f => ({ ...f, time: x.time }))}>{x.time}{x.available ? '' : ' (full)'}</Button>)}</div>
      ) : <Alert tone="warn">The shop is closed on this day.</Alert>)}</Async>
      {can('ros:override') && <label className="row small"><input type="checkbox" checked={Boolean(form.override)} onChange={e => setForm(f => ({ ...f, override: e.target.checked }))} />Override capacity / hours (manager)</label>}
      {form.override && <Field label="Override reason"><Input value={form.overrideReason || ''} onChange={set('overrideReason')} /></Field>}
      <Field label="Service requested"><Input value={form.serviceRequested || ''} onChange={set('serviceRequested')} /></Field>
      <Field label="Concerns (one per line)"><Textarea value={form.concerns} onChange={set('concerns')} /></Field>
    </Modal>
  );
};

export const MyWork = () => {
  const { user } = useAuth();
  const [run, busy] = useAction();
  const ros = useAsync(() => api.get('/repair-orders', { techId: user.id, open: 'true', limit: 50 }).then(r => r.repairOrders), []);
  const time = useAsync(() => api.get('/time/me'), []);
  return (
    <>
      <PageHeader title="My work" actions={<Async state={time}>{t => (t.open
        ? <><Badge tone="ok"><Clock size={12} />Clocked in since {dt(t.open.startAt)}</Badge><Button size="sm" loading={busy} onClick={() => run(async () => { await api.post('/time/clock-out', {}); time.reload(); }, 'Clocked out')}>Clock out</Button></>
        : <Button size="sm" variant="primary" loading={busy} onClick={() => run(async () => { await api.post('/time/clock-in', { type: 'shop' }); time.reload(); }, 'Clocked in')}>Clock in (shop time)</Button>)}</Async>} />
      <Async state={ros}>{rows => (
        <div className="grid-3">
          {rows.length === 0 && <Card><p className="muted">No assigned repair orders.</p></Card>}
          {rows.map(r => (
            <button key={r.id} type="button" className="ft-ro-card" style={{ padding: 14 }} onClick={() => navigate(`#/app/ro/${r.id}?tab=work`)}>
              <div className="row between"><span className="mono">{r.roNumber}</span><StatusPill status={r.status} /></div>
              <strong>{vehicleName(r.vehicle)}</strong>
              <span className="small muted">{(r.jobs || []).filter(j => j.techId === user.id && !['completed', 'verified', 'cancelled'].includes(j.status)).map(j => j.title).join(', ') || 'Inspection / diagnosis'}</span>
            </button>
          ))}
        </div>
      )}</Async>
      <Card title="Recent time entries">
        <Async state={time}>{t => <Table rows={t.entries.slice(0, 20)} columns={[{ label: 'Type', render: e => label(e.type) }, { label: 'Start', render: e => dt(e.startAt) }, { label: 'End', render: e => (e.endAt ? dt(e.endAt) : 'running') }, { label: 'Minutes', render: e => e.minutes }]} />}</Async>
      </Card>
    </>
  );
};

export const Dispatch = () => {
  const { locationId } = useWorkspace();
  const s = useAsync(() => api.get('/workload', { locationId }).then(r => r.technicians), [locationId]);
  const unassigned = useAsync(() => api.get('/repair-orders', { locationId, open: 'true', limit: 100 }).then(r => r.repairOrders.filter(x => !x.assignedTech)), [locationId]);
  return (
    <>
      <PageHeader title="Dispatch" subtitle="Technician workload and unassigned work" />
      <Async state={unassigned}>{rows => rows.length > 0 && (
        <Card title={`Unassigned (${rows.length})`}>
          <Table rows={rows} onRowClick={r => navigate(`#/app/ro/${r.id}`)} columns={[{ label: 'RO', render: r => <span className="mono">{r.roNumber}</span> }, { label: 'Vehicle', render: r => vehicleName(r.vehicle) }, { label: 'Status', render: r => <StatusPill status={r.status} /> }, { label: 'Promised', render: r => (r.promisedAt ? dt(r.promisedAt) : '—') }]} />
        </Card>
      )}</Async>
      <Async state={s}>{techs => (
        <div className="grid-3">
          {techs.map(t => (
            <Card key={t.id} title={t.name} actions={t.clockedIn ? <Badge tone="ok">On the clock</Badge> : <Badge>Off clock</Badge>}>
              <div className="small muted">{t.specialty}</div>
              <div className="small" style={{ margin: '6px 0' }}>{t.queuedHours} sold hours queued</div>
              {t.openJobs.map(j => <a key={j.jobId} href={`#/app/ro/${j.roId}?tab=work`} className="row small" style={{ justifyContent: 'space-between' }}><span>{j.roNumber} · {j.title}</span><StatusPill status={j.status} /></a>)}
              {t.openJobs.length === 0 && <p className="small faint">No open jobs</p>}
            </Card>
          ))}
        </div>
      )}</Async>
    </>
  );
};
