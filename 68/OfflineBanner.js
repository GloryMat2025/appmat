// src/components/OfflineBanner.js
export function mountOfflineBanner() {
  const bar = document.createElement("div");
  bar.id = "offlineBanner";
  bar.style.cssText = "position:fixed;left:12px;right:12px;bottom:12px;padding:10px 12px;border:1px solid #f59e0b;background:rgba(245,158,11,.12);backdrop-filter:saturate(1.2);border-radius:10px;display:none;z-index:9999";
  bar.innerHTML = `
    <div style="display:flex;gap:8px;align-items:center;justify-content:space-between">
      <div>Offline mode: actions will be queued and synced later.</div>
      <div style="display:flex;gap:8px">
        <button id="btnRetrySync" class="btn">Sync Now</button>
        <button id="btnHideOff" class="btn">Hide</button>
      </div>
    </div>`;
  document.body.appendChild(bar);
  const show = () => bar.style.display = "";
  const hide = () => bar.style.display = "none";

  function update() { (navigator.onLine ? hide : show)(); }
  window.addEventListener("online", update);
  window.addEventListener("offline", update);
  update();

  document.getElementById("btnHideOff").addEventListener("click", hide);
  document.getElementById("btnRetrySync").addEventListener("click", () => navigator.serviceWorker?.ready.then(r => r.sync?.register("outbox-sync")).catch(()=>{}));
}
