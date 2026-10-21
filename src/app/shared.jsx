import React, { useEffect, useRef, useState } from 'react';
import { Camera, Car, Phone, Mail, ShieldAlert } from 'lucide-react';
import { api } from '../api/client.js';
import { enqueue } from './offline.js';
import { Button, Field, Input, StatusPill, Badge, useToast, vehicleName, dt } from './ui.jsx';

// Keeps vehicle and customer context visible during repair-order workflows.
export const VehicleBar = ({ ro }) => {
  const v = ro.vehicle;
  const c = ro.customer;
  return (
    <div className="ft-vehicle-bar">
      <Car size={22} />
      <div className="stack-sm">
        <div className="title">{vehicleName(v)} {v?.trim && <span className="muted" style={{ fontWeight: 500 }}>{v.trim}</span>}</div>
        <div className="row wrap small muted"><span className="mono">{v?.vin || 'No VIN'}</span>{v?.licensePlate && <Badge>{v.licensePlate}</Badge>}{v?.mileage ? <span>{v.mileage.toLocaleString()} mi</span> : null}</div>
      </div>
      <div className="ft-kv"><span>Customer</span><strong>{c?.name || '—'}</strong>{!c?.contactRestricted && <span className="row small muted">{c?.phone && <><Phone size={11} />{c.phone}</>}{c?.email && <><Mail size={11} />{c.email}</>}</span>}</div>
      <div className="ft-kv"><span>Repair order</span><strong className="mono">{ro.roNumber}</strong></div>
      <div className="ft-kv"><span>Status</span><StatusPill status={ro.status} /></div>
      <div className="ft-kv"><span>Promised</span><strong>{ro.promisedAt ? dt(ro.promisedAt) : '—'}</strong></div>
      {ro.openSafetyEscalations > 0 && <Badge tone="danger"><ShieldAlert size={12} /> {ro.openSafetyEscalations} safety</Badge>}
    </div>
  );
};

// Search-as-you-type picker for customers or vehicles.
export const SearchPicker = ({ label, path, listKey, renderItem, onPick, placeholder }) => {
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  useEffect(() => {
    if (q.trim().length < 2) { setItems([]); return undefined; }
    const t = setTimeout(() => api.get(path, { q, limit: 8 }).then(r => setItems(r[listKey] || [])).catch(() => setItems([])), 250);
    return () => clearTimeout(t);
  }, [q, path, listKey]);
  return (
    <div className="stack-sm">
      <Field label={label}><Input value={q} placeholder={placeholder} onChange={e => setQ(e.target.value)} /></Field>
      {items.length > 0 && (
        <div className="ft-table-wrap">
          {items.map(it => (
            <button key={it.id} type="button" className="ft-ro-card" style={{ width: '100%', borderRadius: 0 }} onClick={() => { onPick(it); setQ(''); setItems([]); }}>{renderItem(it)}</button>
          ))}
        </div>
      )}
    </div>
  );
};

// Authenticated evidence image (fetches with the bearer token).
export const EvidenceThumb = ({ evidence }) => {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let revoke;
    if (evidence.contentType?.startsWith('image/')) {
      api.blob(`/evidence/${evidence.id}/content`).then(b => { revoke = URL.createObjectURL(b); setUrl(revoke); }).catch(() => {});
    }
    return () => revoke && URL.revokeObjectURL(revoke);
  }, [evidence.id, evidence.contentType]);
  const open = async () => {
    const b = await api.blob(`/evidence/${evidence.id}/content`);
    window.open(URL.createObjectURL(b), '_blank', 'noopener');
  };
  return (
    <button type="button" onClick={open} title={evidence.caption || evidence.kind} style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }}>
      {url ? <img className="ft-thumb" src={url} alt={evidence.caption || 'Evidence photo'} /> : <div className="ft-thumb" style={{ display: 'grid', placeItems: 'center', fontSize: 11 }}>{evidence.kind}</div>}
      {evidence.status === 'superseded' && <div className="small faint">superseded</div>}
    </button>
  );
};

// Captures photos/videos/documents; queues offline with de-duplication.
export const EvidenceUploader = ({ roId, findingId, sessionId, onUploaded, label = 'Add photo / video', visibility }) => {
  const ref = useRef(null);
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const fields = { roId, findingId, sessionId, visibility };
      if (!navigator.onLine) {
        await enqueue({ path: '/evidence', file, fields, label: `Evidence ${file.name}` });
        toast.info('Saved offline; it will upload when you are back online');
      } else {
        const form = new FormData();
        Object.entries(fields).forEach(([k, v]) => v && form.append(k, v));
        form.append('file', file);
        const res = await api.upload('/evidence', form);
        onUploaded?.(res.evidence);
        toast.success('Evidence saved');
      }
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <input ref={ref} type="file" accept="image/*,video/*,application/pdf" capture="environment" hidden onChange={pick} />
      <Button size="sm" loading={busy} onClick={() => ref.current?.click()}><Camera size={14} />{label}</Button>
    </>
  );
};

export const MoneyInput = ({ cents, onChange, ...props }) => {
  const [text, setText] = useState(cents === null || cents === undefined ? '' : (cents / 100).toFixed(2));
  return (
    <Input inputMode="decimal" value={text} onChange={e => {
      setText(e.target.value);
      const s = e.target.value.replace(/[$,]/g, '');
      if (/^\d*(\.\d{0,2})?$/.test(s) && s !== '') {
        const [i, f = ''] = s.split('.');
        onChange(Number(i || 0) * 100 + Number((f + '00').slice(0, 2)));
      } else if (s === '') onChange(null);
    }} {...props} />
  );
};
