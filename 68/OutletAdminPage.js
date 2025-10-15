import { getOutlets, upsertOutlet, removeOutlet, setPrimaryOutlet } from "../utils/outlets.js";
import { getScheduleConfig } from "../utils/schedule.js";
import { getOutletSchedule, setOutletSchedule } from "../utils/schedule.outlet.js";

export function OutletAdminPage(rootEl) {
  rootEl.innerHTML = `
    <div class="card">
      <h2 class="title">Outlets</h2>
      <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:8px">
        <input id="oName" class="input" placeholder="Outlet name" style="min-width:200px">
        <input id="oAddr" class="input" placeholder="Address" style="min-width:260px">
        <input id="oTz" class="input" placeholder="Time zone (e.g., Asia/Kuala_Lumpur)" style="min-width:220px">
        <input id="oLat" class="input" placeholder="Latitude" style="width:140px">
        <input id="oLng" class="input" placeholder="Longitude" style="width:140px">
        <label><input id="oPrimary" type="checkbox"> Primary</label>
        <button id="oAdd" class="btn primary">Add/Update</button>
      </div>
      <div id="olist" style="display:grid; gap:10px"></div>

      <div class="hr" style="border-top:1px solid var(--border); margin:12px 0"></div>
      <h3 class="title">Per-Outlet Schedule</h3>
      <div class="helper">Overrides global Hours & Scheduling for a single outlet.</div>
      <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin:6px 0">
        <select id="schOutlet" class="select"></select>
        <label>Slot minutes <input id="scSlot" class="input" type="number" min="5" step="5" style="width:100px"></label>
        <label>Lead minutes <input id="scLead" class="input" type="number" min="0" step="5" style="width:100px"></label>
        <label>Cap (Delivery) <input id="scCapDel" class="input" type="number" min="0" step="1" style="width:110px"></label>
        <label>Cap (Pickup) <input id="scCapPick" class="input" type="number" min="0" step="1" style="width:110px"></label>
      </div>
      <div class="helper">Hours (24h, comma separated ranges per day). Leave blank to inherit global.</div>
      <div id="scHours" style="display:grid; gap:6px"></div>
      <div>
        <label>Blackouts (YYYY-MM-DD, comma separated; empty = inherit)</label>
        <input id="scBlack" class="input" placeholder="">
      </div>
      <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-top:6px">
        <button id="scSave" class="btn">Save Outlet Schedule</button>
        <button id="scClear" class="btn">Clear Overrides</button>
        <span id="scMsg" class="helper"></span>
      </div>
    </div>
  `;

  const $ = (id)=> rootEl.querySelector("#"+id);

  function paintList(){
    const list = getOutlets();
    $("#olist").innerHTML = "";
    list.forEach(o => {
      const div = document.createElement("div");
      div.style.cssText = "border:1px solid var(--border); border-radius:10px; padding:8px; display:flex; justify-content:space-between; gap:8px; align-items:center;";
      div.innerHTML = `
        <div><strong>${esc(o.name)}</strong> ${o.isPrimary ? "<span class='helper'>(Primary)</span>": ""}
          <div class="helper">${esc(o.addr)} • ${esc(o.tz)}${Number.isFinite(o.lat)&&Number.isFinite(o.lng)?` • ${o.lat.toFixed(5)},${o.lng.toFixed(5)}`:""}</div>
        </div>
        <div style="display:flex; gap:6px">
          <button class="btn btnPrimary">Make Primary</button>
          <button class="btn btnEdit">Edit</button>
          <button class="btn btnDel">Delete</button>
        </div>`;
      div.querySelector(".btnPrimary").addEventListener("click", ()=> { setPrimaryOutlet(o.id); paintList(); paintSchedOutlets(); });
      div.querySelector(".btnEdit").addEventListener("click", ()=> {
        $("#oName").value = o.name; $("#oAddr").value = o.addr; $("#oTz").value = o.tz; $("#oPrimary").checked = !!o.isPrimary;
        $("#oLat").value = Number.isFinite(o.lat) ? o.lat : "";
        $("#oLng").value = Number.isFinite(o.lng) ? o.lng : "";
        $("#oAdd").setAttribute("data-id", o.id);
      });
      div.querySelector(".btnDel").addEventListener("click", ()=> { if (confirm(`Delete ${o.name}?`)) { removeOutlet(o.id); paintList(); paintSchedOutlets(); }});
      $("#olist").appendChild(div);
    });
  }

  $("#oAdd").addEventListener("click", ()=> {
    const id = $("#oAdd").getAttribute("data-id");
    const newId = upsertOutlet({
      id,
      name: $("#oName").value,
      addr: $("#oAddr").value,
      tz: $("#oTz").value,
      isPrimary: $("#oPrimary").checked,
      lat: Number($("#oLat").value || NaN),
      lng: Number($("#oLng").value || NaN)
    });
    $("#oAdd").removeAttribute("data-id");
    $("#oName").value=""; $("#oAddr").value=""; $("#oTz").value=""; $("#oPrimary").checked=false;
    $("#oLat").value=""; $("#oLng").value="";
    paintList(); paintSchedOutlets(); alert(`Saved outlet ${newId}.`);
  });

  // ---- schedule overrides UI ----
  const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  function paintSchedOutlets(){
    const list = getOutlets();
    $("#schOutlet").innerHTML = list.map(o => `<option value="${o.id}">${o.name}</option>`).join("");
    paintSchedForm();
  }
  $("#schOutlet").addEventListener("change", paintSchedForm);

  function paintSchedForm(){
    const id = $("#schOutlet").value;
    const base = getScheduleConfig();
    const ov = getOutletSchedule(id) || {};
    $("#scSlot").value = ov.slotMinutes ?? base.slotMinutes;
    $("#scLead").value = ov.leadMinutes ?? base.leadMinutes;
    $("#scCapDel").value = (ov.capacity?.delivery) ?? base.capacity.delivery;
    $("#scCapPick").value = (ov.capacity?.pickup) ?? base.capacity.pickup;
    const scH = $("#scHours"); scH.innerHTML = "";
    for (let d=0; d<7; d++) {
      const ranges = (ov.hours || {})[String(d)];
      const val = ranges ? ranges.map(r => `${r.start}-${r.end}`).join(", ") : "";
      const row = document.createElement("div");
      row.style.cssText = "display:flex; gap:8px; align-items:center";
      row.innerHTML = `<div style="width:36px">${dayNames[d]}</div><input data-day="${d}" class="input" style="flex:1" placeholder="(inherit) or 09:00-21:00, 22:00-23:00" value="${val}">`;
      scH.appendChild(row);
    }
    $("#scBlack").value = (ov.blackouts || []).join(", ");
  }

  $("#scSave").addEventListener("click", ()=> {
    const id = $("#schOutlet").value;
    const hours = {};
    let anyHours = false;
    $("#scHours").querySelectorAll("input[data-day]").forEach(inp => {
      const d = inp.getAttribute("data-day");
      const val = (inp.value || "").trim();
      if (!val) return;
      anyHours = true;
      hours[d] = val.split(",").map(s => s.trim()).filter(Boolean).map(ch => {
        const m = ch.match(/^(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/);
        return m ? { start: m[1], end: m[2] } : null;
      }).filter(Boolean);
    });
    const payload = {
      slotMinutes: Number($("#scSlot").value || 15),
      leadMinutes: Number($("#scLead").value || 30),
      capacity: { delivery: Number($("#scCapDel").value || 0), pickup: Number($("#scCapPick").value || 0) },
    };
    if (anyHours) payload.hours = hours;
    const bl = ($("#scBlack").value || "").split(",").map(s=>s.trim()).filter(Boolean);
    if (bl.length) payload.blackouts = bl;
    setOutletSchedule(id, payload);
    $("#scMsg").textContent = "Saved overrides.";
  });

  $("#scClear").addEventListener("click", ()=> {
    const id = $("#schOutlet").value;
    setOutletSchedule(id, {}); // write empty object (effectively inherit)
    $("#scMsg").textContent = "Cleared overrides. Using global schedule.";
    paintSchedForm();
  });

  paintList(); paintSchedOutlets();
  return ()=>{};
}

function esc(s){ return String(s||"").replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&gt;","\"":"&quot;","'":"&#39;"}[m])); }
