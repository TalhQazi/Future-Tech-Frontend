import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo.jsx';
import { DIAGNOSTIC_FEATURES, STAGES, REASONS } from './content.js';
import { appHref } from '../router.js';

export const Diagnostics = () => (
  <section id="diagnostics" className="sec sec--navy diag" aria-labelledby="diag-title">
    <div className="diag__circuit" aria-hidden="true" />
    <div className="container diag__grid">
      <div className="diag__art" aria-hidden="true" data-reveal>
        <div className="diag__halo" />
        <div className="diag__ring" />
        <div className="diag__ring diag__ring--inner" />
        <div className="diag__logo-wrap">
          <BrandLogo size="lg" className="diag__logo" alt="" />
        </div>
        <span className="diag__chip diag__chip--a"><i className="is-danger" />P0302 · Cyl 2 misfire</span>
        <span className="diag__chip diag__chip--b"><i />Coolant 198°F</span>
        <span className="diag__chip diag__chip--c"><i className="is-violet" />CAN · ISO 15765-4</span>
      </div>

      <div className="diag__copy">
        <p className="eyebrow" data-reveal>FutureTech Diagnostics</p>
        <h2 id="diag-title" className="h2" data-reveal style={{ '--d': 1 }}>
          The scan tool lives inside the repair order.
        </h2>
        <p className="diag__lead" data-reveal style={{ '--d': 2 }}>
          Pull live trouble codes, read the freeze frame, follow guided component tests and log
          findings without leaving the job. Diagnostic notes persist even if the scan tool
          hardware disconnects.
        </p>

        <dl className="diag__features">
          {DIAGNOSTIC_FEATURES.map((f, i) => (
            <div className="diag__feature" key={f.title} data-reveal style={{ '--d': i }}>
              <dt>{f.title}</dt>
              <dd>{f.body}</dd>
            </div>
          ))}
        </dl>

        <a href={appHref('technician')} className="ft-btn ft-btn--ghost" data-reveal style={{ '--d': 2 }}>
          <span>Open the Technician bay</span>
          <ArrowUpRight size={17} aria-hidden="true" />
        </a>
      </div>
    </div>
  </section>
);

export const Workflow = () => (
  <section id="workflow" className="sec sec--light sec--sheet workflow" aria-labelledby="workflow-title">
    <div className="container">
      <header className="sec-head sec-head--split">
        <div>
          <p className="eyebrow eyebrow--ink" data-reveal>Workflow</p>
          <h2 id="workflow-title" className="h2 h2--ink" data-reveal style={{ '--d': 1 }}>
            One job. Six clear stages.
          </h2>
        </div>
        <p className="sec-head__lead sec-head__lead--ink" data-reveal style={{ '--d': 2 }}>
          Every repair order moves through the same visible lifecycle, from the front desk to the
          bay to the owner’s phone — so nobody has to ask where a car is.
        </p>
      </header>

      <ol className="flow" data-reveal>
        {STAGES.map((stage, i) => (
          <li className="flow__step" key={stage.name} style={{ '--d': i }}>
            <span className="flow__node" aria-hidden="true">{i + 1}</span>
            <p className="flow__owner">{stage.owner}</p>
            <h3 className="flow__name">{stage.name}</h3>
            <p className="flow__body">{stage.body}</p>
          </li>
        ))}
      </ol>
    </div>
  </section>
);

export const Reasons = () => (
  <section id="why" className="sec sec--light-2 reasons" aria-labelledby="why-title">
    <div className="container reasons__grid">
      <header className="reasons__head">
        <p className="eyebrow eyebrow--ink" data-reveal>Why FutureTech</p>
        <h2 id="why-title" className="h2 h2--ink" data-reveal style={{ '--d': 1 }}>
          Designed around the shop floor, not the back office.
        </h2>
      </header>

      {REASONS.map((r, i) => {
        const Icon = r.icon;
        return (
          <article
            key={r.title}
            className={`reason${r.featured ? ' reason--featured' : ''}`}
            data-reveal
            style={{ '--d': i % 3 }}
          >
            <span className="reason__icon" aria-hidden="true"><Icon size={r.featured ? 22 : 18} /></span>
            <h3 className="reason__title">{r.title}</h3>
            <p className="reason__body">{r.body}</p>
            {r.featured && (
              <div className="reason__touch" aria-hidden="true">
                <span className="is-pass">Pass</span>
                <span>Caution</span>
                <span>Fail</span>
              </div>
            )}
          </article>
        );
      })}
    </div>
  </section>
);
