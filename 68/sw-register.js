// src/utils/sw-register.js
export function registerSW() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(()=>{});
  });

  // Optional: surface install prompt
  let deferred;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); deferred = e;
    window.dispatchEvent(new CustomEvent("pwa:install-available"));
  });
  window.addEventListener("pwa:install-click", async () => {
    if (!deferred) return;
    deferred.prompt();
    try { await deferred.userChoice; } finally { deferred = null; }
  });
}
