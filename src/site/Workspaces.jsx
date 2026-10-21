import React, { useRef, useState, useEffect } from 'react';
import { ArrowUpRight, Check, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { ROLES } from './content.js';
import { appHref } from '../router.js';
import { api } from '../api/client.js';

/* ---- Role previews (live data from backend) ------------------------------ */

const AdvisorPreview = ({ repairOrders = [] }) => {
  const columns = [
    { col: 'In Inspection', tone: 'attn', status: 'inspection' },
    { col: 'Estimate Pending', tone: 'cyan', status: 'estimate_pending' },
    { col: 'Authorized / Bay', tone: 'ok', status: 'work_authorized' },
    { col: 'Ready for Pay', tone: 'violet', status: 'ready_for_payment' }
  ];

  return (
    <div className="wp-board">
      {columns.map((c, idx) => {
        const matchingRo = repairOrders.find(ro => ro.status === c.status || (c.status === 'work_authorized' && ro.status === 'in_progress')) || repairOrders[idx];
        const carDesc = matchingRo?.vehicle 
          ? `${matchingRo.vehicle.year} ${matchingRo.vehicle.make} ${matchingRo.vehicle.model}` 
          : (matchingRo?.vehicleSummary || 'Vehicle in Service');

        return (
          <div className="wp-board__col" key={c.col}>
            <span className={`wp-board__head is-${c.tone}`}>{c.col}</span>
            <div className="wp-board__card">
              {matchingRo ? (
                <>
                  <strong>{matchingRo.roNumber}</strong>
                  <span>{carDesc}</span>
                </>
              ) : (
                <>
                  <strong style={{ opacity: 0.5 }}>Standby</strong>
                  <span style={{ opacity: 0.5 }}>No active jobs</span>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const TechnicianPreview = ({ inspection }) => {
  const items = (inspection?.items && inspection.items.length > 0)
    ? inspection.items.slice(0, 3)
    : [];

  if (items.length === 0) {
    return (
      <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--ft-text-3)', fontSize: '0.8rem' }}>
        No active vehicle inspection in progress · Standby for vehicle dispatch
      </div>
    );
  }

  return (
    <ul className="wp-dvi">
      {items.map((item) => (
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
};

const ManagerPreview = ({ repairOrders = [] }) => {
  const activeCount = repairOrders.filter(r => ['inspection', 'work_authorized', 'in_progress'].includes(r.status)).length;
  const readyCount = repairOrders.filter(r => r.status === 'ready_for_payment').length;
  const completedCount = repairOrders.filter(r => r.status === 'completed').length;

  const kpis = [
    { label: 'Active jobs', val: activeCount },
    { label: 'Pending checkout', val: readyCount },
    { label: 'Completed', val: completedCount }
  ];

  return (
    <div className="wp-mgr">
      <div className="wp-mgr__kpis">
        {kpis.map((k, i) => (
          <div key={k.label} style={{ '--k': i }}>
            <span>{k.label} ({k.val})</span>
            <i />
          </div>
        ))}
      </div>
      <ul className="wp-mgr__roster">
        {[
          ['Master Diagnostics', activeCount > 0 ? 78 : 0],
          ['Suspension & Alignment', activeCount > 0 ? 42 : 0],
          ['EV & High Voltage', activeCount > 0 ? 56 : 0]
        ].map(([title, w]) => (
          <li key={title}>
            <span>{title}</span>
            <span className="wp-mgr__bar"><span style={{ '--w': `${w}%` }} /></span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const STEPS = ['Check-In', 'Digital Inspection', 'Estimate & Approval', 'Service In Progress', 'Ready for Pickup'];

const CustomerPreview = ({ estimate }) => {
  const lines = (estimate?.lines && estimate.lines.length > 0)
    ? estimate.lines.slice(0, 2)
    : [];

  return (
    <div className="wp-cust">
      <ol className="wp-steps">
        {STEPS.map((s, i) => (
          <li key={s} className={i < (estimate?.lines?.length ? 2 : 1) ? 'is-done' : ''}>
            <span>{i < (estimate?.lines?.length ? 2 : 1) ? <Check size={11} aria-hidden="true" /> : i + 1}</span>
            <em>{s}</em>
          </li>
        ))}
      </ol>
      {lines.length === 0 ? (
        <div style={{ color: 'var(--ft-text-3)', fontSize: '12px', textAlign: 'center', padding: '16px' }}>
          No active estimate lines. Customer portal ready to receive itemized repair approvals.
        </div>
      ) : (
        <ul className="wp-lines">
          {lines.map((l, i) => (
            <li key={l.id || i} className={l.approved === false ? 'is-declined' : ''}>
              <span>{l.description}</span>
              <b>${(l.lineTotal || l.unitPrice || 0).toFixed(2)}</b>
              <span className={`hv-chip ${l.approved ? 'hv-chip--ok' : 'hv-chip--no'}`}>
                {l.approved ? <><Check size={12} aria-hidden="true" />Approved</> : 'Declined'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const PREVIEWS = {
  advisor: AdvisorPreview,
  technician: TechnicianPreview,
  manager: ManagerPreview,
  customer: CustomerPreview
};

export const Workspaces = () => {
  const [selected, setSelected] = useState(ROLES[0].id);
  const [liveOrders, setLiveOrders] = useState([]);
  const [liveInspection, setLiveInspection] = useState(null);
  const [liveEstimate, setLiveEstimate] = useState(null);
  const tabRefs = useRef({});

  useEffect(() => {
    api.getRepairOrders()
      .then(res => {
        if (res.success && res.repairOrders && res.repairOrders.length > 0) {
          setLiveOrders(res.repairOrders);
          const firstRo = res.repairOrders[0];
          api.getInspection(firstRo.id).then(r => r.success && setLiveInspection(r.inspection)).catch(() => {});
          api.getEstimate(firstRo.id).then(r => r.success && setLiveEstimate(r.estimate)).catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

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
                    <Preview 
                      repairOrders={liveOrders}
                      inspection={liveInspection}
                      estimate={liveEstimate}
                    />
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
