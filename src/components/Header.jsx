import React from 'react';
import { useShop } from '../context/ShopContext.jsx';
import { BrandLogo } from './BrandLogo.jsx';
import {
  Wrench,
  Car,
  UserCheck,
  ShieldAlert,
  Plus,
  ArrowLeft
} from 'lucide-react';

const roles = [
  { id: 'advisor', label: 'Service Advisor', short: 'Advisor', icon: UserCheck },
  { id: 'technician', label: 'Technician Bay', short: 'Technician', icon: Wrench },
  { id: 'manager', label: 'Shop Manager', short: 'Manager', icon: ShieldAlert },
  { id: 'customer', label: 'Customer Portal', short: 'Customer', icon: Car },
];

export const Header = ({ onOpenCheckIn }) => {
  const { currentUser, switchRole, scanToolStatus } = useShop();

  return (
    <header className="app-header">
      <div className="app-header__inner">
        {/* Brand with the official FutureTech shield logo */}
        <a href="#/" className="app-brand" aria-label="FutureTech — back to the website">
          <BrandLogo className="app-brand__logo" priority />
          <span className="app-brand__text">
            <span className="app-brand__name">FutureTech</span>
            <span className="app-brand__sub">Shop OS 2.0 · Membership Auto</span>
          </span>
        </a>

        {/* Live OBD telemetry indicator */}
        <div className="app-status" title={scanToolStatus?.device}>
          <span className="live-dot" aria-hidden="true" />
          <span>OBD-II link: <strong>{scanToolStatus?.connected ? 'Active (CAN 500k)' : 'Offline'}</strong></span>
        </div>

        <div className="app-header__actions">
          {/* Role switcher */}
          <nav className="seg" aria-label="Switch workspace">
            {roles.map((r) => {
              const Icon = r.icon;
              const active = currentUser.role === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  className="seg__btn"
                  aria-pressed={active}
                  onClick={() => !active && switchRole(r.id)}
                  title={r.label}
                >
                  <Icon size={14} aria-hidden="true" />
                  <span className="seg__label-long">{r.label}</span>
                  <span className="seg__label-short">{r.short}</span>
                </button>
              );
            })}
          </nav>

          {/* New Repair Order (Advisor/Manager) */}
          {(currentUser.role === 'advisor' || currentUser.role === 'manager') && (
            <button type="button" onClick={onOpenCheckIn} className="btn btn-primary">
              <Plus size={16} aria-hidden="true" />
              <span>Check In Car</span>
            </button>
          )}

          <a href="#/" className="app-header__site-link">
            <ArrowLeft size={15} aria-hidden="true" />
            <span>Website</span>
          </a>
        </div>
      </div>
    </header>
  );
};
