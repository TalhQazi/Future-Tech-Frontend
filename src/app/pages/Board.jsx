import React, { useState } from 'react';
import { Plus, ShieldAlert } from 'lucide-react';
import { api } from '../../api/client.js';
import { navigate } from '../../router.js';
import { useAuth } from '../auth.jsx';
import { useWorkspace } from '../Shell.jsx';
import { PageHeader, Button, Input, Async, useAsync, StatusPill, Badge, Table, Tabs, vehicleName, dt, label } from '../ui.jsx';

const COLUMNS = ['checked_in', 'inspecting', 'diagnosing', 'awaiting_approval', 'approved', 'in_progress', 'waiting_parts', 'quality_check', 'ready_for_pickup'];

export const Board = () => {
  const { can } = useAuth();
  const { locationId } = useWorkspace();
  const [view, setView] = useState('board');
  const [q, setQ] = useState('');
  const s = useAsync(() => api.get('/repair-orders', { locationId, open: view === 'board' ? 'true' : undefined, q, limit: 100 }).then(r => r.repairOrders), [locationId, view, q]);

  return (
    <>
      <PageHeader title="Repair orders" subtitle="Live shop board" actions={
        <>
          <Input placeholder="Search RO number" value={q} onChange={e => setQ(e.target.value)} style={{ width: 200 }} />
          {can('ros:write') && <Button variant="primary" onClick={() => navigate('#/app/check-in')}><Plus size={15} />Check in</Button>}
        </>
      } />
      <Tabs tabs={[{ key: 'board', label: 'Board' }, { key: 'all', label: 'All repair orders' }]} active={view} onChange={setView} />
      <Async state={s}>{rows => (view === 'board' ? (
        <div className="ft-board">
          {COLUMNS.map(col => {
            const items = rows.filter(r => r.status === col);
            return (
              <div key={col} className="ft-col">
                <div className="ft-col-head"><span>{label(col)}</span><span>{items.length}</span></div>
                {items.map(r => (
                  <button key={r.id} type="button" className="ft-ro-card" onClick={() => navigate(`#/app/ro/${r.id}`)}>
                    <div className="row between"><span className="mono small">{r.roNumber}</span>{r.priority !== 'normal' && <Badge tone="danger">{r.priority}</Badge>}</div>
                    <strong>{vehicleName(r.vehicle)}</strong>
                    <span className="muted small">{r.customer?.name}</span>
                    <div className="row wrap small">
                      {r.assignedTech ? <Badge>{r.assignedTech.name}</Badge> : <Badge tone="warn">Unassigned</Badge>}
                      {r.openSafetyEscalations > 0 && <Badge tone="danger"><ShieldAlert size={11} />Safety</Badge>}
                      {r.waiter && <Badge tone="info">Waiting</Badge>}
                    </div>
                    {r.promisedAt && <span className="faint small">Promised {dt(r.promisedAt)}</span>}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <Table rows={rows} onRowClick={r => navigate(`#/app/ro/${r.id}`)} columns={[
          { label: 'RO', render: r => <span className="mono">{r.roNumber}</span> },
          { label: 'Vehicle', render: r => vehicleName(r.vehicle) },
          { label: 'Customer', render: r => r.customer?.name },
          { label: 'Technician', render: r => r.assignedTech?.name || '—' },
          { label: 'Status', render: r => <StatusPill status={r.status} /> },
          { label: 'Invoice', render: r => (r.invoice ? <StatusPill status={r.invoice.paymentStatus} /> : '—') },
          { label: 'Opened', render: r => dt(r.createdAt) }
        ]} />
      ))}</Async>
    </>
  );
};
