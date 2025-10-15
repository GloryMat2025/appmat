
/**
 * date-guard.js
 * Computes available dates given outlet/mode and marks them in a simple month calendar.
 * Also forces <input type="date"> to snap to the next available date.
 *
 * Usage:
 * <script type="module">
 *   import { initDateGuard } from "/assets/js/date-guard.js";
 *   initDateGuard({
 *     outletSelect: "#outletSelect",
 *     modeSelect: "#modeSelect",
 *     dateInput: "#dateInput",
 *     calendarMount: "#calendar",   // optional: renders a month grid view with disabled days
 *     months: 2,                    // how many months to render
 *     scheduleUrl: "/config/schedule.json"
 *   });
 * </script>
 */
import { loadSchedule, getHoursForDate } from "/assets/js/schedule-utils.v2.js";
import { getCartCategories } from "/assets/js/cart-categories.js";

function startOfDay(d){ const x = new Date(d); x.setHours(0,0,0,0); return x; }
function addDays(d, n){ const x = new Date(d); x.setDate(x.getDate()+n); return x; }
function fmtYMD(d){ return d.toISOString().slice(0,10); }

async function effectiveRules(cfg, outletId, mode){
  const global = cfg.rules || {};
  const outlet = outletId && cfg.outlets && cfg.outlets[outletId] ? (cfg.outlets[outletId].rules || {}) : {};
  const pick = (obj, key, def) => (obj && obj[key] != null ? obj[key] : def);
  const byMode = (r, m) => (r.modes && r.modes[m]) || {};
  let lead = pick(byMode(outlet, mode),'leadMinutes', pick(byMode(global, mode),'leadMinutes', pick(outlet,'leadMinutes', pick(global,'leadMinutes', 0))));
  // Category buffers
  try {
    const map = await fetch('/config/category-rules.json', { cache:'no-store' }).then(r=>r.json()).then(j=>j.categoryLeadMinutes||{});
    const cats = getCartCategories();
    let extra = 0; cats.forEach(c => { const v = parseInt(map[c]||0); if (v>extra) extra=v; });
    lead = Math.max(parseInt(lead||0), parseInt(lead||0) + extra);
  } catch(e){ void e; }
  
  const cut  = pick(byMode(outlet, mode),'cutoffMinutes', pick(byMode(global, mode),'cutoffMinutes', pick(outlet,'cutoffMinutes', 0)));
  return { leadMinutes: Math.max(0, parseInt(lead||0)), cutoffMinutes: Math.max(0, parseInt(cut||0)) };
}

async function isDateAvailable(cfg, date, outletId, mode){
  // A date is available if it's open that day AND there exists at least one valid slot
  const h = getHoursForDate(cfg, date, outletId);
  if (!h.open) return false;
  const rules = await effectiveRules(cfg, outletId, mode);
  const now = new Date();
  const openAt = new Date(date); const [sh,sm] = h.start.split(":").map(Number); openAt.setHours(sh,sm,0,0);
  const closeAt = new Date(date); const [eh,em] = h.end.split(":").map(Number); closeAt.setHours(eh,em,0,0);

  let startAllowed = openAt;
  let endAllowed = new Date(closeAt.getTime() - (rules.cutoffMinutes||0)*60*1000);

  const isToday = fmtYMD(date) === fmtYMD(now);
  if (isToday){
    const minStart = new Date(now.getTime() + (rules.leadMinutes||0)*60*1000);
    if (minStart > startAllowed) startAllowed = minStart;
  }
  return +startAllowed < +endAllowed;
}

function el(tag, attrs={}, ...children){
  const x = document.createElement(tag);
  for (const [k,v] of Object.entries(attrs)) (k==="class") ? x.className=v : x.setAttribute(k,v);
  for (const c of children) x.appendChild(typeof c==="string" ? document.createTextNode(c) : c);
  return x;
}

