
/**
 * outlet-hours-integration.js
 * Drop-in integration for displaying outlet + business hours status on any page.
 *
 * Usage:
 * <script type="module">
 *   import { initOutletHoursUI } from "/assets/js/outlet-hours-integration.js";
 *   initOutletHoursUI({ mount:'#bizHoursBanner', outletSelect:'#outletSelect' });
 * </script>
 *
 * Provide:
 *  - mount: CSS selector where a banner/status card will render
 *  - outletSelect (optional): a <select> for choosing outlet; value is outletId. Persisted in localStorage('outletId').
 *  - showBadgeIn (optional): selector to place a small badge (Open/Closed + hours) in your header
 *  - scheduleUrl (optional): override schedule JSON URL
 */
import { loadSchedule, listOutlets, isOpenNow, nextChange, weekOverview } from "/assets/js/schedule-utils.v2.js";

function el(tag, attrs={}, ...children){
  const x = document.createElement(tag);
  for (const [k,v] of Object.entries(attrs)) (k==="class") ? x.className=v : x.setAttribute(k,v);
  for (const c of children) x.appendChild(typeof c==="string" ? document.createTextNode(c) : c);
  return x;
}

function fmtTime(d){ return d.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }); }

export async function initOutletHoursUI(opts={}){
  const mountSel = opts.mount || "#bizHoursBanner";
  const mount = document.querySelector(mountSel);
  const badgeHost = opts.showBadgeIn ? document.querySelector(opts.showBadgeIn) : null;
  const outletSel = opts.outletSelect ? document.querySelector(opts.outletSelect) : null;
  const scheduleUrl = opts.scheduleUrl || "/config/schedule.json";

  const cfg = await loadSchedule(scheduleUrl);
  const outlets = listOutlets(cfg);

  // 1) Outlet selector wiring
  const saved = localStorage.getItem("outletId") || "";
  if (outletSel){
    // Populate
    outletSel.innerHTML = "";
    outletSel.appendChild(el("option",{value:""}, "Global default"));
    outlets.forEach(o => outletSel.appendChild(el("option",{value:o.id}, o.label)));
    outletSel.value = saved && outlets.some(o => o.id===saved) ? saved : (outlets[0]?.id || "");
    outletSel.addEventListener("change", () => {
      localStorage.setItem("outletId", outletSel.value);
      render();
    });
    // persist
    localStorage.setItem("outletId", outletSel.value);
  } else {
    // ensure persisted value is valid
    if (saved && !outlets.some(o => o.id===saved)) localStorage.removeItem("outletId");
  }

  function currentOutletId(){
    return outletSel ? (outletSel.value || null) : (localStorage.getItem("outletId") || null);
  }

  function render(){
    const outletId = currentOutletId();
    const now = new Date();
    const state = isOpenNow(cfg, now, outletId);
    const change = nextChange(cfg, now, outletId);
    const week = weekOverview(cfg, now, outletId);

    const name = outletId ? (outlets.find(o=>o.id===outletId)?.label || outletId) : "Global default";
    const today = week.find(d => d.date.toDateString() === now.toDateString());

    // Banner card
    if (mount){
      mount.innerHTML = "";
      const card = el("div",{class:"rounded-xl border border-gray-200 bg-white p-3 sm:p-4"});
      const row = el("div",{class:"flex items-center justify-between gap-3"});
      const left = el("div",{},
        el("div",{class:"text-xs text-gray-500"},"Now"),
        el("div",{class: state.open ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}, state.open ? "Open" : "Closed"),
        el("div",{class:"text-sm text-gray-600"}, today.open ? `${today.start}–${today.end}` : "Closed today")
      );
      const right = el("div",{class:"text-xs sm:text-sm text-gray-600"},
        name, " • ", cfg.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
      );
      row.append(left, right);
      card.append(row);

      if (today.reason){
        const warn = el("div",{class:"mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-800 text-sm"},
          `Notice: ${today.reason}`
        );
        card.append(warn);
      }
      if (change){
        const meta = el("div",{class:"mt-2 text-xs text-gray-500"},
          change.type === "open" ? `Opens at ${fmtTime(change.at)}` : `Closes at ${fmtTime(change.at)}`
        );
        card.append(meta);
      }
      mount.append(card);
    }

    // Header badge
    if (badgeHost){
      badgeHost.innerHTML = "";
      const badge = el("span",{class:`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs ${state.open ? 'border-green-200 text-green-700 bg-green-50' : 'border-red-200 text-red-700 bg-red-50'}`},
        el("span",{class:"inline-block w-2 h-2 rounded-full", style:`background:${state.open?'#16a34a':'#ef4444'}`}), state.open ? "Open" : "Closed",
        today && today.open ? `(${today.start}–${today.end})` : ""
      );
      badgeHost.append(badge);
    }
  }

  render();
  // Optional: update every minute
  setInterval(render, 60*1000);
}
