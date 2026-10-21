import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { X, AlertTriangle, Inbox } from 'lucide-react';
import { useEscapeKey } from '../components/a11y.js';

// ---- formatting -----------------------------------------------------------------
export const money = (cents, currency = 'USD') =>
  cents === null || cents === undefined ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
export const toCents = (value) => {
  const s = String(value ?? '').trim().replace(/[$,]/g, '');
  if (!/^-?\d+(\.\d{0,2})?$/.test(s)) return null;
  const [i, f = ''] = s.replace('-', '').split('.');
  const cents = Number(i) * 100 + Number((f + '00').slice(0, 2));
  return s.startsWith('-') ? -cents : cents;
};
export const centsToInput = (cents) => (cents === null || cents === undefined ? '' : (cents / 100).toFixed(2));
export const dt = (v) => (v ? new Date(v).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—');
export const d = (v) => (v ? new Date(v).toLocaleDateString([], { dateStyle: 'medium' }) : '—');
export const label = (s = '') => String(s).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
export const vehicleName = (v) => (v ? [v.year, v.make, v.model].filter(Boolean).join(' ') : '—');

// ---- data hooks --------------------------------------------------------------------
export const useAsync = (fn, deps = []) => {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const run = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const data = await fnRef.current();
      setState({ data, error: null, loading: false });
    } catch (error) {
      setState(s => ({ ...s, error, loading: false }));
    }
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { run(); }, deps);
  return { ...state, reload: run, setData: (data) => setState(s => ({ ...s, data })) };
};

// ---- toasts --------------------------------------------------------------------------
const ToastCtx = createContext(null);
export const ToastProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const push = useCallback((type, message) => {
    const id = Math.random();
    setItems(xs => [...xs, { id, type, message }]);
    setTimeout(() => setItems(xs => xs.filter(x => x.id !== id)), type === 'error' ? 7000 : 3500);
  }, []);
  const api = useMemo(() => ({ success: (m) => push('success', m), error: (e) => push('error', e?.message ? `${e.message}${e.correlationId ? ` (ref ${e.correlationId.slice(0, 8)})` : ''}` : String(e)), info: (m) => push('info', m) }), [push]);
  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="ft-toasts" aria-live="polite" role="status">
        {items.map(t => <div key={t.id} className={`ft-toast ${t.type}`}>{t.message}</div>)}
      </div>
    </ToastCtx.Provider>
  );
};
export const useToast = () => useContext(ToastCtx);

// Runs an async action with toast feedback; returns the result or undefined.
export const useAction = () => {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const run = useCallback(async (fn, success) => {
    setBusy(true);
    try {
      const out = await fn();
      if (success) toast.success(success);
      return out;
    } catch (err) {
      toast.error(err);
      return undefined;
    } finally {
      setBusy(false);
    }
  }, [toast]);
  return [run, busy];
};

// ---- primitives ------------------------------------------------------------------------
export const Button = ({ variant = '', size = '', block, loading, children, className = '', ...props }) => (
  <button type="button" className={`ft-btn ${variant} ${size} ${block ? 'block' : ''} ${className}`} disabled={loading || props.disabled} {...props}>
    {loading ? <span className="ft-spinner" style={{ width: 14, height: 14 }} /> : null}
    {children}
  </button>
);

export const Card = ({ title, actions, children, className = '', style }) => (
  <section className={`ft-card ${className}`} style={style}>
    {(title || actions) && <div className="ft-card-head"><h3>{title}</h3><div className="row">{actions}</div></div>}
    {children}
  </section>
);

export const PageHeader = ({ title, subtitle, actions }) => (
  <div className="ft-page-head">
    <div className="stack-sm"><h1>{title}</h1>{subtitle && <p className="muted">{subtitle}</p>}</div>
    {actions && <div className="row wrap">{actions}</div>}
  </div>
);

export const Badge = ({ tone = '', children }) => <span className={`ft-badge ${tone}`}>{children}</span>;

const TONES = {
  ok: ['closed', 'paid', 'approved', 'completed', 'verified', 'active', 'passed', 'succeeded', 'received', 'ready_for_pickup', 'published', 'pass', 'issued', 'delivered', 'sent', 'online', 'solved', 'ok'],
  warn: ['awaiting_approval', 'partial', 'partially_approved', 'pending', 'pending_approval', 'waiting_parts', 'quality_check', 'attention', 'draft', 'presented', 'in_transit', 'ordered', 'sourcing', 'requested', 'queued', 'past_due', 'pending_payment', 'candidate', 'medium', 'paused'],
  danger: ['cancelled', 'declined', 'failed', 'fail', 'overpaid', 'rejected', 'no_show', 'critical', 'safety', 'comeback', 'disabled', 'revoked', 'dead', 'high', 'urgent', 'provider_not_configured', 'no_consent'],
  info: ['in_progress', 'inspecting', 'diagnosing', 'checked_in', 'approved_work', 'scheduled', 'confirmed', 'arrived', 'open', 'unpaid', 'processing', 'invited', 'reserved']
};
export const StatusPill = ({ status }) => {
  const tone = Object.keys(TONES).find(t => TONES[t].includes(status)) || '';
  return <Badge tone={tone}>{label(status || 'unknown')}</Badge>;
};

