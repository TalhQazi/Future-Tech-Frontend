import React, { useRef, useState } from 'react';
import { ArrowUpRight, Check, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { ROLES } from './content.js';
import { appHref } from '../router.js';

/* ---- Role previews (decorative) ---------------------------------------- */

const AdvisorPreview = () => (
  <div className="wp-board">
    {[
      { col: 'In Inspection', ro: 'RO-2026-082', car: '2021 Ford F-150 PowerBoost', tone: 'attn' },
      { col: 'Estimate Pending', ro: 'RO-2026-083', car: '2020 Toyota RAV4 Hybrid', tone: 'cyan' },
      { col: 'Authorized / Bay', ro: 'RO-2026-081', car: '2022 Audi Q7 3.0T', tone: 'ok' },
      { col: 'Ready for Pay', ro: 'RO-2026-084', car: '2023 Tesla Model Y', tone: 'violet' }
    ].map((c) => (
      <div className="wp-board__col" key={c.ro}>
        <span className={`wp-board__head is-${c.tone}`}>{c.col}</span>
        <div className="wp-board__card">
          <strong>{c.ro}</strong>
          <span>{c.car}</span>
        </div>
      </div>
    ))}
  </div>
);

const TechnicianPreview = () => (
  <ul className="wp-dvi">
    {[
      { name: 'Ignition System & Coil Packs', status: 'fail' },
      { name: 'Tire Tread Depth & Condition', status: 'attention' },
      { name: '12V AGM & 48V Hybrid Battery', status: 'pass' }
    ].map((item) => (
      <li key={item.name}>
        <span className="wp-dvi__name">{item.name}</span>
        <span className="wp-dvi__btns">
          <span className={item.status === 'pass' ? 'is-pass' : ''}><CheckCircle2 size={13} aria-hidden="true" />Pass</span>
          <span className={item.status === 'attention' ? 'is-attn' : ''}><AlertTriangle size={13} aria-hidden="true" />Caution</span>
          <span className={item.status === 'fail' ? 'is-fail' : ''}><XCircle size={13} aria-hidden="true" />Fail</span>
        </span>
      </li>
    ))}
  </ul>
);

const ManagerPreview = () => (
  <div className="wp-mgr">
    <div className="wp-mgr__kpis">
      {['Active jobs', 'Pending checkout', 'Completed'].map((k, i) => (
        <div key={k} style={{ '--k': i }}>
          <span>{k}</span>
          <i />
        </div>
      ))}
    </div>
    <ul className="wp-mgr__roster">
      {[
        ['Master Diagnostics', 78],
        ['Suspension & Alignment', 42],
        ['EV & High Voltage', 56]
      ].map(([title, w]) => (
        <li key={title}>
          <span>{title}</span>
          <span className="wp-mgr__bar"><span style={{ '--w': `${w}%` }} /></span>
        </li>
      ))}
    </ul>
  </div>
);

const STEPS = ['Check-In', 'Digital Inspection', 'Estimate & Approval', 'Service In Progress', 'Ready for Pickup'];

const CustomerPreview = () => (
  <div className="wp-cust">
    <ol className="wp-steps">
      {STEPS.map((s, i) => (
        <li key={s} className={i < 4 ? 'is-done' : ''}>
          <span>{i < 4 ? <Check size={11} aria-hidden="true" /> : i + 1}</span>
          <em>{s}</em>
        </li>
      ))}
    </ol>
    <ul className="wp-lines">
      <li><span>Front Ceramic Brake Pad Set</span><b>$185.00</b><span className="hv-chip hv-chip--ok"><Check size={12} aria-hidden="true" />Approved</span></li>
      <li className="is-declined"><span>4-Wheel Laser Alignment</span><b>$210.00</b><span className="hv-chip hv-chip--no">Declined</span></li>
    </ul>
  </div>
);

const PREVIEWS = {
  advisor: AdvisorPreview,
  technician: TechnicianPreview,
  manager: ManagerPreview,
  customer: CustomerPreview
};

export const Workspaces = () => {
  const [selected, setSelected] = useState(ROLES[0].id);
  const tabRefs = useRef({});

  const onKeyDown = (e, index) => {
    const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    let next = null;
    if (keys[e.key]) next = (index + keys[e.key] + ROLES.length) % ROLES.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = ROLES.length - 1;
    if (next === null) return;
    e.preventDefault();
    const id = ROLES[next].id;
    setSelected(id);
    tabRefs.current[id]?.focus();
  };

  return (
    <section id="workspaces" className="sec sec--dark workspaces" aria-labelledby="workspaces-title">
      <div className="workspaces__glow" aria-hidden="true" />
      <div className="container">
        <header className="sec-head sec-head--center">
          <p className="eyebrow" data-reveal>Workspaces</p>
          <h2 id="workspaces-title" className="h2" data-reveal style={{ '--d': 1 }}>
            Four seats. One source of truth.
          </h2>
          <p className="sec-head__lead" data-reveal style={{ '--d': 2 }}>
            Switch roles with one click — every workspace reads and writes the same repair order.
          </p>
        </header>

        <div className="ws" data-reveal style={{ '--d': 1 }}>
          <div className="ws__tabs" role="tablist" aria-label="FutureTech workspaces">
            {ROLES.map((role, i) => {
              const Icon = role.icon;
              const isSel = role.id === selected;
              return (
                <button
                  key={role.id}
                  ref={(el) => { tabRefs.current[role.id] = el; }}
                  type="button"
                  role="tab"
                  id={`ws-tab-${role.id}`}
                  aria-selected={isSel}
                  aria-controls={`ws-panel-${role.id}`}
                  tabIndex={isSel ? 0 : -1}
                  className="ws__tab"
                  onClick={() => setSelected(role.id)}
                  onKeyDown={(e) => onKeyDown(e, i)}
                >
                  <span className="ws__tab-icon" aria-hidden="true"><Icon size={18} /></span>
                  <span className="ws__tab-label">{role.label}</span>
                  <span className="ws__tab-num" aria-hidden="true">0{i + 1}</span>
                </button>
              );
            })}
          </div>

          {ROLES.map((role) => {
            const Preview = PREVIEWS[role.id];
            return (
              <div
                key={role.id}
                role="tabpanel"
                id={`ws-panel-${role.id}`}
                aria-labelledby={`ws-tab-${role.id}`}
                className="ws__panel"
                hidden={role.id !== selected}
                tabIndex={0}
              >
                <div className="ws__copy">
                  <h3 className="ws__title">{role.title}</h3>
                  <p className="ws__summary">{role.summary}</p>
                  <ul className="ws__points">
                    {role.points.map((pt) => (
                      <li key={pt}>
                        <span className="ws__tick" aria-hidden="true"><Check size={12} /></span>
                        {pt}
                      </li>
                    ))}
                  </ul>
                  <a href={appHref(role.id)} className="ft-btn ft-btn--primary">
                    <span>{role.cta}</span>
                    <ArrowUpRight size={17} aria-hidden="true" />
                  </a>
                </div>

                <div className="ws__window" aria-hidden="true">
                  <div className="ws__chrome">
                    <span /><span /><span />
                    <em>Shop OS · {role.label}</em>
                  </div>
                  <div className="ws__screen">
                    <Preview />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
