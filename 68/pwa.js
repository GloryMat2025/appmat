let deferredPrompt = null;
let updateReadyCb = () => {};

export function setupPWA() {
  // Capture install prompt event
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window.dispatchEvent(new CustomEvent("pwa:install-available"));
  });

  // Installed
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    window.dispatchEvent(new CustomEvent("pwa:installed"));
  });

  // Service worker update handling
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.addEventListener("updatefound", () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener("statechange", () => {
          if (sw.state === "installed" && navigator.serviceWorker.controller) {
            updateReadyCb();
          }
        });
      });
    });
  }
}

export function bindUpdateCallback(cb) {
  updateReadyCb = cb || (()=>{});
}

export async function promptInstall() {
  if (!deferredPrompt) return { outcome: "dismissed" };
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  return { outcome };
}
