
import { getNotifyPolicy } from "./settings.js";

const LS = "myapp.notify.settings";
const LOG = "myapp.notify.log"; // ring buffer in LS

const DEFAULTS = {
  enabled: true,
  sound: true,
  badge: true,
  wakeLockInKitchen: false,
  leadMinutesReminder: 10, // scheduled slot reminder before time
};

export function getNotifySettings() {
  try { return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(LS) || "{}")) }; }
  catch { return DEFAULTS; }
}
export function setNotifySettings(patch) {
  const next = { ...getNotifySettings(), ...(patch||{}) };
  try { localStorage.setItem(LS, JSON.stringify(next)); } catch {}
  return next;
}

export async function ensurePermission() {
  const s = getNotifySettings();
  if (!s.enabled || !("Notification" in window)) return { ok:false, reason:"disabled" };
  if (Notification.permission === "granted") return { ok:true };
  if (Notification.permission === "denied") return { ok:false, reason:"denied" };
  const perm = await Notification.requestPermission();
  return { ok: perm === "granted" };
}

export async function notify({ title, body, tag = "", actions = [], data = {} }) {
  const s = getNotifySettings();
  if (!s.enabled) return;
  // Log in local storage (Notification Center)
  addToLog({ ts: Date.now(), title, body });

  // Try SW-based notification (works in background)
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage({ type: "SHOW_NOTIFICATION", payload: { title, body, tag, actions, data } });
  } else if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, tag });
  }

  // Optional sound cue
  if (s.sound) try { chime(); } catch {}
}

export function setAppBadge(n) {
  const s = getNotifySettings();
  if (!s.badge) return;
  const nav = navigator;
  if (nav.setAppBadge) nav.setAppBadge(Math.max(0, Number(n||0))).catch(()=>{});
  else if (nav.setClientBadge) nav.setClientBadge(true).catch(()=>{});
}
export function clearAppBadge() {
  const nav = navigator;
  if (nav.clearAppBadge) nav.clearAppBadge().catch(()=>{});
  else if (nav.setClientBadge) nav.setClientBadge(false).catch(()=>{});
}

export async function maybeWakeLock(enable) {
  const s = getNotifySettings();
  if (!s.wakeLockInKitchen) return null;
  if (!("wakeLock" in navigator)) return null;
  try {
    if (enable) {
      const lock = await navigator.wakeLock.request("screen");
      lock.addEventListener("release", ()=>{});
      return lock;
    }
  } catch {}
  return null;
}

/* ---- In-app notification log ---- */
export function getLog(limit = 50) {
  try { const a = JSON.parse(localStorage.getItem(LOG) || "[]"); return a.slice(0, limit); }
  catch { return []; }
}
function addToLog(entry) {
  try {
    const a = getLog(200);
    a.unshift(entry);
    localStorage.setItem(LOG, JSON.stringify(a.slice(0, 200)));
  } catch {}
}

/* ---- tiny chime ---- */
function chime() {
  const ctx = new (window.AudioContext||window.webkitAudioContext)();
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type="triangle"; o.frequency.value=987; o.connect(g); g.connect(ctx.destination);
  g.gain.value = 0.0001; o.start();
  g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
  o.stop(ctx.currentTime + 0.24);
}
