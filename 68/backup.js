// src/utils/backup.js
// Backup & restore for MyApp — pure browser (LocalStorage + IDB outbox).
// Optional encryption: AES-GCM with PBKDF2 (WebCrypto).

const APP = "MyApp Orders";
const VERSION = "1.0.0";
const FILE_MIME = "application/json";
const FILE_EXT = ".myapp.json";

// ----- WHAT WE BACKUP -----
const LS_KEYS = {
  settings:        ["myapp.settings", "myapp.flags"],    // if present
  promos:          ["myapp.promos"],
  loyalty:         ["myapp.loyalty"],
  scheduleConfig:  ["myapp.schedule.cfg"],
  scheduleOutlet:  ["myapp.schedule.outlet"],
  outlets:         ["myapp.outlets"],
  orders:          ["myapp.orders"],
  shortlinks:      ["myapp.shortlinks"],
};
const IDB_DB = "myapp-db";
const IDB_OUTBOX = "outbox";

export function defaultBackupPlan() {
  return { settings:true, promos:true, loyalty:true, scheduleConfig:true, scheduleOutlet:true, outlets:true, orders:true, shortlinks:true, outbox:true };
}

// ----- EXPORT -----
export async function exportBackup(plan = defaultBackupPlan(), { encryptWith = "" } = {}) {
  const payload = { meta: meta(), data: { localStorage:{}, idb:{ outbox:[] } } };

  // gather LS
  for (const [group, keys] of Object.entries(LS_KEYS)) {
    if (!plan[group]) continue;
    for (const k of keys) {
      const v = localStorage.getItem(k);
      if (v != null) payload.data.localStorage[k] = v;
    }
  }

  // gather IDB outbox
  if (plan.outbox) payload.data.idb.outbox = await idbAllOutbox();

  // stringify
  const clearText = JSON.stringify(payload);

  if (!encryptWith) {
    return { filename: suggestFilename(false), blob: new Blob([clearText], { type: FILE_MIME }), encrypted: false };
  }

  const { cipherB64, saltB64, ivB64, iter } = await encryptString(clearText, encryptWith);
  const encPack = JSON.stringify({ meta: payload.meta, enc: { alg:"AES-GCM", salt:saltB64, iv:ivB64, iterations:iter }, cipher: cipherB64 });
  return { filename: suggestFilename(true), blob: new Blob([encPack], { type: FILE_MIME }), encrypted: true };
}

// ----- IMPORT -----
export async function importBackup(fileOrText, { passphrase = "" } = {}) {
  const text = typeof fileOrText === "string" ? fileOrText : await readFileText(fileOrText);
  let raw;
  try {
    const probe = JSON.parse(text);
    if (probe && probe.enc && probe.cipher) {
      if (!passphrase) throw new Error("This backup is encrypted. A passphrase is required.");
      const clear = await decryptString(probe.cipher, passphrase, probe.enc.salt, probe.enc.iv, probe.enc.iterations);
      raw = JSON.parse(clear);
    } else {
      raw = probe;
    }
  } catch (e) {
    throw new Error("Invalid backup file.");
  }

  if (!raw?.data) throw new Error("Backup file missing data.");
  const { localStorage: ls = {}, idb: idb = {} } = raw.data;

  // Write LS (replace existing keys contained in the backup)
  for (const k of Object.keys(ls)) localStorage.setItem(k, ls[k]);

  // Restore IDB outbox (append, avoid duplicates by naive JSON string key)
  if (Array.isArray(idb.outbox)) {
    const existing = await idbAllOutbox();
    const seen = new Set(existing.map(x => JSON.stringify([x.url,x.method,x.body])));
    for (const item of idb.outbox) {
      const sig = JSON.stringify([item.url,item.method,item.body]);
      if (!seen.has(sig)) await idbAddOutbox(item);
    }
  }

  return { ok:true, meta: raw.meta };
}

