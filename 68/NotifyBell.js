// src/components/NotifyBell.js
import { getLog, clearAppBadge } from "../utils/notify.js";

export function mountNotifyBell(target = document.body) {
  const wrap = document.createElement("div");
  wrap.className = "no-print";
  wrap.style.cssText = "position:fixed; right:12px; bottom:70px; z-index:9999;";
  wrap.innerHTML = `
    <button id="nbBtn" class="btn" title="Notifications">🔔</button>
    <div id="nbPanel" style="display:none; position:absolute; right:0; bottom:40px; width:320px; max-height:50vh; overflow:auto; background:#fff; border:1px solid var(--border); border-radius:12px; padding:8px; box-shadow:0 10px 20px rgba(0,0,0,.07)">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <strong>Notifications</strong>
        <button id="nbClose" class="btn">×</button>
      </div>
      <div id="nbList" style="display:grid; gap:8px; margin-top:6px"></div>
    </div>
  `;
  target.appendChild(wrap);
  const $ = (id)=> wrap.querySelector("#"+id);
  const panel = $("nbPanel");
  $("nbBtn").addEventListener("click", ()=> { panel.style.display = panel.style.display ? "" : "none"; paint(); clearAppBadge(); });
  $("nbClose").addEventListener("click", ()=> { panel.style.display="none"; });

  function paint() {
    const list = $("nbList");
    list.innerHTML = "";
    getLog(50).forEach(n => {
      const div = document.createElement("div");
      div.style.cssText = "border:1px solid var(--border); border-radius:10px; padding:6px;";
      div.innerHTML = `<div style="font-weight:700">${escape(n.title)}</div><div class="helper">${escape(n.body)}</div><div class="helper">${new Date(n.ts).toLocaleString()}</div>`;
      list.appendChild(div);
    });
  }
  return { repaint: paint };
}
function escape(s){ return String(s||"").replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&gt;","\"":"&quot;","'":"&#39;"}[m])); }
