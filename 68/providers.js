import { defaultBackupPlan, exportBackup, importBackup } from "../utils/backup.js";
(function registerBackupCommands(){
  registerCommand({
    id:"backup-export-quick",
    title:"Backup: Export (quick)",
    group:"Admin",
    run: async () => {
      const { filename, blob } = await exportBackup(defaultBackupPlan(), { encryptWith: "" });
      const url = URL.createObjectURL(blob); const a = document.createElement("a");
      a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
    }
  });

  registerCommand({
    id:"backup-import-file",
    title:"Backup: Import (choose file)",
    group:"Admin",
    run: async () => {
      const inp = document.createElement("input"); inp.type = "file"; inp.accept = ".json,.myapp.json";
      inp.onchange = async () => {
        const f = inp.files?.[0]; if (!f) return;
        const pass = prompt("Passphrase (leave blank if not encrypted)", "");
        try { await importBackup(f, { passphrase: pass || "" }); alert("Imported. The app will reload."); location.reload(); }
        catch (e) { alert("Import failed: " + (e?.message || e)); }
      };
      inp.click();
    }
  });
})();
// Loyalty Manager command
registerCommand({ id:"go-loyalty", title:"Go: Loyalty Manager", group:"Admin", kb:"g l", run:()=> location.hash = "#/loyalty" });
// src/commands/providers.js
import { registerProvider, registerCommand } from "../utils/commands.js";
import { addMinutes } from "../utils/eta.js";
import { orderStore } from "../store/orderStore.js";
import { generateSlots, selectSlot } from "../utils/schedule.js";
import { getOutlets } from "../utils/outlets.js";
import { forceSync, setSimulateOffline } from "../utils/net-dev.js";

// --- Quick static entries (always useful)

// --- Notification Command Palette hooks ---
import { notify, setAppBadge, clearAppBadge } from "../utils/notify.js";

registerCommand({ id:"notify-test", title:"Notify: Test", group:"Notifications", run:()=> notify({ title:"Test", body:"Hello from palette" }) });
registerCommand({ id:"badge-clear", title:"Notify: Clear badge", group:"Notifications", run:()=> clearAppBadge() });
registerCommand({ id:"badge-set-5", title:"Notify: Set badge = 5", group:"Notifications", run:()=> setAppBadge(5) });
registerCommand({ id:"go-settings", title:"Go: Settings", hint:"#/settings", group:"Navigation", kb:"g s", run:()=> location.hash="#/settings" });
registerCommand({ id:"toggle-dark", title:"Toggle Dark Mode", group:"Appearance", kb:"t d", run:()=>{
  const root=document.documentElement;
  const dark = root.classList.toggle("dark");
  try{ localStorage.setItem("myapp.prefersDark", JSON.stringify(dark)); }catch{}
}});
registerCommand({
  id: "go-tests",
  title: "Go: Test Runner",
  hint: "#/tests",
  group: "Admin",
  kb: "g t",
  run: ()=> location.hash = "#/tests"
});
registerCommand({ id:"eta-plus-5",  title:"ETA: +5 minutes",  group:"Orders", run:()=> addMinutes(orderStore, +5) });
registerCommand({ id:"eta-minus-5", title:"ETA: −5 minutes", group:"Orders", run:()=> addMinutes(orderStore, -5) });
registerCommand({ id:"go-kitchen", title:"Go: Kitchen (KDS)", group:"Navigation", kb:"g k", run:()=> location.hash = "#/kitchen" });
registerCommand({
  id: "go-analytics",
  title: "Go: Analytics",
  group: "Navigation",
  kb: "g a",
  run: () => { location.hash = "#/analytics"; }
});
registerCommand({ id:"kitchen-fullscreen", title:"KDS: Toggle Fullscreen", group:"Admin", run:()=> {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.(); else document.exitFullscreen?.();
}});

// --- Command Palette commands for scheduling
registerCommand({
  id: "slot-next-available",
  title: "Slot: Pick next available (current mode)",
  group: "Orders",
  run: () => {
    const s = window.orderStore?.getState?.() || {};
    const mode = s.mode || "delivery";
    const today = new Date().toISOString().slice(0,10);
    const days = [0,1,2,3]; // look ahead few days
    for (const d of days) {
      const dt = new Date(Date.now() + d*86400000).toISOString().slice(0,10);
      const slots = generateSlots(dt, mode);
      const ok = slots.find(sl => !sl.disabled && !sl.full);
      if (ok) { selectSlot(window.orderStore, ok.iso, mode); alert(`Selected ${dt} ${ok.label} (${mode})`); return; }
    }
    alert("No available slots soon.");
  }
});
registerCommand({ id:"go-schedule-settings", title:"Go: Hours & Scheduling", group:"Admin", run:()=> location.hash = "#/settings" });
registerCommand({ id:"go-outlets", title:"Go: Outlet Manager", group:"Admin", kb:"g o", run:()=> location.hash = "#/outlets" });

