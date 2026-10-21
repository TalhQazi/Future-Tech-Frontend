import { useEffect, useState } from 'react';
import { api, newIdempotencyKey } from '../api/client.js';

// Offline queue for technician drafts (findings, measurements, photos).
// Each entry carries its own Idempotency-Key / clientId, so replays after a
// dropped connection can never create duplicates on the server. Online-only
// actions (payments, approvals) are never queued.

const DB = 'ft-offline';
const STORE = 'queue';
const listeners = new Set();

const open = () => new Promise((resolve, reject) => {
  const req = indexedDB.open(DB, 1);
  req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'key' });
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

const tx = async (mode, fn) => {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const out = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(out?.result ?? out);
    t.onerror = () => reject(t.error);
  });
};

const all = () => tx('readonly', s => s.getAll());
const notify = async () => {
  const items = await all().catch(() => []);
  listeners.forEach(fn => fn(items));
};

// kind: 'json' (POST body) | 'upload' (FormData fields + Blob)
export const enqueue = async ({ path, body, file, fields, label }) => {
  const key = newIdempotencyKey();
  await tx('readwrite', s => s.put({ key, path, body, file, fields: fields ? { ...fields, clientId: key } : undefined, label, kind: file ? 'upload' : 'json', status: 'pending', createdAt: Date.now() }));
  notify();
  flush();
  return key;
};

let flushing = false;
export const flush = async () => {
  if (flushing || !navigator.onLine) return;
  flushing = true;
  try {
    for (const item of await all()) {
      if (item.status === 'failed') continue;
      try {
        if (item.kind === 'upload') {
          const form = new FormData();
          Object.entries(item.fields || {}).forEach(([k, v]) => v !== undefined && form.append(k, v));
          form.append('file', item.file, item.file.name || 'capture');
          await api.upload(item.path, form, { idempotencyKey: item.key });
        } else {
          await api.post(item.path, item.body, { idempotencyKey: item.key });
        }
        await tx('readwrite', s => s.delete(item.key));
      } catch (err) {
        if (err.status === 0 || err.status >= 500 || err.status === 401) break; // retry later
        await tx('readwrite', s => s.put({ ...item, status: 'failed', error: err.message }));
      }
    }
  } finally {
    flushing = false;
    notify();
  }
};

export const discard = async (key) => { await tx('readwrite', s => s.delete(key)); notify(); };
export const retry = async (key) => {
  const item = (await all()).find(i => i.key === key);
  if (item) await tx('readwrite', s => s.put({ ...item, status: 'pending', error: undefined }));
  notify();
  flush();
};

window.addEventListener?.('online', flush);
setInterval(() => flush(), 30000);

export const useOfflineQueue = () => {
  const [items, setItems] = useState([]);
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    listeners.add(setItems);
    notify();
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { listeners.delete(setItems); window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return { items, online, pending: items.filter(i => i.status === 'pending').length, failed: items.filter(i => i.status === 'failed').length };
};