export async function initDateGuard(opts={}){
  const outletSel = opts.outletSelect ? document.querySelector(opts.outletSelect) : null;
  const modeSel = opts.modeSelect ? document.querySelector(opts.modeSelect) : null;
  const dateInput = document.querySelector(opts.dateInput);
  const calMount = opts.calendarMount ? document.querySelector(opts.calendarMount) : null;
  const months = Math.max(1, parseInt(opts.months||2));
  const cfg = await loadSchedule(opts.scheduleUrl || "/config/schedule.json");

  function currentOutlet(){ return outletSel ? (outletSel.value || null) : (localStorage.getItem("outletId") || null); }
  function currentMode(){ return modeSel ? (modeSel.value || "pickup") : (localStorage.getItem("orderMode") || "pickup"); }

  async function computeAvailable(start, days){
    const out = new Set();
    const outletId = currentOutlet();
    const mode = currentMode();
    for (let i=0;i<days;i++){
        const d = addDays(start, i);
        try{
          if (await isDateAvailable(cfg, d, outletId, mode)) out.add(fmtYMD(d));
        }catch(e){ void e; }
    }
    return out;
  }

  async function snapToNextAvailable(){
    const start = startOfDay(new Date());
    const avail = await computeAvailable(start, months*31);
    // set min/max
    const min = fmtYMD(start);
    const max = fmtYMD(addDays(start, months*31-1));
    if (dateInput){
      dateInput.min = min;
      dateInput.max = max;
      const cur = dateInput.value ? dateInput.value : min;
      if (!avail.has(cur)){
        // find next available
        let picked = null;
        for (let i=0;i<months*31;i++){
          const d = fmtYMD(addDays(start, i));
          if (avail.has(d)){ picked = d; break; }
        }
        dateInput.value = picked || "";
      }
    }
    return avail;
  }

  function renderCalendar(avail){
    if (!calMount) return;
    calMount.innerHTML = "";
    const today = startOfDay(new Date());

    for (let m=0; m<months; m++){
      const first = new Date(today); first.setDate(1); first.setMonth(today.getMonth()+m);
      const year = first.getFullYear(); const month = first.getMonth();
      const title = first.toLocaleDateString(undefined, { month:"long", year:"numeric" });

      const box = el("div",{class:"rounded-xl border bg-white p-3 mb-3"});
      box.append(el("div",{class:"font-semibold mb-2"}, title));

      const grid = el("div",{class:"grid grid-cols-7 gap-1 text-sm"});
      ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].forEach(d => grid.append(el("div",{class:"text-gray-500 text-xs text-center"}, d)));

      const leading = new Date(year, month, 1).getDay();
      for (let i=0;i<leading;i++) grid.append(el("div",{},""));

      const lastDay = new Date(year, month+1, 0).getDate();
      for (let d=1; d<=lastDay; d++){
        const date = new Date(year, month, d);
        const ymd = fmtYMD(date);
        const available = avail.has(ymd);
        const btn = el("button", {
          class: "px-2 py-1 rounded-lg border text-center " + (available ? "bg-white hover:bg-gray-50" : "bg-gray-100 text-gray-400 cursor-not-allowed"),
          disabled: available ? null : true
        }, String(d));

        if (available){
          btn.addEventListener("click", () => {
            dateInput.value = ymd;
            // trigger change for downstream components
            dateInput.dispatchEvent(new Event("change"));
            // highlight selection
            calMount.querySelectorAll("button").forEach(b => b.classList.remove("ring-2","ring-gray-900"));
            btn.classList.add("ring-2","ring-gray-900");
          });
        }
        grid.append(btn);
      }

      box.append(grid);
      calMount.append(box);
    }
  }

  async function refresh(){
    const avail = await snapToNextAvailable();
    renderCalendar(avail);
  }

  outletSel && outletSel.addEventListener("change", ()=>{ void refresh(); });
  modeSel && modeSel.addEventListener("change", ()=>{ void refresh(); });
  dateInput && dateInput.addEventListener("change", () => {}); // no-op but ensures picker hooks

  void refresh();
}
