import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard, ClipboardList, Calendar, Users, Car, Wrench, Truck, Package, Receipt, Heart, MessageSquare,
  Cpu, BookOpen, CheckCircle2, BarChart3, Settings, Bell, LogOut, Menu, UserCircle, Activity, Gauge, MessagesSquare,
  Crown, Search, Plus, Boxes
} from 'lucide-react';
import { api } from '../api/client.js';
import { navigate } from '../router.js';
import { useAuth } from './auth.jsx';
import { Button, Badge, Drawer, Empty, dt, useAsync, vehicleName } from './ui.jsx';
import { useOfflineQueue } from './offline.js';

const WorkspaceCtx = createContext(null);
export const useWorkspace = () => useContext(WorkspaceCtx);

// Top navigation (as in the FutureTech OS concept); every item is permission-filtered.
const TOP = [
  { key: '', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'customers', label: 'Customers', icon: Users, perm: 'customers:read' },
  { key: 'board', label: 'Repair Orders', icon: ClipboardList, perm: 'ros:read', also: ['ro', 'check-in'] },
  { key: 'appointments', label: 'Appointments', icon: Calendar, perm: 'appointments:read' },
  { key: 'devices', label: 'Diagnostics', icon: Activity, perm: 'diagnostics:read' },
  { key: 'parts-intel', label: 'Parts', icon: Boxes, perm: 'parts_intel:read' },
  { key: 'inventory', label: 'Inventory', icon: Package, perm: 'inventory:read' },
  { key: 'memberships', label: 'Memberships', icon: Crown, perm: 'memberships:read' },
  { key: 'analytics', label: 'Reports', icon: BarChart3, perm: 'analytics:location' },
  { key: 'admin', label: 'Settings', icon: Settings, anyPerm: ['users:manage', 'catalog:manage', 'corporate:manage', 'audit:read'] }
];

const NAV = [
  { group: 'Operations' },
  { key: '', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'customers', label: 'Customers & vehicles', icon: Users, perm: 'customers:read', also: ['vehicles'] },
  { key: 'board', label: 'Repair orders', icon: ClipboardList, perm: 'ros:read', also: ['ro'] },
  { key: 'work', label: 'My work', icon: Wrench, perm: 'jobs:execute' },
  { key: 'dispatch', label: 'Dispatch', icon: Truck, perm: 'ros:dispatch' },
  { key: 'appointments', label: 'Appointments', icon: Calendar, perm: 'appointments:read' },
  { key: 'messages', label: 'Messages', icon: MessageSquare, perm: 'messages:read' },
  { group: 'Business' },
  { key: 'inventory', label: 'Parts & inventory', icon: Package, perm: 'inventory:read' },
  { key: 'accounting', label: 'Invoices & payments', icon: Receipt, perm: 'invoices:read' },
  { key: 'memberships', label: 'Memberships', icon: Heart, perm: 'memberships:read' },
  { key: 'intelligence', label: 'Membership Auto', icon: Crown, perm: 'economics:location' },
  { key: 'analytics', label: 'Reports', icon: BarChart3, perm: 'analytics:location' },
  { group: 'FutureTech' },
  { key: 'techdata', label: 'Technical data', icon: BookOpen, perm: 'techdata:read' },
  { key: 'fixes', label: 'Confirmed fixes', icon: CheckCircle2, perm: 'fixes:read' },
  { key: 'parts-intel', label: 'Parts intelligence', icon: Activity, perm: 'parts_intel:read' },
  { key: 'devices', label: 'Diagnostics & AutoMind', icon: Cpu, perm: 'diagnostics:read' },
  { key: 'predictive', label: 'Predictive', icon: Gauge, perm: 'predictive:read' },
  { key: 'forum', label: 'Technician forum', icon: MessagesSquare, perm: 'forum:read' },
  { group: 'Administration', anyPerm: ['users:manage', 'catalog:manage', 'corporate:manage', 'audit:read'] },
  { key: 'admin', label: 'Settings', icon: Settings, anyPerm: ['users:manage', 'catalog:manage', 'corporate:manage', 'audit:read'] },
  { key: 'account', label: 'My account', icon: UserCircle }
];

const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('') || '?';

