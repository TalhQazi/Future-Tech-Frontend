import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo.jsx';
import { NAV_LINKS } from './content.js';
import { useScrollSpy } from './motion.js';

export const SiteNav = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const active = useScrollSpy();
  const toggleRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Mobile menu: Escape closes, focus moves in and back out, page scroll is locked
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    const desktop = window.matchMedia('(min-width: 961px)');
    const onBreakpoint = (e) => e.matches && setOpen(false);

    document.addEventListener('keydown', onKey);
    desktop.addEventListener('change', onBreakpoint);
    document.documentElement.classList.add('is-nav-locked');
    panelRef.current?.querySelector('a')?.focus();

    return () => {
      document.removeEventListener('keydown', onKey);
      desktop.removeEventListener('change', onBreakpoint);
      document.documentElement.classList.remove('is-nav-locked');
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className={`site-nav${scrolled ? ' is-scrolled' : ''}${open ? ' is-open' : ''}`}>
      <div className="site-nav__bar">
        <a href="#top" className="site-nav__brand" aria-label="FutureTech — back to top" onClick={close}>
          <BrandLogo className="site-nav__logo" priority />
          <span className="site-nav__word">
            FutureTech<span className="site-nav__ver">2.0</span>
          </span>
        </a>

        <nav className="site-nav__links" aria-label="Primary">
          <ul>
            {NAV_LINKS.map((link) => (
              <li key={link.id}>
                <a
                  href={`#${link.id}`}
                  className="site-nav__link"
                  aria-current={active === link.id ? 'true' : undefined}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-nav__actions">
          <a href="#/app" className="ft-btn ft-btn--primary ft-btn--sm site-nav__cta">
            <span>Launch Shop OS</span>
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
          <button
            ref={toggleRef}
            type="button"
            className="site-nav__toggle"
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>

        <span className="site-nav__progress" aria-hidden="true" />
      </div>

      <div id="site-menu" className="site-nav__panel" ref={panelRef} inert={!open}>
        <nav aria-label="Mobile">
          <ul>
            {NAV_LINKS.map((link, i) => (
              <li key={link.id} style={{ '--d': i }}>
                <a
                  href={`#${link.id}`}
                  className="site-nav__panel-link"
                  aria-current={active === link.id ? 'true' : undefined}
                  onClick={close}
                >
                  <span>{link.label}</span>
                  <span className="site-nav__panel-index" aria-hidden="true">0{i + 1}</span>
                </a>
              </li>
            ))}
          </ul>
          <a href="#/app" className="ft-btn ft-btn--primary ft-btn--block" onClick={close}>
            Launch Shop OS
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        </nav>
      </div>
      <button
        type="button"
        className="site-nav__scrim"
        aria-hidden="true"
        tabIndex={-1}
        onClick={close}
      />
    </header>
  );
};
