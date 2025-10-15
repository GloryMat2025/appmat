import { getOutlets } from "../utils/outlets.js";
import { getOutletZones, setOutletZones } from "../utils/deliveryFee.js";

export function DeliveryZonesPage(rootEl) {
  rootEl.innerHTML = `
    <div class="card">
      <h2 class="title">Delivery Zones & Fees</h2>
      <div class="helper">Per-outlet distance tiers, free shipping threshold, and no-service cutoff.</div>
      <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin:8px 0">
        <label>Outlet <select id="dzOutlet" class="select"></select></label>
        <label>Free ≥ RM <input id="dzFree" class="input" type="number" step="1" style="width:120px"></label>
        <label>No service beyond <input id="dzCut" class="input" type="number" step="0.1" style="width:140px"> km</label>
        <button id="dzSave" class="btn">Save</button>
        <span id="dzMsg" class="helper"></span>
      </div>
      <div class="helper">Tiers (evaluate in order; first maxKm that fits applies)</div>
      <div id="tiers" style="display:grid; gap:8px"></div>
      <button id="addTier" class="btn">Add Tier</button>
    </div>
  `;
  const $ = (id)=> rootEl.querySelector("#"+id);
  const outletSel = $("dzOutlet");
  const tiersWrap = $("tiers");

  function paintOutletOptions(){
    const outs = getOutlets();
    outletSel.innerHTML = outs.map(o=>`<option value="${o.id}">${o.name}</option>`).join("");
    paintForm();
  }
  function paintForm(){
    const id = outletSel.value;
    const cfg = getOutletZones(id);
    $("dzFree").value = cfg.freeThreshold || 0;
    $("dzCut").value = cfg.noServiceBeyondKm || 0;
    tiersWrap.innerHTML = "";
    (cfg.tiers||[]).forEach((t,i)=> addTierRow(t.maxKm, t.fee, i));
  }
  function addTierRow(maxKm="", fee="", i=null){
    const row = document.createElement("div");
    row.style.cssText = "display:flex; gap:8px; align-items:center";
    row.innerHTML = `
      <label>≤ <input class="inMax" type="number" min="0" step="0.1" style="width:100px" value="${maxKm}"> km</label>
      <label>Fee RM <input class="inFee" type="number" min="0" step="0.1" style="width:120px" value="${fee}"></label>
      <button class="btn btnDel">Delete</button>
    `;
    row.querySelector(".btnDel").addEventListener("click", ()=> row.remove());
    tiersWrap.appendChild(row);
  }

  $("addTier").addEventListener("click", ()=> addTierRow());
  outletSel.addEventListener("change", paintForm);

  $("dzSave").addEventListener("click", ()=>{
    const id = outletSel.value;
    const tiers = [...tiersWrap.querySelectorAll(":scope > div")].map(row => ({
      maxKm: Number(row.querySelector(".inMax").value || 0),
      fee: Number(row.querySelector(".inFee").value || 0)
    })).filter(t => t.maxKm > 0);
    const cfg = {
      freeThreshold: Number($("dzFree").value || 0),
      noServiceBeyondKm: Number($("dzCut").value || 0),
      tiers: tiers.sort((a,b)=> a.maxKm - b.maxKm)
    };
    setOutletZones(id, cfg);
    $("dzMsg").textContent = "Saved.";
  });

  paintOutletOptions();
  return ()=>{};
}
