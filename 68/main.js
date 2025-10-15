import { mountNotifyBell } from "./components/NotifyBell.js";
window.addEventListener("DOMContentLoaded", () => { mountNotifyBell(); });
import { attachDiscounts } from "./store/discounts.js";
import { attachLoyalty } from "./store/loyaltyAttach.js";
import { seedDefaultPromos } from "./utils/promos.js";
import { attachOutletToStore } from "./store/outletAttach.js";
import { registerSW } from "./utils/sw-register.js";
import { mountOfflineBanner } from "./components/OfflineBanner.js";

registerSW();

initTheme();
initI18n(); // picks saved or browser language, sets dir/lang
window.addEventListener("DOMContentLoaded", () => autoI18n(document));
initMotion();


orderStore.hydrate?.();
attachOutletToStore(orderStore); // ensure selected & delivery hub are set
attachDiscounts(orderStore);
attachLoyalty(orderStore);
seedDefaultPromos();

// Mini ETA pill in header
initETA(orderStore);
const mini = document.getElementById("etaMini");
const miniH = document.getElementById("etaMiniHms");
orderStore.subscribe(() => {
  const secs = secondsLeft(orderStore);
  if (!mini || !miniH) return;
  if (secs <= 0) { mini.style.display = "none"; return; }
  mini.style.display = ""; miniH.textContent = formatHMMSS(secs);
});

// PWA (only if enabled)
if (isEnabled("pwa") && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(()=>{});
  });
}

// Notifications watcher (only if enabled)
if (isEnabled("notifications")) {
  import("./utils/notify.js").then(({ watchOrderNotifications }) => {
    watchOrderNotifications(orderStore);
  }).catch(()=>{});
}

// Analytics periodic registration (only if enabled)
if (isEnabled("analytics") && "serviceWorker" in navigator) {
  import("./utils/sync.js").then(({ registerPeriodicSync }) => {
    window.addEventListener("load", async () => { try { await registerPeriodicSync(); } catch {} });
  }).catch(()=>{});
}

// Quick theme switcher in header/nav
window.addEventListener("DOMContentLoaded", () => {
  const sel = document.getElementById("themeQuick");
  if (sel) {
    sel.value = getTheme();
    sel.addEventListener("change", () => setTheme(sel.value));
  }
});

// --- Global ETA ticker: update all orders' ETA/progress every second ---
setInterval(() => {
  if (orderStore.tickEta) orderStore.tickEta();
}, 1000);

// Request notification permission on app load (for desktop notifications)
if (window.Notification && Notification.permission === "default") {
  Notification.requestPermission();
}

// Demo: change status automatically after a few seconds (remove in prod)
// setTimeout(() => orderStore.setStatus("ready"), 4000);


// If first run and no settings, optionally prompt to restore a backup
try {
  const hasSettings = Object.keys(localStorage).some(k => k.startsWith("myapp."));
  if (!hasSettings) {
    console.log("No prior data detected — tip: use Settings → Backup & Restore to import.");
  }
} catch {}

const palette = CommandPalette();

// Core commands
registerCommand({ id: "go-menu",   title: "Go: Menu",   hint: "#/menu", kb: "g m", run: ()=> location.hash = "#/menu" });
registerCommand({ id: "go-cart",   title: "Go: Cart / Checkout", hint: "#/checkout", kb: "g c", run: ()=> location.hash = "#/checkout" });
registerCommand({ id: "go-orders", title: "Go: Orders", hint: "#/orders", kb: "g o", run: ()=> location.hash = "#/orders" });

registerCommand({ id: "toggle-dark", title: "Toggle Dark Mode", kb: "t d", run: ()=>{
  const root = document.documentElement;
  const dark = root.classList.toggle("dark");
  try { localStorage.setItem("myapp.prefersDark", JSON.stringify(dark)); } catch {}
}});

// Admin-ish (optional routes)
registerCommand({ id: "go-invoices", title: "Go: Admin Invoices", hint: "#/invoices", run: ()=> location.hash = "#/invoices" });
registerCommand({ id: "go-analytics", title: "Go: Analytics Log", hint: "#/analytics", run: ()=> location.hash = "#/analytics" });

// Feature flag toggles via palette
registerCommand({ id: "toggle-core", title: "Toggle Core Mode", hint: "Disable extras", run: ()=> { const f=getFlags(); setFlags({ coreMode: !f.coreMode }); alert(`Core Mode: ${!f.coreMode}`); } });

function isTextEditing(el){
  return el && (
    el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable
  );
}

window.addEventListener("keydown", (e)=>{
  if (isTextEditing(e.target)) {
    // Allow Ctrl/Cmd+K even in inputs
    const modK = (e.key.toLowerCase() === "k") && (e.ctrlKey || e.metaKey);
    if (!modK) return;
  }
  // ⌘/Ctrl+K: open palette
  if ((e.key.toLowerCase() === "k") && (e.ctrlKey || e.metaKey)) {
    e.preventDefault(); palette.open(); return;
  }
  // ? — quick shortcuts help (open palette prefilled)
  if (e.key === "?" && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault(); palette.open(); return;
  }
  // g m / g c / g o sequences
  // tiny stateful handler
});
(function setupSequences(){
  let seq = [];
  const timeoutMs = 800;
  let t = null;
  window.addEventListener("keydown", (e)=>{
    if (isTextEditing(e.target)) return;
    const k = e.key.toLowerCase();
    if (["g","m","c","o","t","d"].includes(k)) {
      seq.push(k);
      clearTimeout(t); t = setTimeout(()=> seq = [], timeoutMs);
      if (seq.join(" ") === "g m") { seq=[]; location.hash = "#/menu"; }
      if (seq.join(" ") === "g c") { seq=[]; location.hash = "#/checkout"; }
      if (seq.join(" ") === "g o") { seq=[]; location.hash = "#/orders"; }
      if (seq.join(" ") === "t d") { seq=[]; document.documentElement.classList.toggle("dark"); }
    } else {
      seq = [];
    }
  });
})();

const root = document.getElementById("app");
App(root);

document.addEventListener("DOMContentLoaded", () => {
  mountOfflineBanner();
  // ...existing DOMContentLoaded logic...
});
