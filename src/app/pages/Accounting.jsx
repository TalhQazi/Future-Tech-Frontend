import React, { useState } from 'react';
import { Printer } from 'lucide-react';
import { api, newIdempotencyKey } from '../../api/client.js';
import { navigate } from '../../router.js';
import { useAuth } from '../auth.jsx';
import { useWorkspace } from '../Shell.jsx';
import { Card, PageHeader, Button, Field, Input, Select, Tabs, Table, StatusPill, Badge, Modal, Alert, Async, useAsync, useAction, useConfirm, money, dt, label, toCents } from '../ui.jsx';
import { MoneyInput } from '../shared.jsx';
import { OnlinePayment } from '../payments.jsx';

const METHODS = ['cash', 'check', 'card_terminal', 'ach', 'fleet_account'];

export const InvoiceView = ({ invoice: inv, onChanged }) => {
  const { can, user } = useAuth();
  const confirm = useConfirm();
  const [run, busy] = useAction();
  const [pay, setPay] = useState(null);
  const [adj, setAdj] = useState(null);
  const [online, setOnline] = useState(false);
  const refresh = async () => onChanged((await api.get(`/invoices/${inv.id}`)).invoice);

  const post = async () => {
    const c = await confirm({ title: `Post ${inv.invoiceNumber}?`, message: `Posting finalizes the invoice for ${money(inv.totals.totalCents, inv.currency)}. After posting it can only be corrected with adjustments.`, confirmLabel: 'Post invoice' });
    if (c) run(async () => onChanged((await api.action(`/invoices/${inv.id}/post`)).invoice), 'Invoice posted');
  };
  const voidDraft = async () => {
    const c = await confirm({ title: 'Void draft invoice', reason: true, tone: 'danger', confirmLabel: 'Void draft' });
    if (c) run(async () => { await api.post(`/invoices/${inv.id}/void`, { reason: c.reason }); await refresh(); }, 'Draft voided');
  };
  const recordPayment = async () => {
    const c = await confirm({ title: 'Record payment', message: `${money(pay.amountCents, inv.currency)} by ${label(pay.method)}${pay.reference ? ` (ref ${pay.reference})` : ''}. Confirm the funds were received.`, confirmLabel: 'Record payment' });
    if (!c) return;
    run(async () => {
      await api.post(`/invoices/${inv.id}/payments`, { amountCents: pay.amountCents, method: pay.method, reference: pay.reference || undefined, cardLast4: pay.cardLast4 || undefined, note: pay.note || undefined }, { idempotencyKey: pay.key });
      setPay(null);
      await refresh();
    }, 'Payment recorded');
  };
  const requestRefund = async (p) => {
    const available = p.amountCents - (p.refundedCents || 0);
    const c = await confirm({ title: `Request refund on ${p.receiptNumber}`, message: `Up to ${money(available, inv.currency)}. A second authorized person must approve it.`, reason: 'Refund reason', tone: 'danger', confirmLabel: 'Request refund' });
    if (!c) return;
    const amount = window.prompt('Refund amount (e.g. 25.00)', (available / 100).toFixed(2));
    const amountCents = toCents(amount);
    if (!amountCents || amountCents <= 0) return;
    run(async () => { await api.post(`/payments/${p.id}/refunds`, { amountCents, reason: c.reason }, { idempotencyKey: newIdempotencyKey() }); await refresh(); }, 'Refund requested for approval');
  };
  const decide = async (r, approve) => {
    const c = await confirm({ title: `${approve ? 'Approve' : 'Reject'} refund ${r.refundNumber}`, message: approve ? `${money(r.amountCents, inv.currency)} will be returned via ${r.provider === 'stripe' ? 'the card processor' : `${label(r.method)} (pay it out now)`}.` : undefined, reason: approve ? undefined : 'Reason', tone: approve ? 'danger' : undefined });
    if (c) run(async () => { await api.post(`/refunds/${r.id}/decision`, { approve, note: c.reason }, { idempotencyKey: newIdempotencyKey() }); await refresh(); }, approve ? 'Refund processed' : 'Refund rejected');
  };
  const saveAdjustment = async () => {
    const c = await confirm({ title: `Post ${label(adj.type)}`, message: adj.type === 'reversal' ? 'Reverses the selected adjustment.' : `${money(adj.amountCents, inv.currency)} ${['debit_memo'].includes(adj.type) ? 'added to' : 'credited against'} the balance.`, confirmLabel: 'Post adjustment' });
    if (c) run(async () => { await api.post(`/invoices/${inv.id}/adjustments`, { type: adj.type, amountCents: adj.amountCents || undefined, reason: adj.reason, reversesAdjustmentId: adj.reversesAdjustmentId || undefined }, { idempotencyKey: newIdempotencyKey() }); setAdj(null); await refresh(); }, 'Adjustment posted');
  };

  return (
    <div className="stack">
      <Card title={<span>Invoice <span className="mono">{inv.invoiceNumber}</span></span>} actions={<>
        <StatusPill status={inv.status} />{inv.status === 'posted' && <StatusPill status={inv.paymentStatus} />}
        <Button size="sm" variant="ghost" onClick={() => window.print()}><Printer size={14} />Print</Button>
        {inv.status === 'draft' && can('invoices:post') && <Button size="sm" variant="primary" loading={busy} onClick={post}>Post invoice</Button>}
        {inv.status === 'draft' && can('invoices:write') && <Button size="sm" variant="danger" onClick={voidDraft}>Void draft</Button>}
      </>}>
        <div className="row wrap small muted" style={{ marginBottom: 10 }}>
          <span>{inv.customer?.name}</span>{inv.vehicle && <span>· {inv.vehicle.year} {inv.vehicle.make} {inv.vehicle.model} {inv.vehicle.vin && <span className="mono">{inv.vehicle.vin}</span>}</span>}
          {inv.repairOrder && <a href={`#/app/ro/${inv.repairOrder.id}`}>· {inv.repairOrder.roNumber}</a>}{inv.postedAt && <span>· posted {dt(inv.postedAt)}</span>}
        </div>
        <Table rows={inv.lineItems} columns={[
          { label: 'Description', render: l => <div>{l.description}<div className="small faint">{label(l.kind)}{l.hours ? ` · ${l.hours} h` : l.quantity ? ` · qty ${l.quantity}` : ''}</div></div> },
          { label: 'Amount', right: true, render: l => money(l.extendedCents, inv.currency) },
          { label: 'Discount', right: true, render: l => (l.discountCents ? `−${money(l.discountCents, inv.currency)}` : '—') },
          { label: 'Tax', right: true, render: l => money(l.taxCents, inv.currency) },
          { label: 'Total', right: true, render: l => money(l.totalCents, inv.currency) }
        ]} />
        <div className="grid-4" style={{ marginTop: 12 }}>
          <div className="ft-kv"><span>Total</span><strong>{money(inv.totals.totalCents, inv.currency)}</strong></div>
          <div className="ft-kv"><span>Paid</span><strong>{money(inv.paidCents - inv.refundedCents, inv.currency)}</strong></div>
          <div className="ft-kv"><span>Adjustments</span><strong>{money(inv.debitsCents - inv.creditsCents, inv.currency)}</strong></div>
          <div className="ft-kv"><span>Balance due</span><strong style={{ fontSize: 18 }}>{money(inv.balanceCents, inv.currency)}</strong></div>
        </div>
      </Card>

      {inv.status === 'posted' && (
        <Card title="Payments" actions={<>
          {can('payments:record') && inv.balanceCents > 0 && <Button size="sm" variant="primary" onClick={() => setPay({ amountCents: inv.balanceCents, method: 'card_terminal', reference: '', key: newIdempotencyKey() })}>Record payment</Button>}
          {can('payments:record') && inv.balanceCents > 0 && <Button size="sm" onClick={() => setOnline(o => !o)}>Online card</Button>}
          {can('adjustments:create') && <Button size="sm" onClick={() => setAdj({ type: 'credit_memo', amountCents: null, reason: '' })}>Adjustment</Button>}
        </>}>
          {online && <div style={{ marginBottom: 12 }}><OnlinePayment invoice={inv} onPaid={() => { setOnline(false); refresh(); }} /></div>}
          <Table rows={inv.payments} empty="No payments" columns={[
            { label: 'Receipt', render: p => <span className="mono">{p.receiptNumber}</span> }, { label: 'Method', render: p => `${label(p.method)}${p.cardLast4 ? ` ••${p.cardLast4}` : ''}${p.providerRef ? ` · ${p.providerRef}` : ''}` },
            { label: 'Status', render: p => <StatusPill status={p.status} /> }, { label: 'Amount', right: true, render: p => money(p.amountCents, inv.currency) },
            { label: '', render: p => (p.status === 'succeeded' && can('refunds:request') && p.amountCents > (p.refundedCents || 0) ? <Button size="sm" variant="ghost" onClick={() => requestRefund(p)}>Refund</Button> : null) }
          ]} />
          {inv.refunds.length > 0 && (
            <div style={{ marginTop: 12 }}><Table rows={inv.refunds} columns={[
              { label: 'Refund', render: r => <span className="mono">{r.refundNumber}</span> }, { label: 'Reason', render: r => r.reason }, { label: 'Amount', right: true, render: r => money(r.amountCents, inv.currency) },
              { label: 'Status', render: r => <StatusPill status={r.status} /> },
              { label: '', render: r => (r.status === 'pending_approval' && can('refunds:approve') && r.requestedBy !== user.id ? <div className="row"><Button size="sm" variant="danger" onClick={() => decide(r, true)}>Approve</Button><Button size="sm" onClick={() => decide(r, false)}>Reject</Button></div> : r.status === 'pending_approval' ? <span className="small faint">Awaiting another approver</span> : null) }
            ]} /></div>
          )}
          {inv.adjustments.length > 0 && (
            <div style={{ marginTop: 12 }}><Table rows={inv.adjustments} columns={[
              { label: 'Adjustment', render: a => `${label(a.type)} (${a.direction})` }, { label: 'Reason', render: a => a.reason },
              { label: 'Amount', right: true, render: a => `${a.direction === 'credit' ? '−' : '+'}${money(a.amountCents, inv.currency)}` }, { label: 'By', render: a => `${a.createdByName || ''} · ${dt(a.at)}` }
            ]} /></div>
          )}
        </Card>
      )}

      <Modal open={Boolean(pay)} title="Record in-store payment" onClose={() => setPay(null)} footer={<Button variant="primary" loading={busy} disabled={!pay?.amountCents || (['check', 'card_terminal', 'ach'].includes(pay?.method) && !pay?.reference)} onClick={recordPayment}>Continue</Button>}>
        <Alert tone="info">Never type card numbers here. For card terminal payments, enter the approval code and last four digits from the terminal receipt.</Alert>
        <div className="grid-2">
          <Field label="Amount"><MoneyInput cents={pay?.amountCents} onChange={c => setPay(p => ({ ...p, amountCents: c }))} /></Field>
          <Field label="Method"><Select value={pay?.method} options={METHODS} onChange={e => setPay(p => ({ ...p, method: e.target.value }))} /></Field>
          <Field label={pay?.method === 'check' ? 'Check number' : pay?.method === 'card_terminal' ? 'Approval code' : 'Reference'}><Input value={pay?.reference || ''} onChange={e => setPay(p => ({ ...p, reference: e.target.value }))} /></Field>
          {pay?.method === 'card_terminal' && <Field label="Card last 4"><Input inputMode="numeric" maxLength={4} value={pay?.cardLast4 || ''} onChange={e => setPay(p => ({ ...p, cardLast4: e.target.value.replace(/\D/g, '') }))} /></Field>}
        </div>
      </Modal>

      <Modal open={Boolean(adj)} title="Financial adjustment" onClose={() => setAdj(null)} footer={<Button variant="primary" disabled={!adj?.reason?.trim() || (adj?.type === 'reversal' ? !adj?.reversesAdjustmentId : !adj?.amountCents)} onClick={saveAdjustment}>Continue</Button>}>
        <Field label="Type"><Select value={adj?.type} options={['credit_memo', 'goodwill', 'write_off', 'debit_memo', 'reversal']} onChange={e => setAdj(a => ({ ...a, type: e.target.value }))} /></Field>
        {adj?.type === 'reversal'
          ? <Field label="Adjustment to reverse"><Select value={adj.reversesAdjustmentId || ''} placeholder="Choose" options={inv.adjustments.filter(a => a.type !== 'reversal').map(a => ({ value: a.id, label: `${label(a.type)} ${money(a.amountCents)} — ${a.reason}` }))} onChange={e => setAdj(a => ({ ...a, reversesAdjustmentId: e.target.value }))} /></Field>
          : <Field label="Amount"><MoneyInput cents={adj?.amountCents} onChange={c => setAdj(a => ({ ...a, amountCents: c }))} /></Field>}
        <Field label="Reason (audited)"><Input value={adj?.reason || ''} onChange={e => setAdj(a => ({ ...a, reason: e.target.value }))} /></Field>
      </Modal>
    </div>
  );
};

