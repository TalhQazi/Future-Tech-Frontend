import { useEffect, useState } from 'react';

export const ROLES = ['advisor', 'technician', 'manager', 'customer', 'parts', 'accounting', 'admin'];

// Hash routes keep the app deployable as static files without server rewrites.
//   #/                 marketing site
//   #/login, #/register, #/forgot-password, #/reset-password?..., #/accept-invite?...
//   #/app/<section>/<id>   staff workspace (legacy #/app/<role> links land on the dashboard)
//   #/portal/<section>/<id> customer portal
const AUTH_MODES = { '/login': 'login', '/signin': 'login', '/register': 'register', '/signup': 'register', '/forgot-password': 'forgot', '/reset-password': 'reset', '/accept-invite': 'invite' };

export const parseRoute = (hash = window.location.hash) => {
  const raw = hash.replace(/^#/, '') || '/';
  const [pathPart, queryPart = ''] = raw.split('?');
  const query = Object.fromEntries(new URLSearchParams(queryPart));
  if (AUTH_MODES[pathPart]) return { name: 'auth', mode: AUTH_MODES[pathPart], query, path: [] };
  const segments = pathPart.split('/').filter(Boolean);
  if (segments[0] === 'app') {
    const rest = segments.slice(1);
    return { name: 'app', path: ROLES.includes(rest[0]) ? [] : rest, query };
  }
  if (segments[0] === 'portal') return { name: 'portal', path: segments.slice(1), query };
  return { name: 'site', path: [], query };
};

export const appHref = (role) => (role ? `#/app/${role}` : '#/app');
export const authHref = (mode = 'login') => `#/${mode}`;
export const navigate = (hash) => {
  window.location.hash = hash;
};

export const useHashRoute = () => {
  const [route, setRoute] = useState(() => parseRoute());
  useEffect(() => {
    const onHashChange = () => {
      const next = parseRoute();
      // the marketing site uses in-page anchors; only re-render on real navigation
      setRoute(prev => (prev.name === 'site' && next.name === 'site' ? prev : next));
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  return route;
};
