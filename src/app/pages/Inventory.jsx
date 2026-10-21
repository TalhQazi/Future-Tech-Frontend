import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { api, newIdempotencyKey } from '../../api/client.js';
import { useAuth } from '../auth.jsx';
import { useWorkspace } from '../Shell.jsx';
import { Card, PageHeader, Button, Field, Input, Select, Table, StatusPill, Badge, Modal, Alert, Async, Tabs, useAsync, useAction, useConfirm, money, dt, label, toCents } from '../ui.jsx';
import { MoneyInput } from '../shared.jsx';

const PartForm = ({ part, onSaved }) => {
  const [f, setF] = useState(part || { partNumber: '', description: '', category: '', brand: '', supplier: '', unitCostCents: 0, listPriceCents: 0, warrantyMonths: '' });
  const [run, busy] = useAction();
  const set = (k) => (e) => setF(x => ({ ...x, [k]: e.target.value }));
  const save = () => run(async () => {
    const body = { partNumber: f.partNumber, description: f.description, category: f.category || undefined, brand: f.brand || undefined, supplier: f.supplier || undefined, unitCostCents: f.unitCostCents || 0, listPriceCents: f.listPriceCents || 0, warrantyMonths: f.warrantyMonths ? Number(f.warrantyMonths) : null, taxable: f.taxable !== false };
    onSaved((part ? await api.patch(`/parts/${part.id}`, body) : await api.post('/parts', body)).part);
  }, 'Part saved');
  return (
    <div className="stack">
      <div className="grid-2">
        <Field label="Part number"><Input value={f.partNumber} onChange={set('partNumber')} disabled={Boolean(part)} /></Field>
        <Field label="Description"><Input value={f.description} onChange={set('description')} /></Field>
        <Field label="Category"><Input value={f.category || ''} onChange={set('category')} /></Field>
        <Field label="Brand"><Input value={f.brand || ''} onChange={set('brand')} /></Field>
        <Field label="Supplier"><Input value={f.supplier || ''} onChange={set('supplier')} /></Field>
        <Field label="Warranty (months)"><Input inputMode="numeric" value={f.warrantyMonths ?? ''} onChange={set('warrantyMonths')} /></Field>
        <Field label="Unit cost"><MoneyInput cents={f.unitCostCents} onChange={c => setF(x => ({ ...x, unitCostCents: c ?? 0 }))} /></Field>
        <Field label="List price"><MoneyInput cents={f.listPriceCents} onChange={c => setF(x => ({ ...x, listPriceCents: c ?? 0 }))} /></Field>
      </div>
      <Button variant="primary" loading={busy} disabled={!f.partNumber || !f.description} onClick={save}>Save part</Button>
    </div>
  );
};