const InvoiceDetail = ({ id }) => {
  const s = useAsync(() => api.get(`/invoices/${id}`).then(r => r.invoice), [id]);
  return <Async state={s}>{inv => <><a href="#/app/accounting" className="small">← Invoices</a><InvoiceView invoice={inv} onChanged={s.setData} /></>}</Async>;
};

const Reconciliation = () => {
  const { locationId, location } = useWorkspace();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [counted, setCounted] = useState({});
  const confirm = useConfirm();
  const [run, busy] = useAction();
  const s = useAsync(() => api.get('/reconciliation', { locationId, businessDate: date }), [locationId, date]);
  return (
    <Card title={`Daily reconciliation · ${location?.name || ''}`} actions={<Input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: 170 }} />}>
      <Async state={s}>{data => {
        const methods = [...new Set([...Object.keys(data.expected), ...METHODS])];
        const closed = data.reconciliation?.status === 'closed';
        return (
          <div className="stack">
            {closed && <Alert tone="ok">Closed {dt(data.reconciliation.closedAt)}. Variance: {Object.entries(data.reconciliation.variance || {}).map(([m, v]) => `${label(m)} ${money(v)}`).join(', ') || 'none'}</Alert>}
            <Table rows={methods.map(m => ({ id: m, m }))} columns={[
              { label: 'Method', render: r => label(r.m) },
              { label: 'Expected', right: true, render: r => money(data.expected[r.m] || 0) },
              { label: 'Counted / settled', render: r => (closed ? money(data.reconciliation.counted?.[r.m] || 0) : <MoneyInput cents={counted[r.m] ?? null} onChange={c => setCounted(x => ({ ...x, [r.m]: c ?? 0 }))} />) }
            ]} />
            <div className="small muted">{data.payments.length} payment(s), {data.refunds.length} refund(s) in this business day.</div>
            {!closed && <Button variant="primary" loading={busy} onClick={async () => {
              const c = await confirm({ title: `Close ${date}?`, message: 'Closing records the counted amounts and variances. It cannot be reopened.', reason: 'Notes (variance explanation, deposit reference)' });
              if (c) run(async () => { await api.post('/reconciliation/close', { locationId, businessDate: date, counted: Object.fromEntries(methods.map(m => [m, counted[m] || 0])), notes: c.reason }); s.reload(); }, 'Day reconciled');
            }}>Close business day</Button>}
          </div>
        );
      }}</Async>
    </Card>
  );
};

