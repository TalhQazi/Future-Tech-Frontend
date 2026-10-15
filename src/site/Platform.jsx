import React, { useRef } from 'react';
import { ArrowRight, Search, Check, X as XIcon, Lock, AlertTriangle } from 'lucide-react';
import { CAPABILITIES, PRINCIPLES } from './content.js';
import { appHref } from '../router.js';
import { useSpotlight } from './motion.js';

export const Intro = () => (
  <section id="intro" className="sec sec--light sec--sheet intro" aria-labelledby="intro-title">
    <div className="container">
      <div className="intro__grid">
        <h2 id="intro-title" className="eyebrow eyebrow--ink" data-reveal>
          One repair order, every role
        </h2>
        <p className="intro__statement" data-reveal style={{ '--d': 1 }}>
          Check-in, inspection, diagnostics, estimates, approvals and payment.{' '}
          <strong>FutureTech 2.0 keeps the whole repair order in one place</strong>, so every
          seat in the shop works from the same job.
        </p>
      </div>

      <ol className="principles">
        {PRINCIPLES.map((p, i) => (
          <li className="principle" key={p.title} data-reveal style={{ '--d': i }}>
            <span className="principle__num" aria-hidden="true">0{i + 1}</span>
            <h3 className="principle__title">{p.title}</h3>
            <p className="principle__body">{p.body}</p>
          </li>
        ))}
      </ol>
    </div>
  </section>
);

/* ---- Mini product visuals (decorative, mirror the real Shop OS screens) ---- */

const VisualDiagnostics = () => (
  <div className="mv-diag">
    <ul className="mv-diag__codes">
      <li>
        <span className="mv-code is-critical">P0302</span>
        <span>Cylinder 2 Misfire Detected</span>
        <span className="mv-sev is-critical">Critical</span>
      </li>
      <li>
        <span className="mv-code is-warning">P0171</span>
        <span>System Too Lean (Bank 1)</span>
        <span className="mv-sev is-warning">Pending</span>
      </li>
      <li>
        <span className="mv-code">U0100</span>
        <span>Lost Communication with ECM/PCM</span>
        <span className="mv-sev">History</span>
      </li>
    </ul>
    <div className="mv-diag__tele">
      <div><span>Battery</span><strong>14.1<small>VDC</small></strong></div>
      <div><span>Coolant</span><strong>198<small>°F</small></strong></div>
      <div><span>Idle</span><strong>780<small>RPM</small></strong></div>
      <div><span>Fuel rail</span><strong>2150<small>PSI</small></strong></div>
    </div>
  </div>
);

const VisualCheckin = () => (
  <div className="mv-search">
    <div className="mv-search__field">
      <Search size={14} aria-hidden="true" />
      <span>WA1VAAF75ND…</span>
      <span className="mv-caret" />
    </div>
    <div className="mv-search__result">
      <span className="mv-avatar">ER</span>
      <span>
        <strong>Elena Rostova</strong>
        <small>2022 Audi Q7 · Plate 8XYZ21</small>
      </span>
      <span className="mv-pill">VIP Gold Care</span>
    </div>
  </div>
);

const VisualInspection = () => (
  <ul className="mv-dvi">
    <li><span>Rear Brake Pads &amp; Rotors</span><span className="mv-st is-pass"><Check size={12} aria-hidden="true" />Pass</span></li>
    <li><span>Tire Tread Depth</span><span className="mv-st is-attn"><AlertTriangle size={12} aria-hidden="true" />Attention</span></li>
    <li><span>Front Brake Pads &amp; Rotors</span><span className="mv-st is-fail"><XIcon size={12} aria-hidden="true" />Fail</span></li>
  </ul>
);

const VisualApprovals = () => (
  <ul className="mv-lines">
    <li><span>Ignition Coil Pack</span><span className="mv-toggle is-on" /></li>
    <li><span>Iridium Spark Plugs ×6</span><span className="mv-toggle is-on" /></li>
    <li><span>Laser Alignment</span><span className="mv-toggle" /></li>
  </ul>
);

const BOARD = [
  { label: 'Checked In', jobs: 0 },
  { label: 'Inspection', jobs: 1 },
  { label: 'Estimate', jobs: 1 },
  { label: 'Authorized', jobs: 1 },
  { label: 'Ready to pay', jobs: 1 },
  { label: 'Completed', jobs: 0 }
];

const VisualBoard = () => (
  <div className="mv-board">
    {BOARD.map((col, i) => (
      <div className="mv-board__col" key={col.label} style={{ '--c': i }}>
        <span className="mv-board__label">{col.label}</span>
        {Array.from({ length: col.jobs }).map((_, j) => (
          <span className="mv-board__job" key={j} />
        ))}
      </div>
    ))}
  </div>
);

const VisualPayment = () => (
  <div className="mv-pay">
    <span className="mv-pay__lock"><Lock size={14} aria-hidden="true" /></span>
    <span className="mv-pay__card">•••• 4242</span>
    <span className="mv-pay__note">Card number never stored</span>
  </div>
);

const VisualParts = () => (
  <div className="mv-parts">
    <span className="mv-parts__bay">Bay 3</span>
    <span className="mv-parts__steps">
      <span className="is-done">Requested</span>
      <span className="is-done">Received</span>
      <span>Installed</span>
    </span>
  </div>
);

const VisualDispatch = () => (
  <ul className="mv-dispatch">
    {[
      ['Bay 1', 'Alignment & Suspension', 38],
      ['Bay 3', 'Diagnostics Lift', 82],
      ['Bay 4', 'EV Clean Room', 54]
    ].map(([bay, name, load]) => (
      <li key={bay}>
        <span className="mv-dispatch__bay">{bay}</span>
        <span className="mv-dispatch__name">{name}</span>
        <span className="mv-dispatch__load"><span style={{ '--w': `${load}%` }} /></span>
      </li>
    ))}
  </ul>
);

const VISUALS = {
  feature: VisualDiagnostics,
  checkin: VisualCheckin,
  inspection: VisualInspection,
  approvals: VisualApprovals,
  board: VisualBoard,
  payment: VisualPayment,
  parts: VisualParts,
  dispatch: VisualDispatch
};

export const Platform = () => {
  const gridRef = useRef(null);
  useSpotlight(gridRef);

  return (
    <section id="platform" className="sec sec--light platform" aria-labelledby="platform-title">
      <div className="container">
        <header className="sec-head sec-head--split">
          <div>
            <p className="eyebrow eyebrow--ink" data-reveal>Platform</p>
            <h2 id="platform-title" className="h2 h2--ink" data-reveal style={{ '--d': 1 }}>
              Everything a repair order touches.
            </h2>
          </div>
          <p className="sec-head__lead sec-head__lead--ink" data-reveal style={{ '--d': 2 }}>
            Eight capabilities, one connected workflow. Every card opens straight into the
            workspace where that work happens.
          </p>
        </header>

        <div className="bento" ref={gridRef}>
          {CAPABILITIES.map((cap, i) => {
            const Icon = cap.icon;
            const Visual = VISUALS[cap.layout];
            return (
              <article
                key={cap.id}
                className={`cap cap--${cap.layout}`}
                data-reveal
                data-spotlight
                style={{ '--d': i % 3 }}
              >
                <div className="cap__visual" aria-hidden="true">
                  <Visual />
                </div>
                <div className="cap__body">
                  <span className="cap__icon" aria-hidden="true"><Icon size={18} /></span>
                  <h3 className="cap__title">{cap.title}</h3>
                  <p className="cap__text">{cap.body}</p>
                  <a className="cap__link" href={appHref(cap.role)}>
                    <span>{cap.link}</span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
