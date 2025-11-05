if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/src/scripts/service-worker.js")
      .then((reg) => console.log("✅ Service worker registered:", reg.scope))
      .catch((err) => console.error("❌ SW registration failed:", err));
  });
}
