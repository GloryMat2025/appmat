import { loadAllParts } from "./parts.js";
import { setupSidebar } from "./sidebar.js";
import { setupTheme } from "./theme.js";
import { prefetchComponents } from "./prefetch.js";

const isDev = location.hostname === "localhost" || location.hostname === "127.0.0.1";

if (isDev) {
  console.log("🔧 AppMat running in DEV mode");
  import("/src/main.js");
} else {
  console.log("🚀 AppMat running in PROD mode");
  const script = document.createElement("script");
  script.type = "module";
  script.defer = true;
  script.src = "/assets/js/app.js";
  document.head.appendChild(script);
}

document.addEventListener("DOMContentLoaded", async () => {
  // 🕒 Prefetch HTML parts in background
  prefetchComponents();

  // Load main components
  await loadAllParts();

  // Init UI behavior
  setupSidebar();
  setupTheme();

  console.log("✅ All site parts and UI initialized with prefetch.");
});
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then(() => console.log("✅ Service Worker registered."))
      .catch((err) => console.error("SW registration failed:", err));
  });
}
if ("serviceWorker" in navigator && "PushManager" in window) {
  navigator.serviceWorker.ready.then(async (reg) => {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("🔕 Notification permission denied.");
      return;
    }

    // Subscribe user
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: "<Your_Public_VAPID_Key_Base64>",
    });

    console.log("✅ Push subscribed:", JSON.stringify(subscription));
    // Hantar subscription ke backend
    await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription),
    });
  });
}