export const Field = ({ label: text, hint, error, children }) => (
  <label className="ft-field">
    <span>{text}</span>
    {children}
    {error ? <em className="err">{error}</em> : hint ? <em className="hint">{hint}</em> : null}
  </label>
);
export const Input = (props) => <input className="ft-input" {...props} />;
export const Select = ({ options = [], placeholder, ...props }) => (
  <select {...props}>
    {placeholder !== undefined && <option value="">{placeholder}</option>}
    {options.map(o => (typeof o === 'string' ? <option key={o} value={o}>{label(o)}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
  </select>
);
export const Textarea = (props) => <textarea {...props} />;

export const Spinner = () => <div className="ft-loading"><div className="ft-spinner" /></div>;
export const Empty = ({ title = 'Nothing here yet', hint, action }) => (
  <div className="ft-empty"><Inbox size={22} /><strong>{title}</strong>{hint && <span>{hint}</span>}{action}</div>
);
export const Alert = ({ tone = 'info', children }) => (
  <div className={`ft-alert ${tone}`} role={tone === 'danger' ? 'alert' : undefined}>
    {tone !== 'info' && <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />}<div className="grow">{children}</div>
  </div>
);
export const ErrorBox = ({ error, onRetry }) => (error ? (
  <Alert tone="danger">
    <div className="row between wrap"><span>{error.message}{error.correlationId && <span className="faint small"> · ref {error.correlationId.slice(0, 8)}</span>}</span>{onRetry && <Button size="sm" onClick={onRetry}>Retry</Button>}</div>
  </Alert>
) : null);

export const Async = ({ state, children }) => {
  if (state.loading && !state.data) return <Spinner />;
  if (state.error && !state.data) return <ErrorBox error={state.error} onRetry={state.reload} />;
  return children(state.data);
};

export const Stat = ({ label: l, value, hint }) => (
  <div className="ft-stat"><div className="label">{l}</div><div className="value">{value}</div>{hint && <div className="hint">{hint}</div>}</div>
);

export const Tabs = ({ tabs, active, onChange }) => (
  <div className="ft-tabs" role="tablist">
    {tabs.map(t => {
      const key = typeof t === 'string' ? t : t.key;
      return <button key={key} type="button" role="tab" aria-selected={active === key} className={active === key ? 'active' : ''} onClick={() => onChange(key)}>{typeof t === 'string' ? label(t) : t.label}</button>;
    })}
  </div>
);

export const Table = ({ columns, rows, onRowClick, empty = 'No records', rowKey = 'id' }) => (
  rows?.length ? (
    <div className="ft-table-wrap">
      <table className="ft-table">
        <thead><tr>{columns.map(c => <th key={c.key || c.label} className={c.right ? 'right' : ''}>{c.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r[rowKey] ?? i} className={onRowClick ? 'clickable' : ''} onClick={onRowClick ? () => onRowClick(r) : undefined}>
              {columns.map(c => <td key={c.key || c.label} className={c.right ? 'right' : ''}>{c.render ? c.render(r) : r[c.key] ?? '—'}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : <Empty title={empty} />
);

export const Modal = ({ open, title, onClose, children, footer, size = '' }) => {
  useEscapeKey(open, onClose);
  if (!open) return null;
  return (
    <div className="ft-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`ft-modal ${size}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="ft-modal-head"><h3>{title}</h3><Button variant="ghost" size="sm" onClick={onClose} aria-label="Close"><X size={16} /></Button></div>
        <div className="ft-modal-body">{children}</div>
        {footer && <div className="ft-modal-foot">{footer}</div>}
      </div>
    </div>
  );
};

export const Drawer = ({ open, title, onClose, children }) => {
  useEscapeKey(open, onClose);
  if (!open) return null;
  return (
    <div className="ft-drawer-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <aside className="ft-drawer" role="dialog" aria-modal="true" aria-label={title}>
        <div className="ft-modal-head"><h3>{title}</h3><Button variant="ghost" size="sm" onClick={onClose} aria-label="Close"><X size={16} /></Button></div>
        <div className="ft-modal-body">{children}</div>
      </aside>
    </div>
  );
};

// Explicit confirmation for financial, destructive, safety-critical and
// authorization-sensitive actions. Optionally requires a written reason.
const ConfirmCtx = createContext(null);
export const ConfirmProvider = ({ children }) => {
  const [req, setReq] = useState(null);
  const [reason, setReason] = useState('');
  const confirm = useCallback((opts) => new Promise(resolve => { setReason(''); setReq({ ...opts, resolve }); }), []);
  const close = (value) => { req?.resolve(value); setReq(null); };
  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      <Modal open={Boolean(req)} title={req?.title || 'Confirm'} onClose={() => close(null)} footer={
        <>
          <Button onClick={() => close(null)}>Cancel</Button>
          <Button variant={req?.tone === 'danger' ? 'danger' : 'primary'} disabled={req?.reason && !reason.trim()} onClick={() => close({ reason: reason.trim() })}>{req?.confirmLabel || 'Confirm'}</Button>
        </>
      }>
        {req?.message && <p>{req.message}</p>}
        {req?.reason && <Field label={typeof req.reason === 'string' ? req.reason : 'Reason (recorded in the audit history)'}><Textarea value={reason} onChange={e => setReason(e.target.value)} autoFocus /></Field>}
      </Modal>
    </ConfirmCtx.Provider>
  );
};
export const useConfirm = () => useContext(ConfirmCtx);

// Simple controlled form state helper
export const useForm = (initial) => {
  const [values, setValues] = useState(initial);
  const bind = (name, { type } = {}) => ({
    value: type === 'checkbox' ? undefined : values[name] ?? '',
    checked: type === 'checkbox' ? Boolean(values[name]) : undefined,
    onChange: (e) => setValues(v => ({ ...v, [name]: type === 'checkbox' ? e.target.checked : e.target.value }))
  });
  return { values, setValues, bind, set: (name, value) => setValues(v => ({ ...v, [name]: value })) };
};