const Parts = () => {
  const { can } = useAuth();
  const { locationId, locations } = useWorkspace();
  const confirm = useConfirm();
  const [run] = useAction();
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState(null);
  const s = useAsync(() => api.get('/parts', { q, locationId, limit: 100 }), [q, locationId]);
  const adjust = async (p, kind) => {
    const stock = p.stock.find(x => x.locationId === locationId);
    const c = await confirm({ title: `${kind === 'count' ? 'Cycle count' : 'Adjust stock'}: ${p.partNumber}`, message: `On hand ${stock?.onHand ?? 0}, reserved ${stock?.reserved ?? 0}.`, reason: kind === 'count' ? 'Notes' : 'Adjustment reason (damage, shrinkage, found stock...)' });
    if (!c) return;
    const n = window.prompt(kind === 'count' ? 'Counted quantity' : 'Quantity change (e.g. -2 or 5)');
    if (n === null || !/^-?\d+$/.test(n.trim())) return;
    run(async () => {
      if (kind === 'count') await api.post('/stock/count', { partId: p.id, locationId, countedQuantity: Number(n), reason: c.reason }, { idempotencyKey: newIdempotencyKey() });
      else await api.post('/stock/adjust', { partId: p.id, locationId, quantityDelta: Number(n), reason: c.reason }, { idempotencyKey: newIdempotencyKey() });
      s.reload();
    }, 'Stock updated');
  };
  const assignLegacy = async (p) => {
    const c = await confirm({ title: `Assign legacy stock of ${p.legacyStockUnassigned} to ${locations.find(l => l.id === locationId)?.name}?`, message: 'The prototype recorded this count without a location. It becomes the opening balance here.', confirmLabel: 'Assign' });
    if (c) run(async () => { await api.post(`/parts/${p.id}/assign-legacy-stock`, { locationId }); s.reload(); }, 'Opening balance recorded');
  };
  return (
    <Card title="Parts catalog" actions={<><Input placeholder="Search parts" value={q} onChange={e => setQ(e.target.value)} style={{ width: 220 }} />{can('inventory:write') && <Button size="sm" variant="primary" onClick={() => setEdit({})}><Plus size={13} />New part</Button>}</>}>
      <Async state={s}>{data => (
        <Table rows={data.parts} columns={[
          { label: 'Part', render: p => <div><strong className="mono">{p.partNumber}</strong><div className="small muted">{p.description}</div></div> },
          { label: 'Brand', render: p => p.brand || '—' }, { label: 'Cost', right: true, render: p => money(p.unitCostCents) }, { label: 'List', right: true, render: p => money(p.listPriceCents) },
          { label: 'Here', render: p => { const st = p.stock.find(x => x.locationId === locationId); return st ? <span>{st.available} avail <span className="faint">({st.onHand} / {st.reserved} res)</span> {st.belowMin && <Badge tone="warn">Low</Badge>}</span> : '0'; } },
          { label: '', render: p => (
            <div className="row">
              {p.legacyStockUnassigned > 0 && can('inventory:adjust') && <Button size="sm" onClick={() => assignLegacy(p)}>Assign {p.legacyStockUnassigned} legacy</Button>}
              {can('inventory:adjust') && <Button size="sm" variant="ghost" onClick={() => adjust(p, 'adjust')}>Adjust</Button>}
              {can('inventory:adjust') && <Button size="sm" variant="ghost" onClick={() => adjust(p, 'count')}>Count</Button>}
              {can('inventory:write') && <Button size="sm" variant="ghost" onClick={() => setEdit(p)}>Edit</Button>}
            </div>
          ) }
        ]} />
      )}</Async>
      <Modal open={Boolean(edit)} title={edit?.id ? `Edit ${edit.partNumber}` : 'New part'} size="lg" onClose={() => setEdit(null)}>{edit && <PartForm part={edit.id ? edit : null} onSaved={() => { setEdit(null); s.reload(); }} />}</Modal>
    </Card>
  );
};

const Requests = () => {
  const { locationId } = useWorkspace();
  const [run] = useAction();
  const s = useAsync(() => api.get('/part-requests', { locationId, status: 'requested,sourcing,ordered,received,reserved' }).then(r => r.partRequests), [locationId]);
  const link = (r) => {
    const pn = window.prompt('Catalog part number to link');
    if (!pn) return;
    run(async () => { const p = (await api.get(`/parts/${encodeURIComponent(pn.trim())}`)).part; await api.patch(`/part-requests/${r.id}`, { partId: p.id }); s.reload(); }, 'Part linked');
  };
  return (
    <Async state={s}>{rows => (
      <Table rows={rows} empty="No open part requests" columns={[
        { label: 'RO', render: r => <a href={`#/app/ro/${r.roId}`} className="mono">{r.roNumber}</a> }, { label: 'Part', render: r => `${r.quantity} × ${r.description}${r.partNumber ? ` (${r.partNumber})` : ''}` },
        { label: 'Urgency', render: r => (r.urgency === 'urgent' ? <Badge tone="danger">Urgent</Badge> : 'Normal') }, { label: 'Status', render: r => <StatusPill status={r.status} /> }, { label: 'Requested', render: r => dt(r.createdAt) },
        { label: '', render: r => (
          <div className="row">
            {!r.partId && <Button size="sm" variant="ghost" onClick={() => link(r)}>Link part</Button>}
            {r.status === 'requested' && <Button size="sm" variant="ghost" onClick={() => run(async () => { await api.patch(`/part-requests/${r.id}`, { status: 'sourcing' }); s.reload(); })}>Sourcing</Button>}
            {r.partId && ['requested', 'sourcing', 'received'].includes(r.status) && <Button size="sm" variant="primary" onClick={() => run(async () => { await api.post(`/part-requests/${r.id}/fulfill`); s.reload(); }, 'Reserved for the repair order')}>Reserve from stock</Button>}
            {!['reserved', 'issued'].includes(r.status) && <Button size="sm" variant="ghost" onClick={() => run(async () => { await api.patch(`/part-requests/${r.id}`, { status: 'cancelled' }); s.reload(); })}>Cancel</Button>}
          </div>
        ) }
      ]} />
    )}</Async>
  );
};