// Searches customers, vehicles and repair orders the user is allowed to read.
const GlobalSearch = () => {
  const { can } = useAuth();
  const [q, setQ] = useState('');
  const [res, setRes] = useState(null);
  useEffect(() => {
    if (q.trim().length < 2) { setRes(null); return undefined; }
    const t = setTimeout(async () => {
      const [customers, vehicles, ros] = await Promise.all([
        can('customers:read') ? api.get('/customers', { q, limit: 5 }).then(r => r.customers).catch(() => []) : [],
        can('vehicles:read') ? api.get('/vehicles', { q, limit: 5 }).then(r => r.vehicles).catch(() => []) : [],
        can('ros:read') ? api.get('/repair-orders', { q, limit: 5 }).then(r => r.repairOrders).catch(() => []) : []
      ]);
      setRes({ customers, vehicles, ros });
    }, 250);
    return () => clearTimeout(t);
  }, [q, can]);
  const go = (hash) => { setQ(''); setRes(null); navigate(hash); };
  const empty = res && !res.customers.length && !res.vehicles.length && !res.ros.length;
  return (
    <div className="ft-search">
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search customers, vehicles, RO's…" aria-label="Search customers, vehicles and repair orders" onBlur={() => setTimeout(() => setRes(null), 200)} />
      <Search size={15} className="ico" />
      {res && (
        <div className="ft-search-results">
          {empty && <div className="small muted" style={{ padding: 8 }}>No matches</div>}
          {res.ros.length > 0 && <div className="grp">Repair orders</div>}
          {res.ros.map(r => <button key={r.id} onMouseDown={() => go(`#/app/ro/${r.id}`)}><strong className="mono">{r.roNumber}</strong> · {vehicleName(r.vehicle)} <span className="faint">{r.customer?.name}</span></button>)}
          {res.customers.length > 0 && <div className="grp">Customers</div>}
          {res.customers.map(c => <button key={c.id} onMouseDown={() => go(`#/app/customers/${c.id}`)}><strong>{c.name}</strong> <span className="faint">{c.phone}</span></button>)}
          {res.vehicles.length > 0 && <div className="grp">Vehicles</div>}
          {res.vehicles.map(v => <button key={v.id} onMouseDown={() => go(`#/app/vehicles/${v.id}`)}><strong>{vehicleName(v)}</strong> <span className="faint mono">{v.vin || v.licensePlate}</span></button>)}
        </div>
      )}
    </div>
  );
};

const RecentRos = ({ locationId }) => {
  const s = useAsync(() => api.get('/repair-orders', { limit: 5, locationId }).then(r => r.repairOrders).catch(() => []), [locationId]);
  if (!s.data?.length) return null;
  return (
    <div className="ft-recent">
      <h4>Recent RO's</h4>
      {s.data.map(r => <a key={r.id} href={`#/app/ro/${r.id}`}><span className="mono">{r.roNumber}</span><span className="truncate">{r.vehicle?.model || '—'}</span><span className="faint">{new Date(r.updatedAt || r.createdAt).toLocaleDateString([], { month: '2-digit', day: '2-digit' })}</span></a>)}
    </div>
  );
};