export const Accounting = ({ id }) => {
  const { can } = useAuth();
  const { locationId } = useWorkspace();
  const [tab, setTab] = useState('open');
  const [q, setQ] = useState({});
  const filters = tab === 'open' ? { status: 'posted', paymentStatus: 'unpaid,partial' } : tab === 'drafts' ? { status: 'draft' } : { ...q };
  const s = useAsync(() => api.get('/invoices', { locationId, limit: 100, ...filters }).then(r => r.invoices), [locationId, tab, JSON.stringify(q)]);
  if (id) return <InvoiceDetail id={id} />;
  return (
    <>
      <PageHeader title="Invoices & payments" />
      <Tabs tabs={['open', 'drafts', 'all', can('reconciliation:manage') && 'reconciliation'].filter(Boolean)} active={tab} onChange={setTab} />
      {tab === 'reconciliation' ? <Reconciliation /> : (
        <>
          {tab === 'all' && <div className="row wrap"><Select value={q.paymentStatus || ''} placeholder="Any payment status" options={['unpaid', 'partial', 'paid', 'overpaid', 'refunded', 'written_off']} onChange={e => setQ(x => ({ ...x, paymentStatus: e.target.value }))} style={{ width: 200 }} /></div>}
          <Async state={s}>{rows => (
            <Table rows={rows} onRowClick={i => navigate(`#/app/accounting/${i.id}`)} columns={[
              { label: 'Invoice', render: i => <span className="mono">{i.invoiceNumber}</span> }, { label: 'Kind', render: i => <Badge>{label(i.kind)}</Badge> },
              { label: 'Customer', render: i => i.customerName }, { label: 'RO', render: i => i.roNumber || '—' },
              { label: 'Status', render: i => <StatusPill status={i.status === 'posted' ? i.paymentStatus : i.status} /> },
              { label: 'Total', right: true, render: i => money(i.totals?.totalCents, i.currency) }, { label: 'Balance', right: true, render: i => money(i.balanceCents, i.currency) }
            ]} />
          )}</Async>
        </>
      )}
    </>
  );
};
