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

        <div className="site-nav__actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <a
            href="#/login"
            className="site-nav__link"
            style={{ fontSize: '13px', fontWeight: '700', color: '#8fa0c0', padding: '6px 12px' }}
          >
            Sign In
          </a>
          <a
            href="#/register"
            style={{
              fontSize: '13px',
              fontWeight: '700',
              color: '#00d2ff',
              background: 'rgba(0, 210, 255, 0.1)',
              border: '1px solid rgba(0, 210, 255, 0.3)',
              borderRadius: '8px',
              padding: '6px 12px',
              textDecoration: 'none'
            }}
          >
            Register
          </a>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
            <a href="#/login" className="ft-btn ft-btn--secondary ft-btn--block" onClick={close}>
              Sign In to Panel
            </a>
            <a href="#/register" className="ft-btn ft-btn--secondary ft-btn--block" style={{ borderColor: 'rgba(0, 210, 255, 0.4)', color: '#00d2ff' }} onClick={close}>
              Register New Account
            </a>
            <a href="#/app" className="ft-btn ft-btn--primary ft-btn--block" onClick={close}>
              Launch Shop OS
              <ArrowUpRight size={18} aria-hidden="true" />
            </a>
          </div>
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
