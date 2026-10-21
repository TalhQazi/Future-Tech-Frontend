import { useEffect, useState } from 'react';

export const ROLES = ['advisor', 'technician', 'manager', 'customer', 'parts', 'accounting', 'admin'];

// Hash routes keep the app deployable as static files without server rewrites.
// "#/login", "#/register", "#/app" and "#/app/<role>" open specific views.
export const parseRoute = (hash = window.location.hash) => {
  if (hash === '#/login' || hash === '#/signin') {
    return { name: 'auth', mode: 'login' };
  }
  if (hash === '#/register' || hash === '#/signup') {
    return { name: 'auth', mode: 'register' };
  }
  const match = hash.match(/^#\/app(?:\/([a-z]+))?\/?$/);
  if (match) {
    const role = ROLES.includes(match[1]) ? match[1] : null;
    return { name: 'app', role };
  }
  return { name: 'site', role: null };
};

export const appHref = (role) => (role ? `#/app/${role}` : '#/app');
export const authHref = (mode = 'login') => `#/${mode}`;

export const useHashRoute = () => {
  const [route, setRoute] = useState(() => parseRoute());

  useEffect(() => {
    const onHashChange = () => {
      setRoute((prev) => {
        const next = parseRoute();
        // Only page-level changes re-render; anchors and role sync are ignored.
        return prev.name === next.name ? prev : next;
      });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return route;
};
