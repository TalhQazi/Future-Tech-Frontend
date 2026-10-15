import { useEffect, useLayoutEffect, useState } from 'react';

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const hasFinePointer = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;

/**
 * Scroll-triggered reveals. Every [data-reveal] element inside `rootRef`
 * gets `.is-in` the first time it enters the viewport. One observer serves the
 * whole page; reduced-motion users (or browsers without IO) see content at once.
 * Runs before paint so nothing flashes visible and then hides.
 */
export const useReveal = (rootRef) => {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const items = root.querySelectorAll('[data-reveal]');

    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-in'));
      return undefined;
    }

    root.classList.add('motion-ready');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [rootRef]);
};

/** Returns the id of the section currently crossing the upper-middle of the viewport. */
export const useScrollSpy = (selector = 'main section[id]') => {
  const [active, setActive] = useState(null);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return undefined;
    const sections = document.querySelectorAll(selector);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-38% 0px -58% 0px' }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [selector]);

  return active;
};

/**
 * Subtle pointer parallax: writes --px / --py (-0.5…0.5) on the element.
 * Desktop pointers only, rAF-throttled, disabled for reduced motion.
 */
export const usePointerParallax = (ref) => {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || !hasFinePointer()) return undefined;

    let frame = 0;
    let x = 0;
    let y = 0;
    const write = () => {
      frame = 0;
      el.style.setProperty('--px', x.toFixed(3));
      el.style.setProperty('--py', y.toFixed(3));
    };
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      x = Math.max(-0.5, Math.min(0.5, (e.clientX - r.left) / r.width - 0.5));
      y = Math.max(-0.5, Math.min(0.5, (e.clientY - r.top) / r.height - 0.5));
      if (!frame) frame = requestAnimationFrame(write);
    };
    const onLeave = () => {
      x = 0;
      y = 0;
      if (!frame) frame = requestAnimationFrame(write);
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ref]);
};

/**
 * Cursor-following light on cards: sets --mx / --my (px) on the hovered
 * [data-spotlight] element inside the container. One delegated listener.
 */
export const useSpotlight = (ref) => {
  useEffect(() => {
    const el = ref.current;
    if (!el || !hasFinePointer()) return undefined;

    const onMove = (e) => {
      const card = e.target.closest?.('[data-spotlight]');
      if (!card || !el.contains(card)) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    };

    el.addEventListener('pointermove', onMove);
    return () => el.removeEventListener('pointermove', onMove);
  }, [ref]);
};
