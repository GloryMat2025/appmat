// === Background Sync & Periodic Sync ===
// Minimal IDB (duplicated in SW scope)
const SW_DB = "myapp-db";
const SW_VER = 1;
const SW_STORE = "outbox";
function swDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(SW_DB, SW_VER);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(SW_STORE)) {
        db.createObjectStore(SW_STORE, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
function swGetAll() {
  return swDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(SW_STORE, "readonly");
    const req = tx.objectStore(SW_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  }));
}
function swDelete(id) {
  return swDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(SW_STORE, "readwrite");
    tx.objectStore(SW_STORE).delete(id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  }));
}

// Read settings (stored in localStorage on the page). SW can’t read it directly,
// so we make them available via a lightweight “settings cache” message if needed.
// Simpler approach: allow environment via hardcoded defaults and server side.
// For now, try fetching /.well-known/myapp-analytics.json as a fallback.
async function swGetEndpointConfig() {
  try {
    const res = await fetch("/.well-known/myapp-analytics.json", { cache: "no-store" });
    if (res.ok) return await res.json(); // { endpoint, token }
  } catch {}
  // Otherwise we’ll attempt to post and let it fail; page-side manual sync is primary.
  return { endpoint: null, token: null };
}

async function swFlushOutbox() {
  const cfg = await swGetEndpointConfig(); // { endpoint, token, batchSize?, batched? }
  const url = cfg.endpoint;
  if (!url) return 0;

  const token = cfg.token;
  const batchSize = Math.max(1, Math.min(100, cfg.batchSize || 25));
  const batched = (cfg.batched !== false);

  const items = await swGetAll();
  if (!items.length) return 0;

  // No backoff logic in SW (page handles it). Best-effort send & delete on success.
  let sent = 0;
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    const payload = {
      app: "myapp",
      mode: batched ? "batch" : "single",
      count: chunk.length,
      events: chunk.map(it => ({ id: it.id, type: it.kind, ts: it.createdAt, payload: it.payload }))
    };
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { "Authorization": `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        for (const it of chunk) { await swDelete(it.id); sent++; }
      } else {
        break;
      }
    } catch { break; }
  }
  return sent;
}

self.addEventListener("sync", (event) => {
  if (event.tag === "myapp-sync") {
    event.waitUntil(swFlushOutbox());
  }
});

if ("periodicSync" in self.registration) {
  self.addEventListener("periodicsync", (event) => {
    if (event.tag === "myapp-periodic") {
      event.waitUntil(swFlushOutbox());
    }
  });
}
// sw.js — v3: offline fallback + static/runtime caching + BG Sync queue for /api/*
const VERSION = 'v3';
const STATIC_CACHE  = `static-${VERSION}`;
const RUNTIME_CACHE = `runtime-${VERSION}`;
const JSON_CACHE    = `json-${VERSION}`;

// App shell (same as before)
const APP_SHELL = [
  '/', '/index.html', '/menu.html', '/assets/pages/cart.html', '/offline.html',
];

/* ---------- tiny IndexedDB helpers (no deps) ---------- */
const DB_NAME = 'bg-sync-queue';
const STORE   = 'requests';
function idbOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbAdd(obj) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).add(obj).onsuccess = () => resolve();
    tx.oncomplete = () => db.close();
    tx.onerror = () => reject(tx.error);
  });
}
async function idbAll() {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const out = [];
    tx.objectStore(STORE).openCursor().onsuccess = e => {
      const c = e.target.result;
      if (c) { out.push({ id: c.key, ...c.value }); c.continue(); }
      else resolve(out);
    };
    tx.oncomplete = () => db.close();
    tx.onerror = () => reject(tx.error);
  });
}
async function idbDel(id) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id).onsuccess = () => resolve();
    tx.oncomplete = () => db.close();
    tx.onerror = () => reject(tx.error);
  });
}

/* ---------- install / activate ---------- */
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(STATIC_CACHE).then(c => c.addAll(APP_SHELL)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => ![STATIC_CACHE, RUNTIME_CACHE, JSON_CACHE].includes(k))
                         .map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

/* ---------- fetch strategies ---------- */
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;

  // 1) Navigations → network-first, fallback to offline page
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const preload = await e.preloadResponse; if (preload) return preload;
        const res = await fetch(req, { cache: 'no-store' });
        return res.ok ? res : await caches.match('/offline.html');
      } catch { return caches.match('/offline.html'); }
    })());
    return;
  }

  // 2) Background-sync: queue failed POSTs to /api/*
  if (sameOrigin && req.method === 'POST' && url.pathname.startsWith('/api/')) {
    e.respondWith((async () => {
      try {
        // Try the network normally
        const res = await fetch(req.clone());
        return res;
      } catch (err) {
        // Only queue if network failed (TypeError); skip 4xx/5xx handled above
        try {
          const headers = {};
          req.headers.forEach((v, k) => headers[k] = v);
          let body = null;
          if ((headers['content-type'] || '').includes('application/json')) {
            try { body = await req.clone().json(); } catch {}
          } else {
            // fallback: read as text (simple forms)
            try { body = await req.clone().text(); } catch {}
          }
          await idbAdd({ url: req.url, method: req.method, headers, body, ts: Date.now() });
          // ask for a sync if available
          if ('sync' in self.registration) {
            try { await self.registration.sync.register('api-sync'); } catch {}
          }
        } catch {}
        // Tell the page we queued it
        return new Response(JSON.stringify({ queued: true, offline: true }), {
          status: 202, headers: { 'Content-Type': 'application/json' }
        });
      }
    })());
    return;
  }

  // 3) JSON under /assets/data → stale-while-revalidate
  if (sameOrigin && url.pathname.startsWith('/assets/data/') && url.pathname.endsWith('.json')) {
    e.respondWith((async () => {
      const cache = await caches.open(JSON_CACHE);
      const cached = await cache.match(req);
      const net = fetch(req).then(res => { if (res.ok) cache.put(req, res.clone()); return res; })
                            .catch(() => null);
      return cached || net || Response.error();
    })());
    return;
  }

  // 4) Static assets → stale-while-revalidate
  if (sameOrigin && /\.(css|js|woff2?|ttf|otf|png|jpg|jpeg|gif|svg|webp|avif|ico)$/.test(url.pathname)) {
    e.respondWith((async () => {
      const cache = await caches.open(RUNTIME_CACHE);
      const cached = await cache.match(req);
      const net = fetch(req).then(res => { if (res.ok) cache.put(req, res.clone()); return res; })
                            .catch(() => null);
      return cached || net || Response.error();
    })());
  }
});

/* ---------- background sync handler ---------- */
self.addEventListener('sync', (e) => {
  if (e.tag === 'api-sync') {
    e.waitUntil((async () => {
      const batch = await idbAll();
      let flushed = 0;
      for (const it of batch) {
        try {
          const init = { method: it.method, headers: it.headers || {} };
          if (it.body != null) {
            if (typeof it.body === 'string') init.body = it.body;
            else { init.body = JSON.stringify(it.body); init.headers['content-type'] ||= 'application/json'; }
          }
          const res = await fetch(it.url, init);
          if (res.ok) { await idbDel(it.id); flushed++; }
        } catch { /* keep queued */ }
      }
      // Notify all pages
      if (flushed > 0) {
        const clientsList = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
        clientsList.forEach(c => c.postMessage({ type: 'bg-sync:flushed', count: flushed }));
      }
    })());
  }
});

/* ---------- manual retry from page (optional) ---------- */
self.addEventListener('message', (e) => {
  if (e.data === 'retry-sync') {
    self.registration.sync?.register('api-sync').catch(() => {});
  }
});
// (end of v3 sw.js logic)

async function networkFirst(request, runtimeCacheName){
  const cache = await caches.open(runtimeCacheName);
  try {
    const fresh = await fetch(request);
    if(fresh && fresh.status === 200){
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch (err){
    const cached = await cache.match(request);
    if(cached) return cached;
    if(request.mode === 'navigate'){
      return caches.match('./offline.html');
    }
    throw err;
  }
}

async function cacheFirstLimit(request, runtimeCacheName, maxEntries){
  const cache = await caches.open(runtimeCacheName);
  const cached = await cache.match(request);
  if(cached) return cached;
  try {
    const response = await fetch(request);
    if(response && response.status === 200){
      await cache.put(request, response.clone());
      // Enforce LRU-like trim
      trimCache(cache, maxEntries);
    }
    return response;
  } catch (e){
    // Last resort fallback to offline page for navigation images (unlikely)
    return caches.match('./offline.html');
  }
}

async function trimCache(cache, maxEntries){
  const keys = await cache.keys();
  if(keys.length <= maxEntries) return;
  const toDelete = keys.slice(0, keys.length - maxEntries);
  await Promise.all(toDelete.map(k => cache.delete(k)));
}

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  if(url.origin !== self.location.origin) return; // ignore cross-origin

  // Navigation requests: network-first for freshness, fallback offline
  if(request.mode === 'navigate'){
    event.respondWith(networkFirst(request, RUNTIME_PAGE));
    return;
  }

  // Styles & Scripts: stale-while-revalidate
  if(request.destination === 'style' || request.destination === 'script'){
    event.respondWith(staleWhileRevalidate(request, RUNTIME_ASSET));
    return;
  }

  // Images: cache-first with size limit
  if(request.destination === 'image'){
    event.respondWith((async () => {
      try {
        return await cacheFirstLimit(request, RUNTIME_IMG, IMG_CACHE_MAX_ENTRIES);
      } catch (e){
        // Fallback inline SVG placeholder
        const body = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="%23e5e7eb"/><text x="50%" y="50%" font-size="20" text-anchor="middle" fill="%236b7280" dy=".35em">offline</text></svg>`;
        return new Response(body, { headers:{ 'Content-Type':'image/svg+xml', 'Cache-Control':'no-store' } });
      }
    })());
    return;
  }

  // Default: try network, fall back to precache/runtimes
  event.respondWith(
    fetch(request).catch(() => caches.match(request) || caches.match('./offline.html'))
  );
});


// Handle notification clicks for PWA notifications
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const route = event.notification?.data?.route || "/index.html";
  const action = event.action;

  event.waitUntil((async () => {
    // Broadcast snooze message to any client
    if (action === "snooze-1h") {
      const all = await clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const c of all) c.postMessage?.({ type: "SNOOZE_FOR", minutes: 60 });
    }

    const all = await clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of all) {
      if ("focus" in c) { c.navigate(route); c.focus(); return; }
    }
    if (clients.openWindow) await clients.openWindow(route);
  })());
});
