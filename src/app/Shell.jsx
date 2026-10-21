import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard, ClipboardList, Calendar, Users, Car, Wrench, Truck, Package, Receipt, Heart, MessageSquare,
  Cpu, BookOpen, CheckCircle2, BarChart3, Settings, Bell, LogOut, Menu, UserCircle, Activity, Gauge, MessagesSquare
} from 'lucide-react';
import { api } from '../api/client.js';
import { navigate } from '../router.js';
import { useAuth } from './auth.jsx';
import { Button, Badge, Drawer, Empty, dt, useAsync } from './ui.jsx';
import { useOfflineQueue } from './offline.js';

const WorkspaceCtx = createContext(null);
export const useWorkspace = () => useContext(WorkspaceCtx);

const NAV = [
  { group: 'Operations' },
  { key: '', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'board', label: 'Repair orders', icon: ClipboardList, perm: 'ros:read' },
  { key: 'work', label: 'My work', icon: Wrench, perm: 'jobs:execute' },
  { key: 'dispatch', label: 'Dispatch', icon: Truck, perm: 'ros:dispatch' },
  { key: 'appointments', label: 'Appointments', icon: Calendar, perm: 'appointments:read' },
  { key: 'customers', label: 'Customers & vehicles', icon: Users, perm: 'customers:read' },
  { key: 'messages', label: 'Messages', icon: MessageSquare, perm: 'messages:read' },
  { group: 'Business' },
  { key: 'inventory', label: 'Parts & inventory', icon: Package, perm: 'inventory:read' },
  { key: 'accounting', label: 'Invoices & payments', icon: Receipt, perm: 'invoices:read' },
  { key: 'memberships', label: 'Memberships', icon: Heart, perm: 'memberships:read' },
  { key: 'analytics', label: 'Analytics', icon: BarChart3, perm: 'analytics:location' },
  { group: 'FutureTech' },
  { key: 'techdata', label: 'Technical data', icon: BookOpen, perm: 'techdata:read' },
  { key: 'fixes', label: 'Confirmed fixes', icon: CheckCircle2, perm: 'fixes:read' },
  { key: 'parts-intel', label: 'Parts intelligence', icon: Activity, perm: 'parts_intel:read' },
  { key: 'devices', label: 'AutoMind devices', icon: Cpu, perm: 'diagnostics:read' },
  { key: 'predictive', label: 'Predictive', icon: Gauge, perm: 'predictive:read' },
  { key: 'forum', label: 'Technician forum', icon: MessagesSquare, perm: 'forum:read' },
  { group: 'Administration', anyPerm: ['users:manage', 'catalog:manage', 'corporate:manage', 'audit:read'] },
  { key: 'admin', label: 'Administration', icon: Settings, anyPerm: ['users:manage', 'catalog:manage', 'corporate:manage', 'audit:read'] },
  { key: 'account', label: 'My account', icon: UserCircle }
];

export const Shell = ({ section, children }) => {
  const { user, logout, can } = useAuth();
  const [open, setOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const locations = useAsync(() => api.get('/locations').then(r => r.locations), []);
  const [locationId, setLocationIdState] = useState(() => localStorage.getItem('ft_location') || '');
  const notes = useAsync(() => api.get('/notifications', { limit: 30 }), [notesOpen]);
  const offline = useOfflineQueue();

  const allowed = (locations.data || []).filter(l => user.role === 'admin' || user.locationIds.includes(l.id));
  const location = allowed.find(l => l.id === locationId) || allowed.find(l => l.id === user.primaryLocationId) || allowed[0] || null;
  const setLocationId = (id) => { localStorage.setItem('ft_location', id); setLocationIdState(id); };

  const reloadNotes = notes.reload;
  useEffect(() => {
    const t = setInterval(reloadNotes, 60000);
    return () => clearInterval(t);
  }, [reloadNotes]);

  const items = NAV.filter(n => (!n.perm || can(n.perm)) && (!n.anyPerm || n.anyPerm.some(can)));
  const value = useMemo(() => ({ location, locationId: location?.id, locations: allowed, setLocationId }), [location, allowed]);
  const unread = notes.data?.unreadCount || 0;

  return (
    <WorkspaceCtx.Provider value={value}>
      <div className="ft">
        <a href="#ft-main" className="skip-link">Skip to content</a>
        <div className="ft-shell">
          <aside className={`ft-side ${open ? 'open' : ''}`} onClick={() => setOpen(false)}>
            <div className="ft-brand"><img src="/brand/futuretech-logo-sm.webp" alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} /><span>FutureTech OS</span></div>
            <nav className="ft-nav" aria-label="Workspace">
              {items.map((n, i) => (n.group
                ? <div key={`g${i}`} className="ft-nav-group">{n.group}</div>
                : <a key={n.key} href={`#/app/${n.key}`} className={section === n.key ? 'active' : ''}><n.icon size={16} />{n.label}</a>))}
            </nav>
            <div className="grow" />
            <div className="small faint" style={{ padding: '0 10px' }}>{user.name}<br />{user.role}</div>
          </aside>
          <div className="ft-main">
            <header className="ft-top">
              <Button variant="ghost" className="ft-menu-btn" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={18} /></Button>
              {allowed.length > 0 && (
                <select aria-label="Location" value={location?.id || ''} onChange={e => setLocationId(e.target.value)} style={{ width: 'auto', maxWidth: 260 }}>
                  {allowed.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              )}
              <div className="grow" />
              {offline.pending > 0 && <span className="ft-sync"><span className={`ft-dot ${offline.online ? 'warn' : 'danger'}`} />{offline.pending} change(s) waiting to sync{offline.online ? '' : ' (offline)'}</span>}
              {offline.failed > 0 && <Button size="sm" variant="danger" onClick={() => navigate('#/app/account')}>{offline.failed} sync error(s)</Button>}
              <Button variant="ghost" onClick={() => setNotesOpen(true)} aria-label={`Notifications (${unread} unread)`}><Bell size={17} />{unread > 0 && <Badge tone="danger">{unread}</Badge>}</Button>
              <Button variant="ghost" onClick={logout} aria-label="Sign out"><LogOut size={16} /></Button>
            </header>
            <main id="ft-main" className="ft-content">
              {allowed.length === 0 && !locations.loading && user.role !== 'admin'
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
              className="ft-card" style={{ display: 'grid', gap: 4, textDecoration: 'none', color: 'inherit', opacity: n.readAt ? 0.65 : 1, borderColor: n.severity === 'critical' ? 'rgba(239,91,108,.5)' : undefined }}>
              <strong>{n.title}</strong>{n.body && <span className="muted small">{n.body}</span>}<span className="faint small">{dt(n.createdAt)}</span>
            </a>
          ))}
        </Drawer>
      </div>
    </WorkspaceCtx.Provider>
  );
};
