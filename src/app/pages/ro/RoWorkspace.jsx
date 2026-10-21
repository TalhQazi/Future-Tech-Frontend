import React, { useState } from 'react';
import { api } from '../../../api/client.js';
import { useAuth } from '../../auth.jsx';
import { Tabs, Async, useAsync, Button } from '../../ui.jsx';
import { VehicleBar } from '../../shared.jsx';
import { OverviewTab } from './OverviewTab.jsx';
import { InspectionTab } from './InspectionTab.jsx';
import { DiagnosticsTab } from './DiagnosticsTab.jsx';
import { EstimateTab } from './EstimateTab.jsx';
import { WorkTab } from './WorkTab.jsx';
import { InvoiceTab } from './InvoiceTab.jsx';
import { RoMessages } from './RoMessages.jsx';

export const RoWorkspace = ({ id, query }) => {
  const { can } = useAuth();
  const [tab, setTab] = useState(query?.tab || 'overview');
  const s = useAsync(() => api.get(`/repair-orders/${id}`).then(r => r.repairOrder), [id]);
  const tabs = [
    'overview',
    can('inspections:read') && 'inspection',
    can('diagnostics:read') && 'diagnostics',
    can('estimates:read') && 'estimate',
    'work',
    can('invoices:read') && 'invoice',
    can('messages:read') && 'messages'
  ].filter(Boolean);

  return (
    <Async state={s}>{ro => (
      <>
        <div className="row between"><a href="#/app/board" className="small">← Repair orders</a><Button size="sm" variant="ghost" onClick={s.reload}>Refresh</Button></div>
        <VehicleBar ro={ro} />
        <Tabs tabs={tabs} active={tab} onChange={setTab} />
        {tab === 'overview' && <OverviewTab ro={ro} reload={s.reload} setRo={s.setData} />}
        {tab === 'inspection' && <InspectionTab ro={ro} reloadRo={s.reload} />}
        {tab === 'diagnostics' && <DiagnosticsTab ro={ro} />}
        {tab === 'estimate' && <EstimateTab ro={ro} reloadRo={s.reload} />}
        {tab === 'work' && <WorkTab ro={ro} setRo={s.setData} reload={s.reload} />}
        {tab === 'invoice' && <InvoiceTab ro={ro} reloadRo={s.reload} />}
        {tab === 'messages' && <RoMessages ro={ro} />}
      </>
    )}</Async>
  );
};
