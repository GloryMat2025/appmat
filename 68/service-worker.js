// --- Notifications via postMessage ---
self.addEventListener("message", (event) => {
  const msg = event.data || {};
  if (msg.type === "SHOW_NOTIFICATION" && msg.payload) {
    const { title, body, tag, actions = [], data = {} } = msg.payload;
    self.registration.showNotification(title || "MyApp", {
      body, tag, data, actions, icon: "./public/icons/icon-192.png", badge: "./public/icons/icon-192.png"
    });
  }
});

// Click actions: focus an existing client or open the app
self.addEventListener("notificationclick", (event) => {
  const url = "./index.html#/" + (event.notification?.data?.route || "kitchen");
  event.notification.close();
  event.waitUntil((async () => {
    const all = await clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of all) {
      if ("focus" in c) { c.navigate(url).then(()=>c.focus()); return; }
    }
    await clients.openWindow(url);
  })());
});

/* global self, clients */
const VERSION = "v1.0.0";
const APP_SHELL = [
  "./index.html",
  "./public/offline.html",
  "./public/manifest.webmanifest",
  "./styles/print.css",
  "./styles/kds.css",
  // add your built bundles if you have a build step, or list key JS files:
  "./src/main.js"
];

const STATIC_CACHE = `static-${VERSION}`;
const RUNTIME_CACHE = `runtime-${VERSION}`;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(STATIC_CACHE).then(c => c.addAll(APP_SHELL)).then(()=> self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async ()=>{
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => ![STATIC_CACHE, RUNTIME_CACHE].includes(k)).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Minimal IDB in SW context (no external deps)
const DBN = "myapp-db"; const OBOX = "outbox";
function idbOpen(){
  return new Promise((res, rej) => {
    const req = indexedDB.open(DBN, 1);
    req.onupgradeneeded = () => { const db = req.result; if (!db.objectStoreNames.contains(OBOX)) db.createObjectStore(OBOX, { keyPath: "id", autoIncrement: true }); };
    req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error);
  });
}
function obPut(item){ return idbOpen().then(db => new Promise((res,rej)=>{ const t=db.transaction(OBOX,"readwrite"); t.objectStore(OBOX).add(item); t.oncomplete=()=>res(); t.onerror=()=>rej(t.error);})); }
function obAll(limit=25){ return idbOpen().then(db=> new Promise((res,rej)=>{ const r=[]; const c=db.transaction(OBOX,"readonly").objectStore(OBOX).openCursor(); c.onsuccess=()=>{ const cur=c.result; if (cur && r.length<limit){ r.push({ id: cur.key, ...cur.value }); cur.continue(); } else res(r); }; c.onerror=()=>rej(c.error); })); }
function obDel(id){ return idbOpen().then(db=> new Promise((res,rej)=>{ const t=db.transaction(OBOX,"readwrite"); t.objectStore(OBOX).delete(id); t.oncomplete=()=>res(); t.onerror=()=>rej(t.error);})); }

// Strategy helpers
async function cacheFirst(req) {
  const cache = await caches.open(RUNTIME_CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  try {
    const net = await fetch(req);
    if (net && net.ok && req.method === "GET") cache.put(req, net.clone());
    return net;
  } catch {
    // offline HTML fallback for navigations
    if (req.mode === "navigate") return caches.match("./public/offline.html");
    return new Response("Offline", { status: 503 });
  }
}
async function networkFirst(req) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const net = await fetch(req);
    if (net && req.method === "GET") cache.put(req, net.clone());
    return net;
  } catch {
    const hit = await cache.match(req);
    if (hit) return hit;
    if (req.mode === "navigate") return caches.match("./public/offline.html");
    return new Response("Offline", { status: 503 });
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin
  if (url.origin !== self.location.origin) return;

  // HTML navigations → network-first (with offline fallback)
  if (req.mode === "navigate") {
    event.respondWith(networkFirst(req));
    return;
  }

  // Static assets → cache-first
  if (req.method === "GET" && /\.(?:js|css|png|jpg|jpeg|gif|svg|webp|ico)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // API writes → try network, else queue to outbox
  if (["POST","PUT","PATCH","DELETE"].includes(req.method)) {
    event.respondWith((async ()=>{
      try { return await fetch(req.clone()); }
      catch (e) {
        // Clone body for re-send; assume JSON or text
        let body = null;
        try { body = await req.clone().text(); } catch {}
        await obPut({ url: req.url, method: req.method, headers: [...req.headers.entries()], body, ts: Date.now() });
        // Register background sync
        try { const reg = await self.registration.sync.register("outbox-sync"); } catch {}
        return new Response(JSON.stringify({ queued:true }), { status: 202, headers: { "Content-Type":"application/json" } });
      }
    })());
    return;
  }

  // default: network-first
  event.respondWith(networkFirst(req));
});

// Background Sync: flush queued requests
self.addEventListener("sync", (e) => {
  if (e.tag === "outbox-sync") {
    e.waitUntil(flushOutbox());
  }
});

async function flushOutbox() {
  const batch = await obAll(50);
  for (const item of batch) {
    try {
      const res = await fetch(item.url, { method: item.method, headers: item.headers, body: item.body });
      if (!res.ok) continue; // keep for retry
      await obDel(item.id);
    } catch {/* stay in queue */}
  }
}
