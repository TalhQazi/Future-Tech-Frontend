import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
import { api, newIdempotencyKey } from '../../api/client.js';
import { navigate } from '../../router.js';
import { useWorkspace } from '../Shell.jsx';
import { PageHeader, Card, Button, Field, Input, Select, Textarea, Alert, useAction, vehicleName, Badge } from '../ui.jsx';
import { SearchPicker } from '../shared.jsx';

export const NewCustomerForm = ({ onCreated }) => {
  const [f, setF] = useState({ name: '', phone: '', email: '', preferredContact: 'sms', smsConsent: false, emailConsent: false });
  const [dupes, setDupes] = useState(null);
  const [run, busy] = useAction();
  const save = (allowDuplicate = false) => run(async () => {
    const consents = [
      { type: 'sms_transactional', granted: f.smsConsent, source: 'in_person' },
      { type: 'email_transactional', granted: f.emailConsent, source: 'in_person' }
    ];
    try {
      const res = await api.post('/customers', { name: f.name, phone: f.phone, email: f.email, preferredContact: f.preferredContact, consents, allowDuplicate });
      onCreated(res.customer);
    } catch (err) {
      if (err.code === 'POSSIBLE_DUPLICATE') return setDupes(err.details?.matches || []);
      throw err;
    }
  });
  const set = (k) => (e) => setF(v => ({ ...v, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  return (
    <div className="stack">
      <div className="grid-3">
        <Field label="Full name"><Input value={f.name} onChange={set('name')} /></Field>
        <Field label="Mobile phone"><Input value={f.phone} onChange={set('phone')} /></Field>
        <Field label="Email"><Input type="email" value={f.email} onChange={set('email')} /></Field>
      </div>
      <div className="row wrap">
        <label className="row small"><input type="checkbox" checked={f.smsConsent} onChange={set('smsConsent')} />Customer agrees to service text messages</label>
        <label className="row small"><input type="checkbox" checked={f.emailConsent} onChange={set('emailConsent')} />Customer agrees to service emails</label>
      </div>
      {dupes && (
        <Alert tone="warn">
          Possible existing customer: {dupes.map(d => <Button key={d.id} size="sm" onClick={() => onCreated(d)}>{d.name} {d.phone}</Button>)}
          <Button size="sm" variant="ghost" onClick={() => save(true)}>Create a new record anyway</Button>
        </Alert>
      )}
      <Button variant="primary" loading={busy} disabled={!f.name.trim()} onClick={() => save(false)}>Create customer</Button>
    </div>
  );
};

export const NewVehicleForm = ({ customerId, onCreated }) => {
  const [f, setF] = useState({ vin: '', year: '', make: '', model: '', trim: '', engine: '', licensePlate: '', color: '', mileage: '' });
  const [decoded, setDecoded] = useState(null);
  const [run, busy] = useAction();
  const set = (k) => (e) => setF(v => ({ ...v, [k]: e.target.value }));
  const decode = () => run(async () => {
    const res = await api.get(`/vehicles/decode-vin/${encodeURIComponent(f.vin.trim())}`);
    setDecoded(res.decoded);
    if (res.decoded.valid) setF(v => ({ ...v, year: res.decoded.year || v.year, make: res.decoded.make || v.make, model: res.decoded.model || v.model, trim: res.decoded.trim || v.trim, engine: res.decoded.engine || v.engine }));
  });
  const save = () => run(async () => {
    const res = await api.post('/vehicles', {
      customerId, vin: f.vin.trim() || undefined, allowMissingVin: !f.vin.trim(), year: f.year ? Number(f.year) : undefined,
      make: f.make || undefined, model: f.model || undefined, trim: f.trim || undefined, engine: f.engine || undefined,
      licensePlate: f.licensePlate || undefined, color: f.color || undefined, mileage: f.mileage ? Number(f.mileage) : undefined
    });
    onCreated(res.vehicle);
  });
  return (
    <div className="stack">
      <div className="row" style={{ alignItems: 'flex-end' }}>
        <div className="grow"><Field label="VIN"><Input className="ft-input mono" value={f.vin} maxLength={17} onChange={set('vin')} /></Field></div>
        <Button onClick={decode} loading={busy} disabled={f.vin.trim().length !== 17}><Search size={14} />Decode (NHTSA)</Button>
      </div>
      {decoded && !decoded.valid && <Alert tone="warn">{decoded.reason}</Alert>}
      {decoded?.valid && !decoded.checkDigitValid && <Alert tone="warn">The VIN check digit does not validate. Double-check the VIN.</Alert>}
      {decoded?.valid && decoded.errorText && !decoded.decodeComplete && <Alert tone="info">NHTSA: {decoded.errorText}</Alert>}
      <div className="grid-4">
        <Field label="Year"><Input inputMode="numeric" value={f.year} onChange={set('year')} /></Field>
        <Field label="Make"><Input value={f.make} onChange={set('make')} /></Field>
        <Field label="Model"><Input value={f.model} onChange={set('model')} /></Field>
        <Field label="Trim"><Input value={f.trim} onChange={set('trim')} /></Field>
        <Field label="Engine"><Input value={f.engine} onChange={set('engine')} /></Field>
        <Field label="Plate"><Input value={f.licensePlate} onChange={set('licensePlate')} /></Field>
        <Field label="Color"><Input value={f.color} onChange={set('color')} /></Field>
        <Field label="Odometer"><Input inputMode="numeric" value={f.mileage} onChange={set('mileage')} /></Field>
      </div>
      <Button variant="primary" loading={busy} disabled={!f.make || !f.model || !f.year} onClick={save}>Register vehicle</Button>
    </div>
  );
};

export const CheckIn = ({ query }) => {
  const { locationId, location } = useWorkspace();
  const [customer, setCustomer] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [vehicleId, setVehicleId] = useState('');
  const [mode, setMode] = useState(null);
  const [concerns, setConcerns] = useState(['']);
  const [f, setF] = useState({ odometerIn: '', fuelLevel: '', keyTag: '', waiter: false, transportation: 'unknown', promisedAt: '', advisorNotes: '', assignedTechId: '', bayId: '' });
  const [techs, setTechs] = useState([]);
  const [run, busy] = useAction();
  const [key] = useState(newIdempotencyKey);

  useEffect(() => {
    if (query?.appointmentId) {
      api.get(`/appointments/${query.appointmentId}`).then(r => {
        const a = r.appointment;
        setCustomer(a.customer);
        setVehicleId(a.vehicleId);
        setConcerns(a.concerns?.length ? a.concerns : [a.serviceRequested || '']);
      }).catch(() => {});
    }
  }, [query?.appointmentId]);
  useEffect(() => { if (customer) api.get('/vehicles', { customerId: customer.id }).then(r => setVehicles(r.vehicles)).catch(() => {}); }, [customer]);
  useEffect(() => { if (locationId) api.get('/users', { role: 'technician', locationId, status: 'active' }).then(r => setTechs(r.users)).catch(() => {}); }, [locationId]);

  const submit = () => run(async () => {
    const res = await api.post('/repair-orders', {
      locationId, customerId: customer.id, vehicleId, appointmentId: query?.appointmentId,
      concerns: concerns.map(c => c.trim()).filter(Boolean),
      odometerIn: f.odometerIn ? Number(f.odometerIn) : undefined, fuelLevel: f.fuelLevel || undefined, keyTag: f.keyTag || undefined,
      waiter: f.waiter, transportation: f.transportation, promisedAt: f.promisedAt ? new Date(f.promisedAt).toISOString() : undefined,
      advisorNotes: f.advisorNotes || undefined, assignedTechId: f.assignedTechId || undefined, bayId: f.bayId || undefined
    }, { idempotencyKey: key });
    navigate(`#/app/ro/${res.repairOrder.id}`);
  }, 'Repair order opened');

  const set = (k) => (e) => setF(v => ({ ...v, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  return (
    <>
      <PageHeader title="Vehicle check-in" subtitle={location?.name} />
      <Card title="1. Customer" actions={customer && <Button size="sm" onClick={() => { setCustomer(null); setVehicleId(''); }}>Change</Button>}>
        {customer ? <div className="row"><strong>{customer.name}</strong><span className="muted">{customer.phone} {customer.email}</span></div> : (
          <div className="stack">
            <SearchPicker label="Find customer (name, phone, email, plate, VIN)" path="/customers" listKey="customers" onPick={setCustomer}
              renderItem={c => <div className="row between"><strong>{c.name}</strong><span className="muted small">{c.phone} · {c.vehicleCount} vehicle(s)</span></div>} />
            {mode === 'customer' ? <NewCustomerForm onCreated={c => { setCustomer(c); setMode(null); }} /> : <Button onClick={() => setMode('customer')}><Plus size={14} />New customer</Button>}
          </div>
        )}
      </Card>

      {customer && (
        <Card title="2. Vehicle">
          <div className="stack">
            <div className="row wrap">
              {vehicles.map(v => (
                <button key={v.id} type="button" className="ft-ro-card" style={{ borderColor: vehicleId === v.id ? 'var(--primary)' : undefined }} onClick={() => setVehicleId(v.id)}>
                  <strong>{vehicleName(v)}</strong><span className="mono small muted">{v.vin || 'No VIN'}</span>{v.licensePlate && <Badge>{v.licensePlate}</Badge>}
                </button>
              ))}
            </div>
            {mode === 'vehicle' ? <NewVehicleForm customerId={customer.id} onCreated={v => { setVehicles(xs => [...xs, v]); setVehicleId(v.id); setMode(null); }} />
              : <Button onClick={() => setMode('vehicle')}><Plus size={14} />Register a vehicle</Button>}
          </div>
        </Card>
      )}

      {customer && vehicleId && (
        <Card title="3. Concerns & intake">
          <div className="stack">
            {concerns.map((c, i) => (
              <div key={i} className="row">
                <Input placeholder="Customer's words, e.g. 'Grinding noise when braking at low speed'" value={c} onChange={e => setConcerns(xs => xs.map((x, j) => (j === i ? e.target.value : x)))} />
                {concerns.length > 1 && <Button variant="ghost" onClick={() => setConcerns(xs => xs.filter((_, j) => j !== i))} aria-label="Remove concern"><Trash2 size={14} /></Button>}
              </div>
            ))}
            <Button size="sm" onClick={() => setConcerns(xs => [...xs, ''])}><Plus size={13} />Add concern</Button>
            <div className="grid-4">
              <Field label="Odometer in"><Input inputMode="numeric" value={f.odometerIn} onChange={set('odometerIn')} /></Field>
              <Field label="Fuel level"><Select value={f.fuelLevel} onChange={set('fuelLevel')} placeholder="—" options={['E', '1/4', '1/2', '3/4', 'F']} /></Field>
              <Field label="Key tag"><Input value={f.keyTag} onChange={set('keyTag')} /></Field>
              <Field label="Promised time"><Input type="datetime-local" value={f.promisedAt} onChange={set('promisedAt')} /></Field>
              <Field label="Transportation"><Select value={f.transportation} onChange={set('transportation')} options={['unknown', 'wait', 'drop_off', 'loaner', 'shuttle']} /></Field>
              <Field label="Technician"><Select value={f.assignedTechId} onChange={set('assignedTechId')} placeholder="Assign later" options={techs.map(t => ({ value: t.id, label: t.name }))} /></Field>
              <Field label="Bay"><Select value={f.bayId} onChange={set('bayId')} placeholder="Assign later" options={(location?.bays || []).filter(b => b.active !== false).map(b => ({ value: b.id, label: b.name }))} /></Field>
              <label className="row small" style={{ alignSelf: 'end' }}><input type="checkbox" checked={f.waiter} onChange={set('waiter')} />Customer is waiting</label>
            </div>
            <Field label="Advisor notes (internal)"><Textarea value={f.advisorNotes} onChange={set('advisorNotes')} /></Field>
            <Button variant="primary" loading={busy} disabled={!concerns.some(c => c.trim())} onClick={submit}>Open repair order</Button>
          </div>
        </Card>
      )}
    </>
  );
};
