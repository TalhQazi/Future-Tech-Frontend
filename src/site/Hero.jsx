import React, { useRef } from 'react';
import { ArrowDown, ArrowUpRight, Cpu, Check, X as XIcon } from 'lucide-react';
import { ROLES, PROTOCOLS } from './content.js';
import { appHref } from '../router.js';
import { usePointerParallax } from './motion.js';

// [x%, y%, size px, duration s, delay s] — fixed so the layout is deterministic
const PARTICLES = [
  [6, 18, 2, 9, 0], [14, 62, 3, 12, 2], [22, 34, 2, 10, 4], [31, 82, 2, 14, 1],
  [44, 12, 3, 11, 3], [52, 58, 2, 9, 5], [61, 26, 2, 13, 2], [68, 74, 3, 10, 0],
  [76, 14, 2, 12, 6], [83, 48, 2, 9, 3], [90, 30, 3, 14, 1], [95, 70, 2, 11, 4],
  [38, 46, 2, 15, 7], [72, 90, 2, 12, 2], [8, 88, 2, 10, 5], [57, 40, 2, 13, 8]
];

const HEADLINE = [
  ['Turn', 'every', 'inspection'],
  ['into', 'an', { em: 'approved' }, 'repair.']
];

const Headline = () => {
  let i = 0;
  return (
    <h1 id="hero-title" className="hero__title">
      {HEADLINE.map((line, li) => (
        <span className="hero__line" key={li}>
          {line.map((word) => {
            const index = i++;
            const isEm = typeof word === 'object';
            return (
              <React.Fragment key={index}>
                <span className={`hero__word${isEm ? ' hero__word--em' : ''}`} style={{ '--i': index }}>
                  <span>{isEm ? word.em : word}</span>
                  {isEm && (
                    <svg className="hero__underline" viewBox="0 0 220 18" preserveAspectRatio="none" aria-hidden="true">
                      <path d="M3 13.5C42 6.5 98 3.6 142 5.2c29 1 52 3.4 75 7.3" pathLength="1" />
                    </svg>
                  )}
                </span>{' '}
              </React.Fragment>
            );
          })}
        </span>
      ))}
    </h1>
  );
};