export const Shell = ({ section, children }) => {
  const { user, logout, can } = useAuth();
  const [open, setOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [quick, setQuick] = useState('');
  const locations = useAsync(() => api.get('/locations').then(r => r.locations), []);
  const [locationId, setLocationIdState] = useState(() => localStorage.getItem('ft_location') || '');
  const notes = useAsync(() => api.get('/notifications', { limit: 30 }), [notesOpen]);
  const offline = useOfflineQueue();

  const allowed = (locations.data || []).filter(l => ['admin', 'executive'].includes(user.role) || user.locationIds.includes(l.id));
  const location = allowed.find(l => l.id === locationId) || allowed.find(l => l.id === user.primaryLocationId) || allowed[0] || null;
  const setLocationId = (id) => { localStorage.setItem('ft_location', id); setLocationIdState(id); };

  const reloadNotes = notes.reload;
  useEffect(() => {
    const t = setInterval(reloadNotes, 60000);
    return () => clearInterval(t);
  }, [reloadNotes]);

  const ok = (n) => (!n.perm || can(n.perm)) && (!n.anyPerm || n.anyPerm.some(can));
  const isActive = (n) => section === n.key || n.also?.includes(section);
  const items = NAV.filter(ok);
  const value = useMemo(() => ({ location, locationId: location?.id, locations: allowed, setLocationId }), [location, allowed]);
  const unread = notes.data?.unreadCount || 0;

  return (
    <WorkspaceCtx.Provider value={value}>
      <div className="ft">
        <a href="#ft-main" className="skip-link">Skip to content</a>
        <header className="ft-topbar">
          <Button variant="ghost" className="ft-menu-btn" onClick={() => setOpen(o => !o)} aria-label="Open menu"><Menu size={18} /></Button>
          <a className="ft-logo" href="#/app">
            <img src="/brand/futuretech-logo-sm.webp" alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <div><strong>FUTURETECH<span>OS</span></strong><small>MEMBERSHIP AUTO INTELLIGENCE</small></div>
          </a>
          <nav className="ft-topnav" aria-label="Main">
            {TOP.filter(ok).map(n => <a key={n.key} href={`#/app/${n.key}`} className={isActive(n) ? 'active' : ''}><n.icon size={20} />{n.label}</a>)}
          </nav>
          <div className="ft-topbar-tools">
            <GlobalSearch />
            {allowed.length > 1 && (
              <select aria-label="Location" value={location?.id || ''} onChange={e => setLocationId(e.target.value)}>
                {allowed.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            )}
            {offline.pending > 0 && <span className="ft-sync"><span className={`ft-dot ${offline.online ? 'warn' : 'danger'}`} />{offline.pending} to sync</span>}
            {offline.failed > 0 && <Button size="sm" variant="danger" onClick={() => navigate('#/app/account')}>{offline.failed} sync error(s)</Button>}
            <Button variant="ghost" className="ft-bell" onClick={() => setNotesOpen(true)} aria-label={`Notifications (${unread} unread)`}><Bell size={18} />{unread > 0 && <Badge tone="danger">{unread}</Badge>}</Button>
            <a className="ft-user" href="#/app/account" title={`${user.name} · ${user.role}`}><span className="ft-avatar">{initials(user.name)}</span><span>{user.name.split(' ')[0]}</span></a>
            <Button variant="ghost" onClick={logout} aria-label="Sign out"><LogOut size={16} /></Button>
          </div>
        </header>
        <div className="ft-shell">
          <aside className={`ft-side ${open ? 'open' : ''}`} onClick={() => setOpen(false)}>
            {can('ros:write') && <a className="ft-newro" href="#/app/check-in"><Plus size={18} />New RO</a>}
            <nav className="ft-nav" aria-label="Workspace">
              {items.map((n, i) => (n.group
                ? <div key={`g${i}`} className="ft-nav-group">{n.group}</div>
                : <a key={`${n.key}${i}`} href={`#/app/${n.key}`} className={isActive(n) ? 'active' : ''}><n.icon size={16} />{n.label}</a>))}
            </nav>
            {can('ros:read') && (
              <form className="ft-quick" onClick={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); if (quick.trim()) { navigate(`#/app/ro/${encodeURIComponent(quick.trim())}`); setQuick(''); } }}>
                <Search size={14} /><input value={quick} onChange={e => setQuick(e.target.value)} placeholder="Quick search RO #" aria-label="Open repair order by number" />
              </form>
            )}
            {can('ros:read') && <RecentRos locationId={location?.id} />}
            <div className="grow" />
            <div className="small faint" style={{ padding: '0 6px' }}>{location?.name}<br />{user.name} · {user.role}</div>
          </aside>
          <div className="ft-main">
            <main id="ft-main" className="ft-content">
              {allowed.length === 0 && !locations.loading && !['admin', 'executive'].includes(user.role)
                ? <Empty title="No location assigned" hint="Ask a manager to assign you to a location." />
                : children}
            </main>
          </div>
        </div>
        <Drawer open={notesOpen} title="Notifications" onClose={() => setNotesOpen(false)}>
          <div className="row between"><span className="muted small">{unread} unread</span><Button size="sm" onClick={async () => { await api.post('/notifications/read-all'); notes.reload(); }}>Mark all read</Button></div>
          {(notes.data?.notifications || []).length === 0 && <Empty title="No notifications" />}
          {(notes.data?.notifications || []).map(n => (
            <a key={n.id} href={n.link || '#/app'} onClick={async () => { setNotesOpen(false); if (!n.readAt) await api.post(`/notifications/${n.id}/read`); }}
              className="ft-card" style={{ display: 'grid', gap: 4, textDecoration: 'none', color: 'inherit', opacity: n.readAt ? 0.65 : 1, borderColor: n.severity === 'critical' ? 'rgba(220,38,38,.5)' : undefined }}>
              <strong>{n.title}</strong>{n.body && <span className="muted small">{n.body}</span>}<span className="faint small">{dt(n.createdAt)}</span>
            </a>
          ))}
        </Drawer>
      </div>
    </WorkspaceCtx.Provider>
  );
};
