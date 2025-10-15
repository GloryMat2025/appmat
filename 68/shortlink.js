// src/utils/shortlink.js
const LS_KEY = "myapp.shortlinks"; // { id: { payload, ts } }

export function sl_all() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; }
}
export function sl_put(id, payload) {
  const all = sl_all();
  all[id] = { payload, ts: Date.now() };
  try { localStorage.setItem(LS_KEY, JSON.stringify(all)); } catch {}
  return id;
}
export function sl_get(id) {
  const all = sl_all(); return all[id]?.payload || null;
}
export function sl_del(id) {
  const all = sl_all(); delete all[id];
  try { localStorage.setItem(LS_KEY, JSON.stringify(all)); } catch {}
}
export function sl_newId(len=6) {
  const ALPH = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i=0;i<len;i++) s += ALPH[Math.floor(Math.random()*ALPH.length)];
  return s;
}
