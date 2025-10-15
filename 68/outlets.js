// src/utils/outlets.js
const LS = "myapp.outlets";

export function getOutlets() {
  try { const a = JSON.parse(localStorage.getItem(LS) || "[]"); return Array.isArray(a) ? a : []; }
  catch { return []; }
}
export function saveOutlets(arr) {
  try { localStorage.setItem(LS, JSON.stringify(arr || [])); } catch {}
}
export function upsertOutlet(o) {
  const list = getOutlets();
  const id = String(o.id || genId());
  const i = list.findIndex(x => String(x.id) === id);
  const next = { id, name: o.name || "Outlet", addr: o.addr || "", tz: o.tz || guessTZ(), isPrimary: !!o.isPrimary };
  if (i >= 0) list[i] = { ...list[i], ...next };
  else list.push(next);
  // Ensure single primary
  if (next.isPrimary) list.forEach(x => { if (x.id !== id) x.isPrimary = false; });
  saveOutlets(list);
  return id;
}
export function removeOutlet(id) {
  const list = getOutlets().filter(x => String(x.id) !== String(id));
  // if none left, seed one
  if (!list.length) list.push({ id: genId(), name: "Main Outlet", addr:"", tz: guessTZ(), isPrimary: true });
  // ensure one primary
  if (!list.some(x => x.isPrimary)) list[0].isPrimary = true;
  saveOutlets(list);
}
export function getPrimaryOutletId() {
  const list = getOutlets(); return (list.find(x => x.isPrimary) || list[0] || {}).id;
}
export function setPrimaryOutlet(id) {
  const list = getOutlets().map(x => ({ ...x, isPrimary: String(x.id) === String(id) }));
  saveOutlets(list);
}
export function findOutlet(id) { return getOutlets().find(x => String(x.id) === String(id)) || null; }

function genId(){ return Math.random().toString(36).slice(2,9).toUpperCase(); }
function guessTZ(){ return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; }
