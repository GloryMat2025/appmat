
// src/utils/schedule.js
// Business hours, slots, caps, blackouts, and helpers.
import { getOutletSchedule } from "./schedule.outlet.js";
import { findOutlet, getPrimaryOutletId } from "./outlets.js";
// Compute effective config for an outlet (or global)
export function getEffectiveScheduleConfig(outletId = null) {
  const base = getScheduleConfig();
  const outletCfg = outletId ? getOutletSchedule(outletId) : null;
  if (!outletCfg) return base;
  // Merge shallowly; arrays (hours/blackouts) fully override if present
  return {
    ...base,
    ...outletCfg,
    hours: outletCfg.hours || base.hours,
    capacity: outletCfg.capacity || base.capacity,
    blackouts: outletCfg.blackouts || base.blackouts
  };
}

const LS_CFG = "myapp.schedule.cfg";

const DEFAULT_CFG = {
  slotMinutes: 15,
  leadMinutes: 30,
  tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  hours: {
    // 0..6 => Sunday..Saturday; each: [{start:"10:00", end:"23:00"}]
    "0": [{start:"10:00", end:"23:00"}], // Sunday
    "1": [{start:"10:00", end:"23:00"}], // Monday
    "2": [{start:"10:00", end:"23:00"}], // Tuesday
    "3": [{start:"10:00", end:"23:00"}], // Wednesday
    "4": [{start:"10:00", end:"23:00"}], // Thursday
    "5": [{start:"10:00", end:"23:00"}], // Friday
    "6": [{start:"10:00", end:"23:00"}]  // Saturday
  },
  capacity: { pickup: 6, delivery: 4 }, // max orders per slot per mode
  blackouts: [/* "2025-12-25", "2025-01-01" */],
};

export function getScheduleConfig() {
  try { return { ...DEFAULT_CFG, ...(JSON.parse(localStorage.getItem(LS_CFG) || "{}")) }; }
  catch { return DEFAULT_CFG; }
}
export function setScheduleConfig(patch) {
  const next = { ...getScheduleConfig(), ...(patch||{}) };
  try { localStorage.setItem(LS_CFG, JSON.stringify(next)); } catch {}
  return next;
}

export function isBlackout(dISO) {
  const cfg = getScheduleConfig();
  const yyyyMmDd = (iso)=> new Date(iso).toISOString().slice(0,10);
  return cfg.blackouts.some(b => b === yyyyMmDd(dISO));
}

// Generate slots (Date objects in local time) for a given date, with availability by mode and outlet.
export function generateSlots(dateISO, mode, { fromNow = new Date(), outletId = null } = {}) {
  const cfg = getEffectiveScheduleConfig(outletId || getPrimaryOutletId());
  if (outletId) cfg._forOutlet = outletId;
  const day = new Date(dateISO);
  if (isNaN(day)) return [];
  const yyyyMmDd = day.toISOString().slice(0,10);
  if (isBlackoutWithCfg(yyyyMmDd, cfg)) return [];
  const wd = day.getDay();
  const ranges = (cfg.hours || {})[String(wd)] || [];
  const slotMs = cfg.slotMinutes * 60_000;
  const lead = cfg.leadMinutes * 60_000;
  const cap = Number((cfg.capacity || {})[mode] || 0);

  const slots = [];
  for (const r of ranges) {
    const start = parseLocalTimeWithCfg(yyyyMmDd, r.start, cfg);
    const end   = parseLocalTimeWithCfg(yyyyMmDd, r.end, cfg);
    for (let t = +start; t < +end; t += slotMs) {
      const at = new Date(t);
      const isPastLead = (+at) >= (+fromNow + lead);
      slots.push({ at, iso: at.toISOString(), label: fmtHM(at), disabled: !isPastLead, full: false, cap });
    }
  }
  const occ = occupancyMapWithCfg(yyyyMmDd, mode, cfg);
  slots.forEach(s => {
    const key = slotKeyWithCfg(s.at, cfg.slotMinutes);
    const used = occ.get(key) || 0;
    s.used = used; s.full = used >= cap; s.disabled = s.disabled || s.full;
  });
  return slots;
}
// --- Outlet-aware helpers ---
function isBlackoutWithCfg(dISO, cfg) {
  const yyyyMmDd = (new Date(dISO)).toISOString().slice(0,10);
  return (cfg.blackouts||[]).some(b => b === yyyyMmDd);
}
function parseLocalTimeWithCfg(dateStr, hhmm /*, cfg */) {
  // Using local time; if you want per-outlet tz later, adjust here.
  const [H,M] = (hhmm || "00:00").split(":").map(Number);
  const d = new Date(dateStr + "T00:00:00");
  d.setHours(H, M, 0, 0); return d;
}
function slotKeyWithCfg(d, slotMinutes){ const ms = slotMinutes * 60_000; const t = Math.floor((+d)/ms)*ms; return new Date(t).toISOString(); }
function occupancyMapWithCfg(yyyyMmDd, mode, cfg) {
  const list = readOrdersSafe();
  const map = new Map();
  list.forEach(o => {
    if (!o?.scheduledAt) return;
    const d = new Date(o.scheduledAt);
    if (d.toISOString().slice(0,10) !== yyyyMmDd) return;
    if ((o.scheduledMode || o.mode || "delivery") !== mode) return;
    // filter per outlet if the order carries outletId
    if (o.outletId && cfg._forOutlet && String(o.outletId) !== String(cfg._forOutlet)) return;
    const k = slotKeyWithCfg(d, cfg.slotMinutes);
    map.set(k, (map.get(k) || 0) + 1);
  });
  return map;
}

