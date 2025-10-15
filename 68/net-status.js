// net-status.js — offline banner + queued-requests badge + BG Sync toast
/* eslint-disable no-unused-vars */
(() => {
  const DB_NAME = 'bg-sync-queue';
  const STORE = 'requests';
  const $ = (s, el = document) => el.querySelector(s);

  // Create a tiny offline pill (no HTML changes needed)
  const pill = document.createElement('div');
  pill.textContent = 'Offline';
  pill.className = 'fixed z-50 bottom-20 left-3 px-2.5 py-1.5 rounded-full bg-amber-600 text-white text-xs shadow hidden';
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(pill));

  // Optional sync badge (add an element with [data-sync-badge] anywhere)
  const SYNC_BADGE_SELECTOR = '[data-sync-badge]';
  let syncQueued = 0;

  function setPill(on) { pill.classList.toggle('hidden', !on); }

  // Listen for BG Sync flush events from SW
  if (navigator.serviceWorker) {
    navigator.serviceWorker.addEventListener('message', (e) => {
      if (e.data?.type === 'bg-sync:flushed') {
        syncQueued = 0;
        const badge = document.querySelector(SYNC_BADGE_SELECTOR);
        if (badge) {
          badge.textContent = '0';
          badge.classList.add('hidden');
        }
      }
    });
  }

  // Expose a global badge updater for app logic
  window.updateSyncBadge = function(count) {
    syncQueued = count;
    const badge = document.querySelector(SYNC_BADGE_SELECTOR);
    if (badge) {
      badge.textContent = count;
      badge.classList.toggle('hidden', count === 0);
    }
  };

  function idbOpen() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function getQueueCount() {
    try {
      const db = await idbOpen();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        let n = 0;
        tx.objectStore(STORE).openCursor().onsuccess = e => {
          const c = e.target.result;
          if (c) { n++; c.continue(); } else resolve(n);
        };
        tx.oncomplete = () => db.close();
        tx.onerror = () => reject(tx.error);
      });
    } catch { return 0; }
  }

  async function updateSyncBadge() {
    const el = document.querySelector(SYNC_BADGE_SELECTOR);
    if (!el) return;
    const n = await getQueueCount();
    el.textContent = String(n);
    el.classList.toggle('hidden', n <= 0);
  }

  // Show toast if you already have a toast system (optional hook)
  function toast(msg) {
    const root = document.getElementById('toast-root');
    if (!root) return;
    const node = document.createElement('div');
    node.className = 'pointer-events-auto px-3 py-2 rounded-lg bg-black/90 text-white text-xs shadow';
    node.textContent = msg;
    root.appendChild(node);
    setTimeout(() => node.remove(), 2500);
  }

  // Online/Offline UI
  function syncOnlineUI() {
    setPill(!navigator.onLine);
    updateSyncBadge();
  }
})();
// End of IIFE