const HeroVisual = () => {
  const stageRef = useRef(null);
  usePointerParallax(stageRef);

  return (
    <div
      className="hero__visual"
      ref={stageRef}
      role="img"
      aria-label="Preview of the FutureTech Shop OS: an active P0302 misfire code with freeze-frame data, inspection results, live telemetry and customer-approved estimate lines."
    >
      <div className="hv">
        {/* Signal paths connecting the console to the other panels */}
        <svg className="hv__wires" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="hv-wire" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#7957FF" />
              <stop offset="1" stopColor="#36D6F5" />
            </linearGradient>
          </defs>
          <path className="hv__wire" d="M62 30 C 72 30, 74 16, 84 16" pathLength="100" />
          <path className="hv__wire" d="M66 52 C 78 52, 80 58, 90 58" pathLength="100" />
          <path className="hv__wire" d="M30 66 C 30 74, 22 76, 22 84" pathLength="100" />
          <path className="hv__pulse" d="M62 30 C 72 30, 74 16, 84 16" pathLength="100" />
          <path className="hv__pulse hv__pulse--2" d="M66 52 C 78 52, 80 58, 90 58" pathLength="100" />
          <path className="hv__pulse hv__pulse--3" d="M30 66 C 30 74, 22 76, 22 84" pathLength="100" />
        </svg>

        {/* Main diagnostics console */}
        <div className="hv__layer hv__layer--console" style={{ '--depth': 10 }}>
          <div className="hv__float" style={{ '--float': '9s' }}>
            <div className="hv-card hv-console" style={{ '--enter': 0 }}>
              <div className="hv-console__head">
                <span className="hv-console__icon"><Cpu size={16} aria-hidden="true" /></span>
                <div>
                  <p className="hv-console__title">FutureTech Diagnostics</p>
                  <p className="hv-console__meta">AutoMind CAN-FD Telemetry · High-Speed Bus Stream</p>
                </div>
                <span className="hv-live"><span className="live-dot" /> Live</span>
              </div>

              <div className="hv-dtc">
                <span className="hv-dtc__code">P0302</span>
                <div className="hv-dtc__text">
                  <p>Cylinder 2 Misfire Detected</p>
                  <span>Powertrain / Ignition · MIL on</span>
                </div>
                <span className="hv-tag hv-tag--danger">Critical</span>
              </div>

              <div className="hv-frame">
                <div><span>RPM</span><strong>2,140</strong></div>
                <div><span>Speed</span><strong>52 mph</strong></div>
                <div><span>Coolant</span><strong>198°F</strong></div>
                <div><span>Load</span><strong>64.2%</strong></div>
              </div>

              <div className="hv-wave">
                <div className="hv-wave__label">
                  <span>Fuel trim · Bank 1</span>
                  <strong>+14.2%</strong>
                </div>
                <svg viewBox="0 0 300 56" preserveAspectRatio="none" aria-hidden="true">
                  <path className="hv-wave__grid" d="M0 14H300M0 28H300M0 42H300" />
                  <path
                    className="hv-wave__line"
                    d="M0 34 C 14 34, 18 20, 32 22 S 52 40, 66 36 S 86 12, 102 16 S 122 42, 138 38 S 160 18, 176 20 S 196 44, 214 36 S 236 10, 252 18 S 280 36, 300 28"
                    pathLength="1"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Inspection summary */}
        <div className="hv__layer hv__layer--inspect" style={{ '--depth': 22 }}>
          <div className="hv__float" style={{ '--float': '7.5s', '--float-delay': '-2s' }}>
            <div className="hv-card hv-mini" style={{ '--enter': 1 }}>
              <p className="hv-mini__label">Digital inspection</p>
              <div className="hv-meter" aria-hidden="true">
                <span style={{ flex: 3 }} className="is-pass" />
                <span style={{ flex: 2 }} className="is-attn" />
                <span style={{ flex: 2 }} className="is-fail" />
              </div>
              <ul className="hv-legend">
                <li><i className="is-pass" />Pass <b>3</b></li>
                <li><i className="is-attn" />Attention <b>2</b></li>
                <li><i className="is-fail" />Fail <b>2</b></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Live telemetry */}
        <div className="hv__layer hv__layer--telemetry" style={{ '--depth': 30 }}>
          <div className="hv__float" style={{ '--float': '8.5s', '--float-delay': '-4s' }}>
            <div className="hv-card hv-mini hv-tele" style={{ '--enter': 2 }}>
              <p className="hv-mini__label">Bus voltage</p>
              <p className="hv-tele__value">14.1<span>VDC</span></p>
              <div className="hv-bars" aria-hidden="true">
                {[40, 62, 48, 74, 58, 80, 66, 72].map((h, i) => (
                  <span key={i} style={{ '--h': `${h}%`, '--b': i }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Customer approvals */}
        <div className="hv__layer hv__layer--approve" style={{ '--depth': 18 }}>
          <div className="hv__float" style={{ '--float': '10s', '--float-delay': '-6s' }}>
            <div className="hv-card hv-approve" style={{ '--enter': 3 }}>
              <p className="hv-mini__label">Estimate · line approvals</p>
              <ul>
                <li>
                  <span className="hv-approve__name">OEM Ignition Coil Pack (Cyl 2)</span>
                  <span className="hv-approve__price">$118.50</span>
                  <span className="hv-chip hv-chip--ok"><Check size={12} aria-hidden="true" />Approved</span>
                </li>
                <li>
                  <span className="hv-approve__name">Bosch Iridium Spark Plugs ×6</span>
                  <span className="hv-approve__price">$117.00</span>
                  <span className="hv-chip hv-chip--ok"><Check size={12} aria-hidden="true" />Approved</span>
                </li>
                <li className="is-declined">
                  <span className="hv-approve__name">4-Wheel Laser Alignment</span>
                  <span className="hv-approve__price">$210.00</span>
                  <span className="hv-chip hv-chip--no"><XIcon size={12} aria-hidden="true" />Declined</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Hero = () => (
  <section id="top" className="hero" aria-labelledby="hero-title">
    <div className="hero__bg" aria-hidden="true">
      <div className="hero__glow hero__glow--violet" />
      <div className="hero__glow hero__glow--cyan" />
      <div className="hero__floor">
        <div className="hero__floor-grid" />
      </div>
      <div className="hero__particles">
        {PARTICLES.map(([x, y, s, t, d], i) => (
          <span
            key={i}
            style={{ '--x': `${x}%`, '--y': `${y}%`, '--s': `${s}px`, '--t': `${t}s`, '--dl': `${-d}s` }}
          />
        ))}
      </div>
      <div className="hero__grain" />
    </div>

    <div className="container hero__inner">
      <div className="hero__copy">
        <p className="hero__kicker">
          <span className="live-dot" aria-hidden="true" />
          <span>FutureTech 2.0</span>
          <span className="hero__kicker-sep" aria-hidden="true" />
          <span className="hero__kicker-muted">Shop OS with built-in diagnostics</span>
        </p>

        <Headline />

        <p className="hero__lead">
          FutureTech connects your front desk, your service bays and your customers’ phones in one
          shop operating system — with live OBD-II diagnostics on every repair order.
          No second diagnostics app. No duplicate typing.
        </p>

        <div className="hero__actions">
          <a href="#platform" className="ft-btn ft-btn--primary ft-btn--lg">
            <span>Explore the platform</span>
            <ArrowDown size={18} aria-hidden="true" />
          </a>
          <a href="#/app" className="ft-btn ft-btn--ghost ft-btn--lg">
            <span>Launch Shop OS</span>
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        </div>

        <div className="hero__seats">
          <p className="hero__seats-label">One workspace for every seat in the shop</p>
          <ul>
            {ROLES.map(({ id, label, icon: Icon }) => (
              <li key={id}>
                <a href={appHref(id)} className="hero__seat">
                  <Icon size={15} aria-hidden="true" />
                  <span>{label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <HeroVisual />
    </div>

    <div className="container hero__protocols">
      <p className="hero__protocols-label">Speaks the language of the bay</p>
      <ul>
        {PROTOCOLS.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </div>
  </section>
);