// Mark selected slot into orderStore
export function selectSlot(orderStore, iso, mode) {
  const s = orderStore.getState?.() || {};
  orderStore.setState?.({ ...s, scheduledAt: iso, scheduledMode: mode });
  return true;
}

// Validate at submit time
export function validateSelectedSlot({ scheduledAt, mode }) {
  if (!scheduledAt) return { ok:false, reason:"missing" };
  const cfg = getScheduleConfig();
  const at = new Date(scheduledAt);
  const now = new Date();
  if ((+at) < (+now + cfg.leadMinutes * 60_000)) return { ok:false, reason:"lead" };
  // capacity check
  const occ = occupancyMap(at.toISOString().slice(0,10), mode);
  const key = slotKey(at);
  const used = occ.get(key) || 0;
  const cap = Number((cfg.capacity||{})[mode] || 0);
  if (used >= cap) return { ok:false, reason:"full" };
  if (isBlackout(at.toISOString())) return { ok:false, reason:"blackout" };
  // inside business hours?
  const wd = at.getDay(), h = (getScheduleConfig().hours[String(wd)] || []);
  const inRange = h.some(r => +parseLocalTimeDate(at, r.start) <= +at && +at < +parseLocalTimeDate(at, r.end));
  if (!inRange) return { ok:false, reason:"closed" };
  return { ok:true };
}

/* ---------- helpers ---------- */

// Build map of slotKey -> count from existing orders for that date+mode
function occupancyMap(yyyyMmDd, mode) {
  const list = readOrdersSafe();
  const cfg = getScheduleConfig();
  const map = new Map();
  list.forEach(o => {
    if (!o || !o.scheduledAt) return;
    const d = new Date(o.scheduledAt);
    if (d.toISOString().slice(0,10) !== yyyyMmDd) return;
    if ((o.scheduledMode || o.mode || "delivery") !== mode) return;
    const k = slotKey(d, cfg.slotMinutes);
    map.set(k, (map.get(k) || 0) + 1);
  });
  return map;
}
function slotKey(d, slotMinutes = getScheduleConfig().slotMinutes) {
  const ms = slotMinutes * 60_000;
  const t = Math.floor((+d) / ms) * ms;
  return new Date(t).toISOString();
}
function parseLocalTime(dateStr, hhmm) {
  const [H,M] = (hhmm || "00:00").split(":").map(Number);
  const d = new Date(dateStr + "T00:00:00");
  d.setHours(H, M, 0, 0);
  return d;
}
function parseLocalTimeDate(dateLike, hhmm) {
  const d0 = new Date(dateLike);
  const dateStr = d0.toISOString().slice(0,10);
  return parseLocalTime(dateStr, hhmm);
}
function fmtHM(d) {
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(d);
}
function readOrdersSafe() {
  // Best-effort: use store.orders, else localStorage
  try {
    const s = window.orderStore?.getState?.();
    if (Array.isArray(s?.orders)) return s.orders;
    const arr = JSON.parse(localStorage.getItem("myapp.orders") || "[]");
    if (Array.isArray(arr)) return arr;
  } catch {}
  return [];
}