const PurchaseOrders = () => {
  const { locationId } = useWorkspace();
  const confirm = useConfirm();
  const [run, busy] = useAction();
  const [draft, setDraft] = useState(null);
  const [receiving, setReceiving] = useState(null);
  const s = useAsync(() => api.get('/purchase-orders', { locationId }).then(r => r.purchaseOrders), [locationId]);
  const suppliers = useAsync(() => api.get('/suppliers').then(r => r.suppliers), []);
  const addLine = async () => {
    const pn = window.prompt('Part number');
    if (!pn) return;
    const qty = Number(window.prompt('Quantity', '1'));
    if (!Number.isInteger(qty) || qty <= 0) return;
    run(async () => { const p = (await api.get(`/parts/${encodeURIComponent(pn.trim())}`)).part; setDraft(d => ({ ...d, lines: [...d.lines, { partId: p.id, partNumber: p.partNumber, quantity: qty, unitCostCents: p.unitCostCents }] })); });
  };
  return (
    <Card title="Purchase orders" actions={<Button size="sm" variant="primary" onClick={() => setDraft({ supplierId: '', lines: [] })}><Plus size={13} />New PO</Button>}>
      <Async state={s}>{rows => (
        <Table rows={rows} empty="No purchase orders" columns={[
          { label: 'PO', render: p => <span className="mono">{p.poNumber}</span> }, { label: 'Supplier', render: p => p.supplierName || '—' }, { label: 'Lines', render: p => p.lines.length },
          { label: 'Total', right: true, render: p => money(p.totalCents) }, { label: 'Status', render: p => <StatusPill status={p.status} /> },
          { label: '', render: p => (
            <div className="row">
              {p.status === 'draft' && <Button size="sm" onClick={() => run(async () => { await api.post(`/purchase-orders/${p.id}/submit`, {}); s.reload(); }, 'PO submitted')}>Submit</Button>}
              {['ordered', 'partially_received'].includes(p.status) && <Button size="sm" variant="primary" onClick={() => setReceiving({ po: p, qty: Object.fromEntries(p.lines.map(l => [l.id, l.quantityOrdered - l.quantityReceived])), packingSlip: '', key: newIdempotencyKey() })}>Receive</Button>}
              {['draft', 'ordered'].includes(p.status) && <Button size="sm" variant="ghost" onClick={async () => { const c = await confirm({ title: `Cancel ${p.poNumber}`, reason: true, tone: 'danger' }); if (c) run(async () => { await api.post(`/purchase-orders/${p.id}/cancel`, { reason: c.reason }); s.reload(); }); }}>Cancel</Button>}
            </div>
          ) }
        ]} />
      )}</Async>
      <Modal open={Boolean(draft)} title="New purchase order" size="lg" onClose={() => setDraft(null)} footer={<Button variant="primary" loading={busy} disabled={!draft?.lines.length} onClick={() => run(async () => {
        await api.post('/purchase-orders', { locationId, supplierId: draft.supplierId || undefined, lines: draft.lines.map(l => ({ partId: l.partId, quantity: l.quantity, unitCostCents: l.unitCostCents })) });
        setDraft(null);
        s.reload();
      }, 'Purchase order created')}>Create PO</Button>}>
        <Field label="Supplier"><Select value={draft?.supplierId || ''} placeholder="—" options={(suppliers.data || []).map(x => ({ value: x.id, label: x.name }))} onChange={e => setDraft(d => ({ ...d, supplierId: e.target.value }))} /></Field>
        <Table rows={draft?.lines || []} rowKey="partId" empty="No lines" columns={[{ label: 'Part', render: l => l.partNumber }, { label: 'Qty', render: l => l.quantity }, { label: 'Unit cost', render: l => money(l.unitCostCents) }]} />
        <Button size="sm" onClick={addLine}><Plus size={13} />Add line</Button>
      </Modal>
      <Modal open={Boolean(receiving)} title={`Receive ${receiving?.po.poNumber}`} onClose={() => setReceiving(null)} footer={<Button variant="primary" loading={busy} onClick={() => run(async () => {
        await api.post(`/purchase-orders/${receiving.po.id}/receive`, { packingSlip: receiving.packingSlip || undefined, lines: receiving.po.lines.map(l => ({ lineId: l.id, quantity: Number(receiving.qty[l.id]) || 0 })) }, { idempotencyKey: receiving.key });
        setReceiving(null);
        s.reload();
      }, 'Stock received')}>Receive into stock</Button>}>
        {receiving?.po.lines.map(l => <Field key={l.id} label={`${l.partNumber} (ordered ${l.quantityOrdered}, received ${l.quantityReceived})`}><Input inputMode="numeric" value={receiving.qty[l.id]} onChange={e => setReceiving(r => ({ ...r, qty: { ...r.qty, [l.id]: e.target.value } }))} /></Field>)}
        <Field label="Packing slip"><Input value={receiving?.packingSlip || ''} onChange={e => setReceiving(r => ({ ...r, packingSlip: e.target.value }))} /></Field>
      </Modal>
    </Card>
  );
};

