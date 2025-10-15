// src/utils/outbox.js
const DBN = "myapp-db"; const OBOX = "outbox";
export function idbOpen() {
  return new Promise((res, rej) => {
    const req = indexedDB.open(DBN, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(OBOX)) db.createObjectStore(OBOX, { keyPath: "id", autoIncrement: true });
    };
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}
export async function obPut(item) { const db = await idbOpen(); return tx(db, "readwrite", s => s.add(item)); }
export async function obAll(limit=50) { const db = await idbOpen(); return tx(db, "readonly", s => new Promise((res,rej)=>{ const r=[]; const c=s.openCursor(); c.onsuccess=()=>{ const cur=c.result; if (cur && r.length<limit){ r.push({id:cur.key, ...cur.value}); cur.continue(); } else res(r); }; c.onerror=()=>rej(c.error); })); }
export async function obDel(id) { const db = await idbOpen(); return tx(db, "readwrite", s => s.delete(id)); }

function tx(db, mode, run){ return new Promise((res,rej)=>{ const t=db.transaction(OBOX, mode); const s=t.objectStore(OBOX); Promise.resolve(run(s)).then(v=>t.oncomplete=()=>res(v)).catch(rej); t.onerror=()=>rej(t.error); }); }
