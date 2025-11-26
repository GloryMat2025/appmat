const CACHE_NAME = "appmat-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/assets/js/init.js",
  "/assets/js/app.js",
  "/assets/css/style.css",
  "/components/header.html",
  "/components/footer.html",
  "/components/sidebar.html",
  "/offline.html",
];

// Install event – cache key assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
  console.log("✅ Service Worker installed and assets cached.");
});

// Activate event – clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => key !== CACHE_NAME && caches.delete(key))
      )
    )
  );
  self.clients.claim();
  console.log("♻️ Service Worker activated.");
});

// Fetch event – serve cached first, fallback to network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then(
      (cachedResponse) =>
        cachedResponse ||
        fetch(event.request).catch(() => caches.match("/offline.html"))
    )
  );
});
// 🛰️ Background Sync for failed POST requests (e.g. orders)
const QUEUE_NAME = "appmat-sync-queue";

// Intercept failed POSTs
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "POST") return;

  event.respondWith(
    fetch(event.request.clone()).catch(async () => {
      const body = await event.request.clone().json().catch(() => null);
      const db = await openDB();
      const tx = db.transaction(QUEUE_NAME, "readwrite");
      tx.objectStore(QUEUE_NAME).add({ url: event.request.url, body });
      await tx.done;
      console.log("📦 Saved request for later sync:", event.request.url);
      return new Response(
        JSON.stringify({ message: "Saved offline. Will sync later." }),
        { status: 202, headers: { "Content-Type": "application/json" } }
      );
    })
  );
});

// Open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("appmat-sync-db", 1);
    req.onupgradeneeded = () =>
      req.result.createObjectStore(QUEUE_NAME, { autoIncrement: true });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Register background sync when back online
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-orders") {
    event.waitUntil(processQueue());
  }
});

async function processQueue() {
  const db = await openDB();
  const tx = db.transaction(QUEUE_NAME, "readonly");
  const store = tx.objectStore(QUEUE_NAME);
  const requests = await store.getAll();

  for (const req of requests) {
    try {
      await fetch(req.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });
      console.log("✅ Synced:", req.url);
    } catch (err) {
      console.warn("⚠️ Retry failed:", req.url, err);
    }
  }

  // Clear queue after sync
  const clearTx = db.transaction(QUEUE_NAME, "readwrite");
  clearTx.objectStore(QUEUE_NAME).clear();
  await clearTx.done;
  console.log("🧹 Queue cleared after sync.");
}
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "📢 AppMat Notification";
  const options = {
    body: data.body || "Ada kemas kini baru dalam AppMat.",
    icon: "/assets/icons/icon-192.png",
    badge: "/assets/icons/icon-192.png",
    data: data.url || "/",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Klik notifikasi → buka link
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data));
});
