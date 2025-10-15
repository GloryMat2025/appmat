const DB_NAME = "myapp-db";
const DB_VER  = 2;                    // ← bump
const STORE_OUTBOX = "outbox";
const STORE_LOGS   = "logs";          // ← NEW

function withDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_OUTBOX)) {
        const s = db.createObjectStore(STORE_OUTBOX, { keyPath: "id", autoIncrement: true });
        s.createIndex("byKind", "kind");
        s.createIndex("byCreatedAt", "createdAt");
      }
      if (!db.objectStoreNames.contains(STORE_LOGS)) {
        const l = db.createObjectStore(STORE_LOGS, { keyPath: "id", autoIncrement: true });
        l.createIndex("byTs", "ts");
        l.createIndex("byType", "type");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// --- Outbox helpers ---
export async function outboxAdd(record) {
  const db = await withDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_OUTBOX, "readwrite");
    // When adding to outbox, include retry fields
    // Example usage:
    // tx.objectStore(STORE_OUTBOX).add({ ...record, createdAt: Date.now(), retryCount: 0, nextAttemptAt: 0 });
    tx.objectStore(STORE_OUTBOX).add({ ...record, createdAt: Date.now(), retryCount: 0, nextAttemptAt: 0 });
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
export async function outboxAll() {
  const db = await withDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_OUTBOX, "readonly");
    const req = tx.objectStore(STORE_OUTBOX).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
export async function outboxRemove(id) {
  const db = await withDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_OUTBOX, "readwrite");
    tx.objectStore(STORE_OUTBOX).delete(id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
export async function outboxClear() {
  const db = await withDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_OUTBOX, "readwrite");
    tx.objectStore(STORE_OUTBOX).clear();
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

// NEW: update helper for outbox
export async function outboxUpdate(record) {
  const db = await withDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_OUTBOX, "readwrite");
    tx.objectStore(STORE_OUTBOX).put(record);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

// --- Logs helpers ---
export async function logAdd(entry) {
  const db = await withDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_LOGS, "readwrite");
    tx.objectStore(STORE_LOGS).add({ ...entry, ts: entry?.ts || Date.now() });
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
export async function logAll(limit = 500) {
  const db = await withDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_LOGS, "readonly");
    const req = tx.objectStore(STORE_LOGS).getAll();
    req.onsuccess = () => {
      const arr = (req.result || []).sort((a,b)=>b.ts-a.ts);
      resolve(arr.slice(0, limit));
    };
    req.onerror = () => reject(req.error);
  });
}
export async function logClear() {
  const db = await withDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_LOGS, "readwrite");
    tx.objectStore(STORE_LOGS).clear();
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
