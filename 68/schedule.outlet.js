// src/utils/schedule.outlet.js
// Per-outlet schedule config stores. Merges with global schedule.
const LS_OUTLET = "myapp.schedule.outlet"; // { [id]: { ...cfg } }

export function getOutletScheduleMap() {
  try { return JSON.parse(localStorage.getItem(LS_OUTLET) || "{}"); } catch { return {}; }
}
export function getOutletSchedule(outletId) {
  const map = getOutletScheduleMap(); return map[String(outletId)] || null;
}
export function setOutletSchedule(outletId, patch) {
  const map = getOutletScheduleMap();
  const prev = map[String(outletId)] || {};
  map[String(outletId)] = { ...prev, ...(patch||{}) };
  try { localStorage.setItem(LS_OUTLET, JSON.stringify(map)); } catch {}
  return map[String(outletId)];
}
