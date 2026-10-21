import React, { useEffect, useRef } from 'react';
import './site.css';
import { SiteNav } from './SiteNav.jsx';
import { Hero } from './Hero.jsx';
import { CarShowcase } from './CarShowcase.jsx';
import { Intro, Platform } from './Platform.jsx';
import { Workspaces } from './Workspaces.jsx';
import { Diagnostics, Workflow, Reasons } from './Story.jsx';
import { Membership, GetStarted, SiteFooter } from './Closing.jsx';
import { useReveal } from './motion.js';

export const LandingPage = () => {
  const rootRef = useRef(null);
  useReveal(rootRef);

  // Honour an in-page anchor on first load (e.g. /#workflow); otherwise start at the top
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    const target = id && !id.startsWith('/') ? document.getElementById(id) : null;
    if (target) {
      target.scrollIntoView({ behavior: 'instant', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, []);

  return (
    <div className="site" ref={rootRef}>
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteNav />
      <main id="main" tabIndex={-1}>
        <Hero />
        <CarShowcase />
        <Intro />
        <Platform />
        <Workspaces />
        <Diagnostics />
        <Workflow />
        <Reasons />
        <Membership />
        <GetStarted />
      </main>
      <SiteFooter />
    </div>
  );
};
