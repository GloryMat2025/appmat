
/**
 * slot-picker.js
 * Renders valid booking slots for a selected date, outlet, and mode,
 * respecting weekly hours, exceptions, and lead/cutoff rules.
 *
 * Usage:
 * <script type="module">
 *   import { initSlotPicker } from "/assets/js/slot-picker.js";
 *   initSlotPicker({
 *     mount: "#slotMount",
 *     outletSelect: "#outletSelect",     // optional, fallback to localStorage('outletId')
 *     modeSelect: "#modeSelect",         // optional, default "pickup"
 *     dateInput: "#dateInput",           // required
 *     scheduleUrl: "/config/schedule.json",
 *     onSelect: (slot) => console.log("selected slot", slot) // optional
 *   });
 * </script>
 */
import { loadSchedule, getHoursForDate } from "/assets/js/schedule-utils.v2.js";

/* eslint-disable no-unused-vars */
function el(tag, attrs={}, ...children){
  const x = document.createElement(tag);
  for (const [k,v] of Object.entries(attrs)) (k==="class") ? x.className=v : x.setAttribute(k,v);
  for (const c of children) x.appendChild(typeof c==="string" ? document.createTextNode(c) : c);
  return x;
}
function pad(n){ return (n<10?"0":"")+n; }
function parseHHMM(hhmm){ const [h,m] = hhmm.split(":").map(Number); return {h,m}; }
function at(date, hhmm){ const {h,m} = parseHHMM(hhmm); const d = new Date(date); d.setHours(h,m,0,0); return d; }

function effectiveRules(cfg, outletId, mode){
  const global = cfg.rules || {};
  const outlet = outletId && cfg.outlets && cfg.outlets[outletId] ? (cfg.outlets[outletId].rules || {}) : {};
  const pick = (obj, key, def) => (obj && obj[key] != null ? obj[key] : def);
  const byMode = (r, m) => (r.modes && r.modes[m]) || {};
  const lead = pick(byMode(outlet, mode),'leadMinutes', pick(byMode(global, mode),'leadMinutes', pick(outlet,'leadMinutes', pick(global,'leadMinutes', 0))));
  const cut  = pick(byMode(outlet, mode),'cutoffMinutes', pick(byMode(global, mode),'cutoffMinutes', pick(outlet,'cutoffMinutes', pick(global,'cutoffMinutes', 0))));
  return { leadMinutes: Math.max(0, parseInt(lead||0)), cutoffMinutes: Math.max(0, parseInt(cut||0)) };
}

export async function initSlotPicker(opts={}){
  const mount = document.querySelector(opts.mount || "#slotMount");
  const outletSel = opts.outletSelect ? document.querySelector(opts.outletSelect) : null;
  const modeSel = opts.modeSelect ? document.querySelector(opts.modeSelect) : null;
  const dateInput = document.querySelector(opts.dateInput);
  const scheduleUrl = opts.scheduleUrl || "/config/schedule.json";
  const onSelect = typeof opts.onSelect === "function" ? opts.onSelect : () => {};

  if (!mount || !dateInput) { console.warn("slot-picker: missing mount/dateInput"); return; }

  const cfg = await loadSchedule(scheduleUrl);

  function currentOutlet(){ return outletSel ? (outletSel.value || null) : (localStorage.getItem("outletId") || null); }
  function currentMode(){ return modeSel ? (modeSel.value || "pickup") : (localStorage.getItem("orderMode") || "pickup"); }

  function* slotsForDay(day, startHHMM, endHHMM, stepMin){
    const {h:sh, m:sm} = parseHHMM(startHHMM);
    const {h:eh, m:em} = parseHHMM(endHHMM);
    const start = new Date(day); start.setHours(sh, sm, 0, 0);
    const end = new Date(day); end.setHours(eh, em, 0, 0);
    for (let t=+start; t<+end; t += stepMin*60*1000){
      yield new Date(t);
    }
  }

  function render(){
    mount.innerHTML = "";
    const outletId = currentOutlet();
    const mode = currentMode();
    const slotLen = cfg.slotMinutes || 30;

    // parse picked date
    const picked = new Date(dateInput.value);
    if (!(picked instanceof Date) || isNaN(picked)) {
      mount.append(el("div",{class:"text-sm text-gray-600"},"Choose a date."));
      return;
    }
    // Normalize to local midnight
    const day = new Date(picked); day.setHours(0,0,0,0);

    const hours = getHoursForDate(cfg, day, outletId);
    if (!hours.open){
      mount.append(el("div",{class:"rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 text-sm"},
        "Closed on selected date", hours.reason ? ` — ${hours.reason}` : ""));
      return;
    }

    // Lead/cutoff relative to NOW only applies if the selected date is today.
    const now = new Date();
    const isToday = day.toDateString() === now.toDateString();
    const rules = effectiveRules(cfg, outletId, mode);

    const openAt = at(day, hours.start);
    const closeAt = at(day, hours.end);

    // Compute windows for allowed slots
    let startAllowed = openAt;
    let endAllowed = closeAt;
    if (isToday){
      // Lead: slots before now+lead are blocked
      const leadMs = (rules.leadMinutes||0) * 60 * 1000;
      const minStart = new Date(now.getTime() + leadMs);
      if (minStart > startAllowed) startAllowed = minStart;
      // Cutoff: last slot must start before close - cutoff
      const cutMs = (rules.cutoffMinutes||0) * 60 * 1000;
      const lastStart = new Date(closeAt.getTime() - cutMs);
      if (lastStart < endAllowed) endAllowed = lastStart;
    } else {
      // Future days: only ensure slots start before close - cutoff
      const cutMs = (rules.cutoffMinutes||0) * 60 * 1000;
      endAllowed = new Date(closeAt.getTime() - cutMs);
    }

    // Generate slots and filter by allowed window
    const slots = [];
    for (const s of slotsForDay(day, hours.start, hours.end, slotLen)){
      if (+s >= +startAllowed && +s <= +endAllowed) slots.push(s);
    }

    // Render
    if (!slots.length){
      mount.append(el("div",{class:"rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 text-sm"},
        "No available slots for the chosen date/time."));
      return;
    }

    const grid = el("div",{class:"grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2"});
    slots.forEach(dt => {
      const btn = el("button",{class:"px-3 py-2 rounded-lg border bg-white text-sm hover:bg-gray-50"}, dt.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"}));
      btn.addEventListener("click", () => {
        // mark selection
        grid.querySelectorAll("button").forEach(b => b.classList.remove("ring-2","ring-gray-900"));
        btn.classList.add("ring-2","ring-gray-900");
        onSelect({ at: dt, outletId, mode, durationMinutes: slotLen });
      });
      grid.appendChild(btn);
    });

    mount.append(
      el("div",{class:"text-sm text-gray-600 mb-2"}, `${hours.start}–${hours.end} ${hours.reason ? " • " + hours.reason : ""}`),
      grid
    );
  }

  outletSel && outletSel.addEventListener("change", render);
  modeSel && modeSel.addEventListener("change", render);
  dateInput.addEventListener("change", render);

  render();
}
