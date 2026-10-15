import { useEffect, useRef } from 'react';

// Props that make a clickable card/row behave like a button for keyboard users.
export const pressable = (onActivate) => ({
  role: 'button',
  tabIndex: 0,
  onClick: onActivate,
  onKeyDown: (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onActivate(e);
    }
  }
});

// Close dialogs with Escape while they are open.
export const useEscapeKey = (active, onEscape) => {
  const handler = useRef(onEscape);
  handler.current = onEscape;

  useEffect(() => {
    if (!active) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') handler.current?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active]);
};