const Transfers = () => {
  const { locationId, locations } = useWorkspace();
  const [run] = useAction();
  const s = useAsync(() => api.get('/transfers').then(r => r.transfers), []);
  const request = async () => {
    const from = window.prompt(`Source location code:\n${locations.filter(l => l.id !== locationId).map(l => l.code || l.name).join(', ')}`);
    const src = locations.find(l => l.code === from || l.name === from);
    const pn = window.prompt('Part number');
    const qty = Number(window.prompt('Quantity', '1'));
    if (!src || !pn || !Number.isInteger(qty) || qty <= 0) return;
    run(async () => { const p = (await api.get(`/parts/${encodeURIComponent(pn.trim())}`)).part; await api.post('/transfers', { fromLocationId: src.id, toLocationId: locationId, lines: [{ partId: p.id, quantity: qty }] }); s.reload(); }, 'Transfer requested');
  };
  return (
    <Card title="Transfers" actions={<Button size="sm" onClick={request}><Plus size={13} />Request transfer</Button>}>
      <Async state={s}>{rows => (
        <Table rows={rows} empty="No transfers" columns={[
          { label: 'Transfer', render: t => <span className="mono">{t.transferNumber}</span> }, { label: 'From → To', render: t => `${locations.find(l => l.id === t.fromLocationId)?.name || t.fromLocationId} → ${locations.find(l => l.id === t.toLocationId)?.name || t.toLocationId}` },
          { label: 'Lines', render: t => t.lines.map(l => `${l.quantity} × ${l.partNumber}`).join(', ') }, { label: 'Status', render: t => <StatusPill status={t.status} /> },
          { label: '', render: t => (
            <div className="row">
              {t.status === 'requested' && t.fromLocationId === locationId && <Button size="sm" onClick={() => run(async () => { await api.post(`/transfers/${t.id}/ship`, {}, { idempotencyKey: newIdempotencyKey() }); s.reload(); }, 'Shipped')}>Ship</Button>}
              {t.status === 'in_transit' && t.toLocationId === locationId && <Button size="sm" variant="primary" onClick={() => run(async () => { await api.post(`/transfers/${t.id}/receive`, {}, { idempotencyKey: newIdempotencyKey() }); s.reload(); }, 'Received')}>Receive</Button>}
              {t.status === 'requested' && <Button size="sm" variant="ghost" onClick={() => run(async () => { await api.post(`/transfers/${t.id}/cancel`); s.reload(); })}>Cancel</Button>}
            </div>
          ) }
        ]} />
      )}</Async>
    </Card>
  );
};

