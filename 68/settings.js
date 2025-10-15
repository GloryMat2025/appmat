// src/utils/settings.js
const KEY = "myapp.settings";
const SESSION_KEY = "myapp.adminSession";

// Defaults
const DEFAULTS = {
  // Sampling (0..1 where 1 = send all)
  analyticsSamplingDefault: 1,     // global default rate
  analyticsSamplingRules: {},      // per-kind overrides: { "order_status": 0.5, "test_event": 0 }
  adminPinHash: null,            // null → uses default PIN "1234"
  requireVerifiedTokens: false,  // if true, legacy unsigned tokens are rejected
  allowLegacyFallback: true,     // ignored if requireVerifiedTokens = true
  requireAdminForShortLinks: false, // if true, admin PIN required for Short Links page
  theme: "system",              // "light", "dark", or "system"
  currency: "MYR",
  dateStyle: "medium",   // "short" | "medium" | "long" | "full"
  timeStyle: "short",    // "short" | "medium" | "long"

  // Notifications policy (global)
  notificationsEnabled: false,
  notifyKinds: { status: true, eta: true },   // per-category switches
  quietHoursEnabled: false,
  quietStart: "22:00",   // 24h "HH:MM"
  quietEnd: "08:00",

  // Business profile for tax invoice
  companyName: "MyApp Sdn Bhd",
  companyRegNo: "202101234567 (1234567-T)",
  companyTaxId: "SST: 12-3456789-10",
  companyAddress1: "Level 10, Tower A",
  companyAddress2: "KL Sentral",
  companyCity: "Kuala Lumpur",
  companyPostcode: "50470",
  companyState: "WP Kuala Lumpur",
  invoicePrefix: "INV-",
  invoiceNext: 1,
  invoiceScheme: "sequential",  // "sequential" | "date"
  // --- Analytics & Sync ---
  analyticsEndpoint: "",   // e.g., https://your-endpoint.example/collect
  analyticsToken: "",
  bgSyncEnabled: true,
  bgSyncPeriodic: false,
  bgSyncPeriodMins: 60,

  // NEW: batching + backoff + privacy
  analyticsBatched: true,
  analyticsBatchSize: 25,           // 1..100
  analyticsBackoffBaseMs: 3000,     // 3s
  analyticsBackoffMaxMs: 5 * 60 * 1000, // 5m
  analyticsBackoffJitter: 0.25,     // ±25%
  analyticsPrivacyMode: "strip_pii", // "none" | "strip_pii" | "allowlist" | "denylist"
  analyticsAllowlist: [],           // e.g. ["invoiceNo","orderId","status","total"]
  analyticsDenylist: ["name","phone","email","address","address1","address2","postcode","city","state","tax"],

  // Transport
  analyticsTransport: "json",   // "json" | "ndjson"

  // Kind filters (drop before send)
  analyticsKindAllow: [],       // e.g. ["order_status","invoice_issued"]
  analyticsKindDeny:  [],       // e.g. ["test_event"]

  // Feature flags
  featureFlags: {
    pwa: true,
    notifications: true,
    analytics: true,
    backup: true,
    coreMode: false,
  },
};

// Notification policy guard
export function getNotifyPolicy() {
  const s = getSettings();
  return {
    enabled: !!s.notificationsEnabled,
    kinds: s.notifyKinds || { status: true, eta: true },
    quiet: {
      enabled: !!s.quietHoursEnabled,
      start: s.quietStart || "22:00",
      end: s.quietEnd || "08:00",
    }
  };
}

export function getThemeSetting() {
  return load().theme || "system";
}

export function setThemeSetting(theme) {
  setSettings({ theme });
}
export function requireAdminForShortLinks() {
  return !!load().requireAdminForShortLinks;
}

function load() {
  try { return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(KEY)) || {}) }; }
  catch { return { ...DEFAULTS }; }
}
function save(obj) {
  localStorage.setItem(KEY, JSON.stringify(obj));
}

export function getSettings() { return load(); }
export function setSettings(patch) {
  const cur = load();
  const nxt = { ...cur, ...patch };
  save(nxt);
  return nxt;
}

// --- Admin session (simple, local) ---
export function isAdminAuthed() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)) === true; }
  catch { return false; }
}
export function setAdminAuthed(v) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(!!v));
}

// --- PIN hashing (very light: not for production security) ---
async function sha256(str) {
  const data = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
}

// Validate PIN; if no custom hash set, default PIN = "1234"
export async function verifyPin(pin) {
  const s = load();
  const incoming = await sha256(pin);
  const target = s.adminPinHash || await sha256("1234");
  return incoming === target;
}

// Set a new admin PIN
export async function setAdminPin(pin) {
  const hash = await sha256(pin);
  setSettings({ adminPinHash: hash });
  return true;
}
