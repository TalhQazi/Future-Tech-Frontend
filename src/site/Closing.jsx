import React from 'react';
import { ArrowUpRight, ArrowUp, Check } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo.jsx';
import { MEMBERSHIP, ROLES, NAV_LINKS } from './content.js';
import { appHref } from '../router.js';

export const Membership = () => {
  const Icon = MEMBERSHIP.icon;
  return (
    <section id="membership" className="sec sec--dark membership" aria-labelledby="membership-title">
      <div className="container membership__grid">
        <div className="membership__copy">
          <p className="eyebrow" data-reveal>Membership Auto</p>
          <h2 id="membership-title" className="h2" data-reveal style={{ '--d': 1 }}>
            Member perks, applied on every estimate.
          </h2>
          <p className="membership__lead" data-reveal style={{ '--d': 2 }}>
            Membership tiers live on the customer profile and flow straight into estimates — taxes
            and member discounts are computed for you, with no discount math at the counter.
          </p>
          <p className="membership__tiers" data-reveal style={{ '--d': 3 }}>
            <span>Also available at check-in</span>
            {MEMBERSHIP.otherTiers.map((t) => (
              <span className="membership__tier" key={t}>{t}</span>
            ))}
          </p>
        </div>

        <div className="membership__stage" data-reveal style={{ '--d': 1 }}>
          <div className="mcard" aria-hidden="true">
            <div className="mcard__sheen" />
            <div className="mcard__top">
              <BrandLogo className="mcard__logo" alt="" />
              <span className="mcard__brand">Membership Auto</span>
            </div>
            <p className="mcard__tier">{MEMBERSHIP.tier}</p>
          </div>

          <div className="membership__perks">
            <span className="membership__perks-icon" aria-hidden="true"><Icon size={18} /></span>
            <div>
              <p className="membership__perks-title">{MEMBERSHIP.tier} benefits</p>
              <ul>
                {MEMBERSHIP.perks.map((p) => (
                  <li key={p}><Check size={14} aria-hidden="true" />{p}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export const GetStarted = () => (
  <section id="get-started" className="sec sec--dark cta" aria-labelledby="cta-title">
    <div className="container">
      <div className="cta__panel" data-reveal>
        <div className="cta__bg" aria-hidden="true" />
        <div className="cta__head">
          <h2 id="cta-title" className="cta__title">Step into the shop.</h2>
          <p className="cta__lead">
            Pick a workspace and walk a repair order from check-in to checkout.
          </p>
        </div>
        <ul className="cta__roles">
          {ROLES.map(({ id, label, icon: Icon, tagline }, i) => (
            <li key={id} style={{ '--d': i }}>
              <a href={appHref(id)} className="cta__role">
                <span className="cta__role-icon" aria-hidden="true"><Icon size={20} /></span>
                <span className="cta__role-text">
                  <strong>{label}</strong>
                  <span>{tagline}</span>
                </span>
                <ArrowUpRight className="cta__role-arrow" size={18} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </section>
);

export const SiteFooter = () => (
  <footer className="site-footer">
    <div className="container">
      <div className="site-footer__top">
        <div className="site-footer__brand">
          <a href="#top" className="site-footer__logo-link" aria-label="FutureTech — back to top">
            <BrandLogo className="site-footer__logo" alt="FutureTech" />
          </a>
          <p>
            The shop operating system with diagnostics built into every repair order.
            FutureTech 2.0 · Membership Auto.
          </p>
        </div>

        <nav className="site-footer__nav" aria-label="Footer">
          <div>
            <p className="site-footer__heading">Explore</p>
            <ul>
              {NAV_LINKS.map((l) => (
                <li key={l.id}><a href={`#${l.id}`}>{l.label}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="site-footer__heading">Workspaces</p>
            <ul>
              {ROLES.map((r) => (
                <li key={r.id}><a href={appHref(r.id)}>{r.label}</a></li>
              ))}
            </ul>
          </div>
        </nav>
      </div>

      <div className="site-footer__bottom">
        <p>© {new Date().getFullYear()} FutureTech. All rights reserved.</p>
        <a href="#top" className="site-footer__top-link">
          Back to top <ArrowUp size={15} aria-hidden="true" />
        </a>
      </div>
    </div>
  </footer>
);
