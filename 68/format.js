// Locale-aware format helpers (currency, date/time, minutes)
import { getSettings } from "./settings.js";
import { getLang } from "./i18n.js";

function locale() {
  const s = getSettings();
  return s.locale || getLang() || (navigator.language || "en-US");
}
function currencyCode() {
  const s = getSettings();
  return (s.currency || "MYR").toUpperCase();
}

export function formatCurrency(n, cur = currencyCode()) {
  try {
    return new Intl.NumberFormat(locale(), { style: "currency", currency: cur, currencyDisplay: "symbol", maximumFractionDigits: 2 }).format(Number(n || 0));
  } catch {
    // fallback
    return `${cur} ${Number(n||0).toFixed(2)}`;
  }
}

export function formatDateTime(iso) {
  try {
    const d = iso ? new Date(iso) : new Date();
    return new Intl.DateTimeFormat(locale(), { dateStyle: "medium", timeStyle: "short" }).format(d);
  } catch {
    return new Date(iso || Date.now()).toLocaleString();
  }
}

export function formatNumber(n, opts = {}) {
  try { return new Intl.NumberFormat(locale(), opts).format(Number(n || 0)); }
  catch { return String(n ?? ""); }
}

// "ETA: 2 minutes" / "ETA: 1 minute" (EN) | "2 minit"/"1 minit" (MS)
export function formatMinutes(mins) {
  const n = Math.max(0, Number(mins || 0));
  const loc = locale();
  if (loc === "ms") return `${n} minit`;
  return `${n} minute${n === 1 ? "" : "s"}`;
}
