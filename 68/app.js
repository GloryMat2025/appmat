import { TestRunnerPage } from "./pages/TestRunnerPage.js";
import { SettingsPage } from "./pages/SettingsPage.js";
import { AnalyticsPage } from "./pages/AnalyticsPage.js";



import { orderStore } from "./stores/orderStore.js";
import { OrderDetailPage } from "./pages/OrderDetailPage.js";
import { MenuPage } from "./pages/MenuPage.js";
import { CheckoutPage } from "./pages/CheckoutPage.js";
import { MyOrdersPage } from "./pages/MyOrdersPage.js";

import { ReceiptSharePage } from "./pages/ReceiptSharePage.js";
import { resolveShortLink } from "./utils/shareLinks.js";
import { ShortLinksPage } from "./pages/ShortLinksPage.js";

import { promptInstall } from "./utils/pwa.js";
import { OutletAdminPage } from "./pages/OutletAdminPage.js";
import { DeliveryZonesPage } from "./pages/DeliveryZonesPage.js";



// parseHash() should extract path segments
function parseHash() {
  const parts = (location.hash || "#/menu").slice(2).split("/");
  const route = parts[0] || "menu";
  const arg = parts[1] || null;
  return { route, arg };
}


export function App(rootEl) {
  let teardown = null;

  // PWA Install button logic
  document.addEventListener("DOMContentLoaded", () => {
    const btnInstall = document.getElementById("btnInstall");
    if (btnInstall) {
      window.addEventListener("pwa:install-available", () => {
        btnInstall.style.display = "block";
      });
      window.addEventListener("pwa:installed", () => {
        btnInstall.style.display = "none";
      });
      btnInstall.addEventListener("click", async () => {
        await promptInstall();
      });
    }
  });

  // --- Apply theme on app startup ---
  try {
    let theme = "system";
    if (window.getSettings) {
      theme = window.getSettings().theme || "system";
    } else {
      // fallback: try to read from localStorage directly
      const raw = localStorage.getItem("myapp.settings");
      if (raw) {
        try { theme = JSON.parse(raw).theme || "system"; } catch {}
      }
    }
    const root = document.documentElement;
    if (!theme || theme === "system") {
      // Set initial system theme
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.setAttribute("data-theme", isDark ? "dark" : "light");
    } else {
      root.setAttribute("data-theme", theme);
    }
  } catch (e) {}

  function render() {
    if (teardown) { teardown(); teardown = null; }
    const { route, arg } = parseHash();

    switch (route) {
      case "menu":
        teardown = MenuPage(rootEl); break;
      case "checkout":
        teardown = CheckoutPage(rootEl); break;
      case "order":
        teardown = OrderDetailPage(rootEl, { orderId: arg || orderStore.getState().id }); break;
      case "orders":
        teardown = MyOrdersPage(rootEl); break;
      case "receipt":
        teardown = ReceiptSharePage(rootEl, { token: arg }); break;
      case "s": {
        const res = resolveShortLink(arg || "");
        if (!res.ok) {
          rootEl.innerHTML = `<div class=\"card\"><h2 class=\"title\">Receipt</h2><div class=\"helper\" style=\"color:#b91c1c\">${res.reason === "Expired" ? "This link has expired." : "Link not found."}</div><div style=\"margin-top:8px\"><a class=\"btn\" href=\"#/menu\">Back to Menu</a></div></div>`;
          teardown = () => {};
        } else {
          teardown = ReceiptSharePage(rootEl, { token: res.token });
        }
        break;
      }
      case "shortlinks":
        teardown = ShortLinksPage(rootEl); break;
      case "settings":
        teardown = SettingsPage(rootEl); break;
      case "analytics":
        teardown = AnalyticsPage(rootEl); break;
      case "tests":
        teardown = TestRunnerPage(rootEl); break;
      case "outlets":
        teardown = OutletAdminPage(rootEl); break;
      case "zones":
        teardown = DeliveryZonesPage(rootEl); break;
      default:
        location.hash = "#/menu";
    }
  }

  window.addEventListener("hashchange", render);
  render();
  return () => { window.removeEventListener("hashchange", render); if (teardown) teardown(); };
}

// Optional helper to set ID without exposing it publicly
// (Add it onto store after creation)
if (!orderStore.__setId) {
  orderStore.__setId = (newId) => {
    const cur = orderStore.getState();
    orderStore.setStatus(cur.status); // ensure subscribers fire
    // crude way to set id while preserving timestamps/status
    // (since createOrderStore kept id inside closure)
    // For a real app, you'd expose a proper setter in the store.
    cur.id = newId;
  };
}

// Expose appAPI for command palette and integrations
window.appAPI = window.appAPI || {};
window.appAPI.addToCart = (item) => {
  try { orderStore.addToCart?.(item); } catch {}
};
window.appAPI.getMenuItems = () => {
  try { return menuStore?.getAll?.() || []; } catch { return []; }
};
window.appAPI.getRecentOrders = () => {
  try { return orderStore?.listOrders?.() || []; } catch { return []; }
};
