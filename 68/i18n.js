// src/utils/i18n.js
// Minimal i18n: language registry, interpolation, plural, dir, auto-translate.
import { getSettings, setSettings } from "./settings.js";

const REGISTRY = new Map(); // lang -> messages flat { "nav.menu": "Menu" }
const META = new Map();     // lang -> { dir: "ltr"|"rtl", name: "English" }

const FALLBACK = "en";
let current = null;

export function addLocale(lang, { messages = {}, dir = "ltr", name = lang } = {}) {
  META.set(lang, { dir, name });
  REGISTRY.set(lang, flatten(messages));
}

export function initI18n() {
  const s = getSettings();
  const lang = s.lang || pickDefaultLang();
  setLang(lang, /*persist*/ false);
}

export function getLang() { return current || FALLBACK; }

export function setLang(lang, persist = true) {
  if (!REGISTRY.has(lang)) lang = FALLBACK;
  current = lang;
  if (persist) setSettings({ lang });
  applyLangDir();
  // tiny global event for pages to re-render if they listen
  window.dispatchEvent(new CustomEvent("i18n:changed", { detail: { lang } }));
}

export function applyLangDir() {
  const { dir } = META.get(getLang()) || { dir: "ltr" };
  const html = document.documentElement;
  html.setAttribute("lang", getLang());
  html.setAttribute("dir", dir || "ltr");
}

// Translate with {placeholders}
export function t(key, vars = {}) {
  const lang = getLang();
  const primary = REGISTRY.get(lang) || {};
  const fallback = REGISTRY.get(FALLBACK) || {};
  let str = primary[key] ?? fallback[key] ?? key;
  return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
}

// Simple pluralizer: choose key.one / key.other by n
export function tp(keyBase, n, vars = {}) {
  const form = Number(n) === 1 ? "one" : "other";
  return t(`${keyBase}.${form}`, { ...vars, n });
}

// Auto-translate elements marked with [data-i18n="key"]
export function autoI18n(root = document) {
  root.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (!key) return;
    const text = t(key);
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      el.setAttribute("placeholder", text);
    } else {
      el.textContent = text;
    }
  });
}

// Helpers
function flatten(obj, path = "", out = {}) {
  for (const [k, v] of Object.entries(obj || {})) {
    const p = path ? `${path}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, p, out);
    else out[p] = String(v);
  }
  return out;
}
function pickDefaultLang() {
  const n = (navigator.language || "en").toLowerCase();
  const short = n.split("-")[0];
  if (REGISTRY.has(n)) return n;
  if (REGISTRY.has(short)) return short;
  return FALLBACK;
}

/* ---- Built-in locales: English (en) & Bahasa Melayu (ms) ---- */
addLocale("en", {
  app: { title: "MyApp Orders" },
  nav: { menu: "Menu", cart: "Cart", checkout: "Checkout", orders: "Orders", settings: "Settings" },
  order: {
    status: { preparing: "Preparing", ready: "Ready", completed: "Completed", cancelled: "Cancelled" },
    eta: { one: "{n} minute left", other: "{n} minutes left" },
    total: "Total",
  },
  actions: {
    install: "Install App",
    share: "Share",
    print: "Print",
    download: "Download PDF",
    set_eta_prompt: "Set exact ETA (24h HH:MM)"
  },
  settings: {
    title: "Settings",
    lang: "Language",
    locale: "Locale",
    currency: "Currency",
    save: "Save",
    saved: "Settings saved.",
  }
}, { dir: "ltr", name: "English" });

addLocale("ms", {
  app: { title: "Pesanan MyApp" },
  nav: { menu: "Menu", cart: "Troli", checkout: "Bayar", orders: "Pesanan", settings: "Tetapan" },
  order: {
    status: { preparing: "Sedang disediakan", ready: "Sedia", completed: "Selesai", cancelled: "Dibatalkan" },
    eta: { one: "Tinggal {n} minit", other: "Tinggal {n} minit" },
    total: "Jumlah",
  },
  actions: {
    install: "Pasang Aplikasi",
    share: "Kongsi",
    print: "Cetak",
    download: "Muat turun PDF",
    set_eta_prompt: "Tetapkan ETA tepat (24j HH:MM)"
  },
  settings: {
    title: "Tetapan",
    lang: "Bahasa",
    locale: "Lokal",
    currency: "Mata wang",
    save: "Simpan",
    saved: "Tetapan disimpan.",
  }
}, { dir: "ltr", name: "Bahasa Melayu" });

// Common RTL example (prewired if you later add Arabic strings)
addLocale("ar", { app: { title: "تطبيق الطلبات" } }, { dir: "rtl", name: "العربية" });
