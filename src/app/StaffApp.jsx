import React from 'react';
import { Shell } from './Shell.jsx';
import { useAuth } from './auth.jsx';
import { Empty } from './ui.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { Board } from './pages/Board.jsx';
import { CheckIn } from './pages/CheckIn.jsx';
import { RoWorkspace } from './pages/ro/RoWorkspace.jsx';
import { Customers, VehicleDetail } from './pages/Crm.jsx';
import { Appointments, MyWork, Dispatch } from './pages/Scheduling.jsx';
import { Inventory } from './pages/Inventory.jsx';
import { Accounting } from './pages/Accounting.jsx';
import { Memberships, Messages, Analytics, Account } from './pages/Business.jsx';
import { TechData, Fixes, PartsIntel, Devices, Predictive, Forum } from './pages/FutureTech.jsx';
import { Admin } from './pages/Admin.jsx';
import { Intelligence } from './pages/Intelligence.jsx';

const PAGES = {
  '': [Dashboard],
  board: [Board, 'ros:read'],
  'check-in': [CheckIn, 'ros:write'],
  ro: [RoWorkspace, 'ros:read'],
  work: [MyWork, 'jobs:execute'],
  dispatch: [Dispatch, 'ros:dispatch'],
  appointments: [Appointments, 'appointments:read'],
  customers: [Customers, 'customers:read'],
  vehicles: [VehicleDetail, 'vehicles:read'],
  messages: [Messages, 'messages:read'],
  inventory: [Inventory, 'inventory:read'],
  accounting: [Accounting, 'invoices:read'],
  memberships: [Memberships, 'memberships:read'],
  analytics: [Analytics, 'analytics:location'],
  intelligence: [Intelligence, 'economics:location'],
  techdata: [TechData, 'techdata:read'],
  fixes: [Fixes, 'fixes:read'],
  'parts-intel': [PartsIntel, 'parts_intel:read'],
  devices: [Devices, 'diagnostics:read'],
  predictive: [Predictive, 'predictive:read'],
  forum: [Forum, 'forum:read'],
  admin: [Admin],
  account: [Account]
};

export const StaffApp = ({ route }) => {
  const { can } = useAuth();
  const [section = '', id] = route.path;
  const [Page, perm] = PAGES[section] || [];
  return (
    <Shell section={section}>
      {!Page ? <Empty title="Page not found" /> : perm && !can(perm) ? <Empty title="You do not have access to this area" /> : <Page key={`${section}/${id || ''}`} id={id} sub={route.path[2]} query={route.query} />}
    </Shell>
  );
};
