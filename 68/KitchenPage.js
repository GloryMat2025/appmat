// src/pages/KitchenPage.js
import { readOrders, setOrderStatus, orderId, orderMode, orderItems } from "../utils/orderHelpers.js";
import { secondsLeft, formatHMMSS } from "../utils/eta.js";
import { buildReceiptFromOrder } from "../utils/receipt.js";
import { sl_newId, sl_put } from "../utils/shortlink.js";
import { getOutlets } from "../utils/outlets.js";

export function KitchenPage(rootEl) {
  rootEl.innerHTML = `
    <div class="kds-wrap">
      <div class="kds-toolbar">
        <button id="kdsFull" class="btn">Fullscreen</button>
        <label><input id="fDel" type="checkbox" checked> Delivery</label>
        <label><input id="fPick" type="checkbox" checked> Pickup</label>
        <label><input id="snd" type="checkbox" checked> Sound</label>
        <button id="clearDone" class="btn">Clear Completed</button>
        <a class="btn" href="#/orders">Back</a>
        <span id="kdsMsg" class="helper"></span>
      </div>
      <div class="kds-cols">
        <div class="kds-col" data-col="preparing">
          <div class="kds-head"><span>Preparing</span><span id="count-preparing" class="helper"></span></div>
          <div class="kds-list" id="col-preparing"></div>
        </div>
        <div class="kds-col" data-col="ready">
          <div class="kds-head"><span>Ready</span><span id="count-ready" class="helper"></span></div>
          <div class="kds-list" id="col-ready"></div>
        </div>
        <div class="kds-col">
          <div class="kds-head"><span>Completed</span><span id="count-completed" class="helper"></span></div>
          <div class="kds-list" id="col-completed"></div>
          <div class="kds-col kds-cancel" data-col="cancelled" style="margin-top:8px">
            <div class="kds-head"><span>Cancelled</span><span id="count-cancelled" class="helper"></span></div>
            <div class="kds-list" id="col-cancelled"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  const $ = (sel) => rootEl.querySelector(sel);
  const orderStore = window.orderStore;
  const seen = new Set();
  let soundOn = true;

  // Simple chime using WebAudio
  function chime() {
    if (!soundOn) return;
    try {
      const ctx = new (window.AudioContext||window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type="sine"; o.frequency.value=880; o.connect(g); g.connect(ctx.destination);
      o.start();
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.20);
      o.stop(ctx.currentTime + 0.22);
    } catch {}
  }

  // Fullscreen
  $("#kdsFull").addEventListener("click", ()=> {
    const el = document.documentElement;
    if (!document.fullscreenElement) el.requestFullscreen?.(); else document.exitFullscreen?.();
  });

  $("#snd").addEventListener("change", (e)=> soundOn = e.target.checked);
  $("#clearDone").addEventListener("click", ()=> {
    document.querySelector("#col-completed").innerHTML = "";
  });

  // Drag & drop
  rootEl.addEventListener("dragstart", (e)=>{
    const id = e.target?.getAttribute?.("data-id");
    if (!id) return;
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  });
  rootEl.querySelectorAll(".kds-col[data-col]").forEach(col=>{
    col.addEventListener("dragover", (e)=> { e.preventDefault(); col.classList.add("kds-drop"); });
    col.addEventListener("dragleave", ()=> col.classList.remove("kds-drop"));
    col.addEventListener("drop", (e)=>{
      e.preventDefault(); col.classList.remove("kds-drop");
      const id = e.dataTransfer.getData("text/plain");
      const status = col.getAttribute("data-col");
      if (id && status) setOrderStatus(orderStore, id, status);
      paint();
    });
  });

  function card(order) {
    const id = orderId(order);
    const items = orderItems(order);
    const scheduled = order.scheduledAt ? new Date(order.scheduledAt) : null;
    const etaSecs = Number(order.etaSeconds ?? 60 * Number(order.etaMinutes ?? 0));
    const late = (scheduled && Date.now() > +scheduled && order.status!=="completed") || (etaSecs <= 0 && order.status!=="completed");
    const el = document.createElement("div");
    el.className = "kds-card";
    el.setAttribute("data-id", id);
    el.setAttribute("draggable", "true");
    // Delivery distance/zone subtitle
    let deliveryLine = "";
    if (order.deliveryDistKm || order.deliveryZone) {
      deliveryLine = `<div class=\"muted\">Delivery${order.deliveryDistKm?` • ${Number(order.deliveryDistKm).toFixed(1)} km`:``}${order.deliveryZone?` • ${order.deliveryZone}`:``}</div>`;
    }
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
        <div style="font-weight:800">#${id}</div>
        <div class="kds-badge ${late?'kds-eta-late':''}" title="${scheduled ? 'Scheduled' : 'ETA'}">
          ${scheduled ? scheduled.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"}) : formatHMS(etaSecs)}
        </div>
      </div>
      <div class="helper">${orderMode(order)} • ${items.length} item${items.length===1?'':'s'}</div>
      ${deliveryLine}
      ${order.notes ? `<div class="helper" style="margin-top:4px">${esc(order.notes)}</div>`: ""}
      <div class="kds-footer">
        <button class="btn btn-ready">Mark Ready</button>
        <button class="btn btn-done">Complete</button>
        <button class="btn btn-print">Print</button>
      </div>
    `;
    el.querySelector(".btn-ready").addEventListener("click", ()=> { setOrderStatus(orderStore, id, "ready"); paint(); });
    el.querySelector(".btn-done").addEventListener("click",  ()=> { setOrderStatus(orderStore, id, "completed"); paint(); });
    el.querySelector(".btn-print").addEventListener("click", ()=> openThermalReceipt(order));
    return el;
  }

  function openThermalReceipt(order) {
    const rcpt = buildReceiptFromOrder(order);
    const sid = sl_newId(); sl_put(sid, rcpt);
    const url = `${location.origin}${location.pathname}#/r/${sid}`;
    const w = window.open(url, "_blank", "noopener");
    setTimeout(()=> { try { w && w.document && w.document.body && w.document.body.classList.add("thermal-80mm"); w && w.print && w.print(); } catch {} }, 500);
  }

  function formatHMS(secs) {
    const s = Math.max(0, Math.floor(secs));
    const mmss = formatHMMSS(s);
    return mmss;
  }

  // --- KDS Toolbar ---
  const toolbar = rootEl.querySelector(".kds-toolbar") || rootEl;
  if (toolbar && !toolbar.querySelector("#kdsOutlet")) {
    const sel = document.createElement("select");
    sel.id = "kdsOutlet";
    sel.className = "select";
    toolbar.appendChild(sel);
  }
  const sel = $("#kdsOutlet");
  function paintOutletOptions() {
    const list = getOutlets();
    sel.innerHTML = list.map(o => `<option value="${o.id}">${o.name}</option>`).join("");
    // keep current selection if present
    const cur = sel.value || orderStore.getState()?.selectedOutletId;
    if (cur) sel.value = cur;
  }
  paintOutletOptions();
  sel.addEventListener("change", ()=> { paint(); });

  function filtersPass(o) {
    const m = orderMode(o);
    const fDel = $("#fDel").checked, fPick = $("#fPick").checked;
    if (m === "delivery" && !fDel) return false;
    if (m === "pickup" && !fPick) return false;
    const selectedOutlet = sel.value;
    if (selectedOutlet && o.outletId && String(o.outletId) !== String(selectedOutlet)) return false;
    return true;
  }

  function paint() {
    const stateOrders = readOrders(orderStore);
    // New order detection (id unseen & status preparing)
    stateOrders.forEach(o=>{
      const id = orderId(o);
      if (id && !seen.has(id) && (o.status === "preparing" || o.status === "ready")) { seen.add(id); chime(); }
    });

    const buckets = { preparing:[], ready:[], completed:[], cancelled:[] };
    stateOrders.forEach(o=>{
      const st = o.status || "preparing";
      if (!filtersPass(o)) return;
      (buckets[st] ? buckets[st] : buckets["preparing"]).push(o);
    });

    ["preparing","ready","completed","cancelled"].forEach(k=>{
      const host = $("#col-"+k);
      if (!host) return;
      host.innerHTML = "";
      buckets[k].forEach(o => host.appendChild(card(o)));
      const cnt = $("#count-"+k); if (cnt) cnt.textContent = buckets[k].length;
    });
  }

  // Initial & reactive
  paint();
  const unsub = orderStore?.subscribe?.(paint);
  const obs = new MutationObserver(()=> paint());
  obs.observe(rootEl, { childList:true, subtree:true });
  const unbind = ()=> { unsub && unsub(); obs.disconnect(); };

  return unbind;
}

function esc(s){ return String(s||"").replace(/[&<>"]'/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m])); }
