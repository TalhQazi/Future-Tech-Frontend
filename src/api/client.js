// REST client for /api/v1: short-lived access token in memory, rotating
// refresh token in localStorage, single-flight refresh, idempotency keys and
// normalized errors (code, message, correlationId).

const API_BASE = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/$/, '');
const REFRESH_KEY = 'ft_refresh_token';

export class ApiError extends Error {
  constructor(status, body = {}) {
    super(body.message || `Request failed (${status})`);
    this.status = status;
    this.code = body.code;
    this.details = body.details;
    this.correlationId = body.correlationId;
  }
}

let accessToken = null;
let refreshPromise = null;
const listeners = new Set();

const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k, v) => { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch { /* storage unavailable */ } };

export const newIdempotencyKey = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

const emit = (user) => listeners.forEach(fn => fn(user));

export const session = {
  set({ token, refreshToken, user }) {
    accessToken = token || null;
    if (refreshToken) write(REFRESH_KEY, refreshToken);
    if (user) emit(user);
  },
  clear() {
    accessToken = null;
    write(REFRESH_KEY, null);
    emit(null);
  },
  hasRefresh: () => Boolean(read(REFRESH_KEY)),
  onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }
};

const doRefresh = async () => {
  const refreshToken = read(REFRESH_KEY);
  if (!refreshToken) throw new ApiError(401, { code: 'NO_SESSION', message: 'Not signed in' });
  const res = await fetch(`${API_BASE}/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (body.code !== 'REFRESH_RACE') session.clear();
    throw new ApiError(res.status, body);
  }
  session.set(body);
  return body;
};

export const refreshSession = () => {
  if (!refreshPromise) refreshPromise = doRefresh().finally(() => { refreshPromise = null; });
  return refreshPromise;
};

const buildUrl = (path, query) => {
  const qs = query ? new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== '')).toString() : '';
  return `${API_BASE}${path}${qs ? `?${qs}` : ''}`;
};

async function request(method, path, { query, body, form, idempotencyKey, ifMatch, raw, retried } = {}) {
  const headers = {};
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (body !== undefined && !form) headers['Content-Type'] = 'application/json';
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  if (ifMatch !== undefined && ifMatch !== null) headers['If-Match'] = String(ifMatch);

  if (!accessToken && !path.startsWith('/auth/') && session.hasRefresh() && !retried) {
    await refreshSession().catch(() => {});
    return request(method, path, { query, body, form, idempotencyKey, ifMatch, raw, retried: true });
  }

  let res;
  try {
    res = await fetch(buildUrl(path, query), { method, headers, body: form || (body !== undefined ? JSON.stringify(body) : undefined) });
  } catch {
    throw new ApiError(0, { code: 'NETWORK_ERROR', message: 'Cannot reach the server. Check your connection.' });
  }
  if (res.status === 401 && !retried && !path.startsWith('/auth/login')) {
    const body401 = await res.clone().json().catch(() => ({}));
    if (['TOKEN_EXPIRED', 'UNAUTHORIZED', 'INVALID_TOKEN'].includes(body401.code) && session.hasRefresh()) {
      await refreshSession();
      return request(method, path, { query, body, form, idempotencyKey, ifMatch, raw, retried: true });
    }
    if (['SESSION_REVOKED', 'ACCOUNT_INACTIVE', 'MFA_REQUIRED'].includes(body401.code)) session.clear();
  }
  if (raw) {
    if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => ({})));
    return res;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

export const api = {
  get: (path, query) => request('GET', path, { query }),
  post: (path, body = {}, opts = {}) => request('POST', path, { body, ...opts }),
  put: (path, body = {}, opts = {}) => request('PUT', path, { body, ...opts }),
  patch: (path, body = {}, opts = {}) => request('PATCH', path, { body, ...opts }),
  upload: (path, form, opts = {}) => request('POST', path, { form, ...opts }),
  blob: async (path) => (await request('GET', path, { raw: true })).blob(),
  // idempotent POST: one key per user action, reused on automatic retries
  action: (path, body = {}, opts = {}) => request('POST', path, { body, idempotencyKey: opts.idempotencyKey || newIdempotencyKey(), ...opts })
};

export default api;