// ----- Utilities -----
function meta(){
  return { app: APP, version: VERSION, ts: Date.now(), ua: navigator.userAgent };
}
function suggestFilename(encrypted){ 
  const d = new Date(); const stamp = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}_${String(d.getHours()).padStart(2,"0")}${String(d.getMinutes()).padStart(2,"0")}`;
  return `myapp-backup_${stamp}${encrypted ? ".enc" : ""}${FILE_EXT}`;
}
function readFileText(file){
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result || "")); r.onerror = rej; r.readAsText(file); });
}

// ----- IDB outbox I/O (same store used by SW) -----
function idbOpen(){
  return new Promise((res, rej) => {
    const req = indexedDB.open(IDB_DB, 1);
    req.onupgradeneeded = () => { const db = req.result; if (!db.objectStoreNames.contains(IDB_OUTBOX)) db.createObjectStore(IDB_OUTBOX, { keyPath: "id", autoIncrement: true }); };
    req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error);
  });
}
async function idbAllOutbox(limit=500){
  const db = await idbOpen();
  return new Promise((res, rej) => {
    const r=[]; const tx=db.transaction(IDB_OUTBOX,"readonly"); const s=tx.objectStore(IDB_OUTBOX).openCursor();
    s.onsuccess = () => { const c = s.result; if (c && r.length < limit) { r.push({id:c.key, ...c.value}); c.continue(); } else res(r); };
    s.onerror = () => rej(s.error);
  });
}
async function idbAddOutbox(item){
  const db = await idbOpen();
  return new Promise((res, rej) => { const tx=db.transaction(IDB_OUTBOX,"readwrite"); tx.objectStore(IDB_OUTBOX).add(item); tx.oncomplete=()=>res(); tx.onerror=()=>rej(tx.error); });
}

// ----- Crypto helpers (AES-GCM 256 + PBKDF2) -----
async function encryptString(plain, pass){ 
  const enc = new TextEncoder().encode(plain);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const iter = 120000;
  const key = await deriveKey(pass, salt, iter);
  const buf = await crypto.subtle.encrypt({ name:"AES-GCM", iv }, key, enc);
  return { cipherB64: b64enc(new Uint8Array(buf)), saltB64: b64enc(salt), ivB64: b64enc(iv), iter };
}
async function decryptString(cipherB64, pass, saltB64, ivB64, iter){
  const key = await deriveKey(pass, b64dec(saltB64), iter);
  const buf = await crypto.subtle.decrypt({ name:"AES-GCM", iv: b64dec(ivB64) }, key, b64dec(cipherB64));
  return new TextDecoder().decode(buf);
}
async function deriveKey(pass, salt, iterations){
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name:"PBKDF2", salt, iterations, hash:"SHA-256" },
    base, { name:"AES-GCM", length:256 }, false, ["encrypt","decrypt"]
  );
}
function b64enc(u8){ let s=""; u8.forEach(b=> s+=String.fromCharCode(b)); return btoa(s); }
function b64dec(str){ const bin = atob(str); const u8 = new Uint8Array(bin.length); for (let i=0;i<bin.length;i++) u8[i]=bin.charCodeAt(i); return u8; }
const b64 = {
  enc: (u8) => btoa(String.fromCharCode(...u8)),
  dec: (s) => new Uint8Array(atob(s).split("").map(c => c.charCodeAt(0))),
};

export async function exportBackup(options = {}, { encrypt = false, passphrase = "" } = {}) {
  const data = await makeBackup(options);
  const json = new TextEncoder().encode(JSON.stringify(data));

  if (!encrypt || !passphrase || !crypto?.subtle) {
    // Plain JSON
    return { mime: "application/json", filename: `myapp-backup-${Date.now()}.myapp.json`, bytes: json };
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const key  = await deriveKey(passphrase, salt);
  const ct   = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, json));

  const envelope = {
    magic: "MYAPPBK1",
    algo: "AES-GCM",
    salt: b64.enc(salt),
    iv:   b64.enc(iv),
    body: b64.enc(ct),
    meta: data.__meta,
  };
  const bytes = new TextEncoder().encode(JSON.stringify(envelope));
  return { mime: "application/octet-stream", filename: `myapp-backup-${Date.now()}.myapp.enc`, bytes };
}

export async function importBackup(fileOrText, {
  passphrase = "",
  mode = "merge", // "merge" | "replace"
  acceptPlainIfEncrypted = false,
} = {}) {
  const text = typeof fileOrText === "string"
    ? fileOrText
    : await fileOrText.text();

  let obj;
  try { obj = JSON.parse(text); }
  catch { throw new Error("Invalid file: not JSON."); }

  // Encrypted envelope?
  if (obj && obj.magic === "MYAPPBK1") {
    if (!crypto?.subtle) throw new Error("This browser cannot decrypt backups.");
    if (!passphrase) throw new Error("Passphrase required for this backup.");

    const salt = b64.dec(obj.salt);
    const iv   = b64.dec(obj.iv);
    const body = b64.dec(obj.body);
    try {
      const key = await deriveKey(passphrase, salt);
      const pt  = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, body);
      obj = JSON.parse(new TextDecoder().decode(pt));
    } catch (e) {
      if (acceptPlainIfEncrypted) {
        // Fall through to treat as plain (not recommended)
      } else {
        throw new Error("Decryption failed. Check your passphrase.");
      }
    }
  }

  if (!obj || obj.__meta?.kind !== "backup") throw new Error("Not a MyApp backup.");
  const data = obj;

  // Apply
  if (mode === "replace") {
    // Clear app namespace in localStorage
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith("myapp.") || EXTRA_LS_KEYS.includes(k))) toRemove.push(k);
    }
    toRemove.forEach(k => localStorage.removeItem(k));
    await outboxClear();
    await logClear();
  }

  // localStorage
  if (data.localStorage && typeof data.localStorage === "object") {
    for (const [k, v] of Object.entries(data.localStorage)) {
      localStorage.setItem(k, v);
    }
  }

  // IndexedDB
  if (Array.isArray(data.idb?.outbox)) {
    // append; keeping retry info if present
    for (const r of data.idb.outbox) {
      const { kind, payload, createdAt } = r || {};
      if (!kind) continue;
      await outboxAdd({ kind, payload, createdAt });
    }
  }
  if (Array.isArray(data.idb?.logs)) {
    for (const r of data.idb.logs) {
      await logAdd(r);
    }
  }

  return { ok: true, restored: { ls: Object.keys(data.localStorage || {}).length, outbox: data.idb?.outbox?.length || 0, logs: data.idb?.logs?.length || 0 } };
}

// Utility to trigger browser download
export function downloadBytes({ bytes, filename, mime }) {
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// Factory reset: nuke app-local data
export async function factoryReset() {
  const kill = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && (k.startsWith("myapp.") || EXTRA_LS_KEYS.includes(k))) kill.push(k);
  }
  kill.forEach(k => localStorage.removeItem(k));
  await outboxClear();
  await logClear();
  // session-only entries (e.g., admin auth)
  try { sessionStorage.clear(); } catch {}
  return true;
}
