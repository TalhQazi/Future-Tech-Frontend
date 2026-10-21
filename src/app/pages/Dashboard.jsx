import React from 'react';
import { Plus } from 'lucide-react';
import { api } from '../../api/client.js';
import { navigate } from '../../router.js';
import { useAuth } from '../auth.jsx';
import { useWorkspace } from '../Shell.jsx';
import { Card, PageHeader, Stat, Table, StatusPill, Button, Async, useAsync, money, dt, vehicleName, Empty } from '../ui.jsx';

const today = () => new Date().toISOString().slice(0, 10);

const RoList = ({ query, empty }) => {
  const s = useAsync(() => api.get('/repair-orders', { limit: 12, ...query }).then(r => r.repairOrders), [JSON.stringify(query)]);
  return (
    <Async state={s}>{rows => (
      <Table rows={rows} empty={empty} onRowClick={r => navigate(`#/app/ro/${r.id}`)} columns={[
        { label: 'RO', render: r => <span className="mono">{r.roNumber}</span> },
        { label: 'Vehicle', render: r => vehicleName(r.vehicle) },
        { label: 'Customer', render: r => r.customer?.name },
        { label: 'Status', render: r => <StatusPill status={r.status} /> },
        { label: 'Promised', render: r => (r.promisedAt ? dt(r.promisedAt) : '—') }
      ]} />
    )}</Async>
  );
};

export const Dashboard = () => {
  const { user, can } = useAuth();
  const { locationId, location } = useWorkspace();
  const kpis = useAsync(() => (can('analytics:location') && locationId ? api.get('/analytics/dashboard', { locationId }) : Promise.resolve(null)), [locationId]);
  const appts = useAsync(() => (can('appointments:read') && locationId ? api.get('/appointments', { locationId, date: today() }).then(r => r.appointments) : Promise.resolve([])), [locationId]);
  const requests = useAsync(() => (can('inventory:read') && locationId ? api.get('/part-requests', { locationId, status: 'requested,sourcing,ordered,received' }).then(r => r.partRequests) : Promise.resolve([])), [locationId]);
  const unpaid = useAsync(() => (can('invoices:read') && locationId ? api.get('/invoices', { locationId, paymentStatus: 'unpaid,partial', status: 'posted', limit: 10 }).then(r => r.invoices) : Promise.resolve([])), [locationId]);
  const k = kpis.data?.kpis;

  return (
    <>
      <PageHeader title={`Good ${new Date().getHours() < 12 ? 'morning' : 'afternoon'}, ${user.name.split(' ')[0]}`} subtitle={location ? `${location.name} · ${new Date().toLocaleDateString([], { dateStyle: 'full' })}` : undefined}
        actions={can('ros:write') && <Button variant="primary" onClick={() => navigate('#/app/check-in')}><Plus size={15} />Check in vehicle</Button>} />

      {k && (
        <div className="grid-4">
          <Stat label="Revenue (30 days)" value={money(k.revenueCents)} hint={`${k.invoicesPosted} invoices · ARO ${money(k.averageRepairOrderCents)}`} />
          <Stat label="Car count" value={k.carCount} hint="Closed repair orders" />
          <Stat label="Labor efficiency" value={k.laborEfficiencyPct != null ? `${k.laborEfficiencyPct}%` : '—'} hint={`${k.laborHoursSold} sold / ${k.laborHoursClocked} clocked hrs`} />
          <Stat label="Approval rate" value={k.approvalRateByValuePct != null ? `${k.approvalRateByValuePct}%` : '—'} hint={`Comebacks: ${k.comebacks}`} />
        </div>
      )}

      <div className="grid-2">
        {can('jobs:execute') && user.role === 'technician' && (
          <Card title="My repair orders" actions={<Button size="sm" onClick={() => navigate('#/app/work')}>Open my work</Button>}>
            <RoList query={{ techId: user.id, open: 'true', locationId }} empty="No assigned work" />
          </Card>
        )}
        {can('ros:read') && user.role !== 'technician' && (
          <Card title="Awaiting customer approval"><RoList query={{ status: 'awaiting_approval', locationId }} empty="Nothing waiting on customers" /></Card>
        )}
        {can('ros:qc') && <Card title="Ready for quality check"><RoList query={{ status: 'quality_check', locationId }} empty="QC queue is empty" /></Card>}
        {can('appointments:read') && (
          <Card title="Today's appointments" actions={<Button size="sm" onClick={() => navigate('#/app/appointments')}>Schedule</Button>}>
            <Async state={appts}>{rows => (
              <Table rows={rows} empty="No appointments today" onRowClick={() => navigate('#/app/appointments')} columns={[
                { label: 'Time', render: a => a.scheduledTime },
                { label: 'Customer', render: a => a.customer?.name },
                { label: 'Vehicle', render: a => vehicleName(a.vehicle) },
                { label: 'Status', render: a => <StatusPill status={a.status} /> }
              ]} />
            )}</Async>
          </Card>
        )}
        {can('inventory:write') && (
          <Card title="Open part requests" actions={<Button size="sm" onClick={() => navigate('#/app/inventory')}>Parts desk</Button>}>
            <Async state={requests}>{rows => (
              <Table rows={rows} empty="No open requests" columns={[
                { label: 'RO', render: r => <span className="mono">{r.roNumber}</span> },
                { label: 'Part', render: r => `${r.quantity} × ${r.description}` },
                { label: 'Urgency', render: r => <StatusPill status={r.urgency === 'urgent' ? 'urgent' : 'normal'} /> },
                { label: 'Status', render: r => <StatusPill status={r.status} /> }
              ]} />
            )}</Async>
          </Card>
        )}
        {can('payments:record') && (
          <Card title="Open balances" actions={<Button size="sm" onClick={() => navigate('#/app/accounting')}>Invoices</Button>}>
            <Async state={unpaid}>{rows => (
              <Table rows={rows} empty="No open balances" onRowClick={i => navigate(`#/app/accounting/${i.id}`)} columns={[
                { label: 'Invoice', render: i => <span className="mono">{i.invoiceNumber}</span> },
                { label: 'Customer', render: i => i.customerName },
                { label: 'Balance', right: true, render: i => money(i.balanceCents, i.currency) }
              ]} />
            )}</Async>
          </Card>
        )}
        {!can('ros:read') && !can('inventory:read') && <Empty title="Welcome" hint="Use the navigation to get started." />}
      </div>
    </>
  );
};