const VendorReturns = () => {
  const { locationId } = useWorkspace();
  const [run] = useAction();
  const s = useAsync(() => api.get('/vendor-returns').then(r => r.vendorReturns), []);
  const create = async () => {
    const pn = window.prompt('Part number to return');
    const qty = Number(window.prompt('Quantity', '1'));
    const reason = window.prompt('Reason (defective, wrong part, overstock)');
    if (!pn || !Number.isInteger(qty) || qty <= 0 || !reason) return;
    run(async () => { const p = (await api.get(`/parts/${encodeURIComponent(pn.trim())}`)).part; await api.post('/vendor-returns', { locationId, lines: [{ partId: p.id, quantity: qty, reason }] }); s.reload(); }, 'Return created');
  };
  return (
    <Card title="Returns to vendor" actions={<Button size="sm" onClick={create}><Plus size={13} />New return</Button>}>
      <Async state={s}>{rows => (
        <Table rows={rows} empty="No vendor returns" columns={[
          { label: 'Return', render: r => <span className="mono">{r.returnNumber}</span> }, { label: 'Lines', render: r => r.lines.map(l => `${l.quantity} × ${l.partNumber} (${l.reason})`).join(', ') },
          { label: 'Credit', right: true, render: r => money(r.creditCents) }, { label: 'Status', render: r => <StatusPill status={r.status} /> },
          { label: '', render: r => (
            <div className="row">
              {r.status === 'draft' && <Button size="sm" onClick={() => run(async () => { await api.post(`/vendor-returns/${r.id}/ship`, {}, { idempotencyKey: newIdempotencyKey() }); s.reload(); }, 'Shipped; stock reduced')}>Ship</Button>}
              {r.status === 'shipped' && <Button size="sm" onClick={() => { const cents = toCents(window.prompt('Supplier credit amount (e.g. 120.00)')); if (cents !== null && cents >= 0) run(async () => { await api.post(`/vendor-returns/${r.id}/credit`, { creditCents: cents }); s.reload(); }, 'Credit recorded'); }}>Record credit</Button>}
            </div>
          ) }
        ]} />
      )}</Async>
    </Card>
  );
};

const Ledger = () => {
  const { locationId } = useWorkspace();
  const s = useAsync(() => api.get('/stock/ledger', { locationId, limit: 200 }).then(r => r.transactions), [locationId]);
  return (
    <Card title="Stock ledger (immutable)">
      <Async state={s}>{rows => <Table rows={rows} columns={[
        { label: 'When', render: t => dt(t.at) }, { label: 'Type', render: t => label(t.type) }, { label: 'Part', render: t => <span className="mono small">{t.partId.slice(0, 8)}</span> },
        { label: 'Qty', right: true, render: t => (t.quantity > 0 ? `+${t.quantity}` : t.quantity) }, { label: 'Reserved', right: true, render: t => t.reservedDelta || '—' },
        { label: 'On hand after', right: true, render: t => t.onHandAfter }, { label: 'Reason', render: t => t.reason || '—' }, { label: 'By', render: t => t.byName || t.by }
      ]} />}</Async>
    </Card>
  );
};

export const Inventory = () => {
  const { can } = useAuth();
  const [tab, setTab] = useState('parts');
  return (
    <>
      <PageHeader title="Parts & inventory" />
      <Tabs tabs={['parts', can('inventory:write') && 'requests', can('purchasing:manage') && 'purchase_orders', can('transfers:manage') && 'transfers', can('purchasing:manage') && 'returns', 'ledger'].filter(Boolean)} active={tab} onChange={setTab} />
      {tab === 'parts' && <Parts />}
      {tab === 'requests' && <Requests />}
      {tab === 'purchase_orders' && <PurchaseOrders />}
      {tab === 'transfers' && <Transfers />}
      {tab === 'returns' && <VendorReturns />}
      {tab === 'ledger' && <Ledger />}
      <Alert tone="info">Stock never goes below the quantity reserved for repair orders; every change is recorded in the ledger.</Alert>
    </>
  );
};