(function registerOutletSwitchers(){
  const list = getOutlets();
  list.forEach(o => {
    registerCommand({
      id: `switch-outlet:${o.id}`,
      title: `Outlet: Switch to ${o.name}`,
      group: "Outlets",
      run: ()=> { orderStore.setOutlet?.(o.id); alert(`Outlet set to ${o.name}`); }
    });
  });
})();

// --- Helper: robust navigation to menu+search
function openMenuSearch(term){
  location.hash = "#/menu";
  setTimeout(() => {
    const el = document.getElementById("globalSearch") ||
      document.querySelector('input[type="search"], input[placeholder*="search" i]');
    if (el) { el.value = term; el.dispatchEvent(new Event("input", { bubbles:true })); el.focus(); }
  }, 60);
}

// --- Provider: live menu search (best-effort sources)
registerProvider((q) => {
  if (!q) return [];
  const items = readMenuItems();
  if (!items.length) {
    // fallback: offer search action even if we can't index
    return [{
      id: "menu-search:" + q,
      title: `Search menu for “${q}”`,
      hint: "Open Menu & focus search",
      group: "Menu",
      run: () => openMenuSearch(q)
    }];
  }
  const matches = items
    .filter(it => (it?.name || "").toLowerCase().includes(q.toLowerCase()))
    .slice(0, 10);
  return matches.map(it => ({
    id: `menu-item:${it.id || it.name}`,
    title: it.name,
    hint: it.category ? `Add / ${it.category}` : "Add to cart",
    group: "Menu",
    run: () => {
      // try addToCart if app exposes it
      if (window.appAPI?.addToCart) {
        window.appAPI.addToCart({ id: it.id, name: it.name, price: it.price || 0, qty: 1 });
      }
      openMenuSearch(it.name);
    }
  }));
});

// --- Provider: recent orders (open/share)
registerProvider(() => {
  const orders = readRecentOrders().slice(0, 6);
  return orders.flatMap((o) => {
    const id = o.id || o.orderId || "";
    const title = id ? `Open Order ${id}` : "Open current order";
    const openCmd = {
      id: `order-open:${id}`,
      title,
      hint: o.mode ? `${o.mode} — ${statusText(o)}` : statusText(o),
      group: "Orders",
      run: () => location.hash = `#/order/${id}`
    };
    const shareCmd = {
      id: `order-share:${id}`,
      title: `Share link for Order ${id}`,
      hint: "Copy to clipboard",
      group: "Orders",
      run: async () => {
        const url = `${location.origin}${location.pathname}#/order/${id}`;
        try { await navigator.clipboard.writeText(url); alert("Link copied!"); }
        catch { prompt("Copy this link:", url); }
      }
    };
    return [openCmd, shareCmd];
  });
});
registerCommand({ id:"pwa-install", title:"PWA: Install App", group:"PWA", run:()=> window.dispatchEvent(new CustomEvent("pwa:install-click")) });
registerCommand({ id:"pwa-sync", title:"PWA: Force Background Sync", group:"PWA", run:()=> forceSync().then(()=>alert("Sync requested")) });
registerCommand({ id:"dev-sim-offline", title:"Dev: Toggle Simulated Offline", group:"PWA", run:()=> {
  const flag = window.__SIM_OFF__ = !window.__SIM_OFF__;
  setSimulateOffline(flag);
  alert(`Simulated offline: ${flag ? "ON" : "OFF"}`);
}});

// ---- readers (resilient to different app shapes) ----
function readMenuItems() {
  try {
    if (window.appAPI?.getMenuItems) return window.appAPI.getMenuItems();
    if (window.Menu?.items) return window.Menu.items;
    const s = JSON.parse(localStorage.getItem("myapp.menu") || "[]");
    if (Array.isArray(s)) return s;
  } catch {}
  return [];
}
function readRecentOrders() {
  try {
    if (window.appAPI?.getRecentOrders) return window.appAPI.getRecentOrders();
    // common store shapes:
    if (window.orderStore?.listOrders) return window.orderStore.listOrders();
    const st = window.orderStore?.getState?.();
    if (st?.orders && Array.isArray(st.orders)) return st.orders;
    if (st?.id) return [st];
    const arr = JSON.parse(localStorage.getItem("myapp.orders") || "[]");
    if (Array.isArray(arr)) return arr;
  } catch {}
  return [];
}
function statusText(o){
  const s = (o.status || "—");
  const eta = (o.etaMinutes!=null) ? `${o.etaMinutes}m` : "";
  return [s, eta].filter(Boolean).join(" · ");
}
