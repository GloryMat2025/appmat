// src/pages/ReceiptPage.js
import { buildReceiptFromOrder, renderReceiptHTML } from "../utils/receipt.js";
import { sl_get } from "../utils/shortlink.js";

export function ReceiptPage(rootEl, params) {
  // params.id may be "current" or short id
  const id = params?.id || "current";
  let payload = null;

  if (id === "current") {
    // Try to render from live store (most recent or current)
    const s = window.orderStore?.getState?.() || {};
    const order = s.currentOrder || s || {};
    payload = buildReceiptFromOrder(order);
  } else {
    // Load from shortlink
    const saved = sl_get(id);
    if (saved) payload = saved;
  }

  if (!payload) {
    rootEl.innerHTML = `<div class="card"><div class="title">Receipt not found</div><div class="helper">The link may be expired on this device.</div></div>`;
    return ()=>{};
  }

  rootEl.innerHTML = `
    <div class="receipt-actions no-print">
      <button id="btnPrint" class="btn">Print / Save PDF</button>
      <button id="btnThermal" class="btn">Thermal 80mm</button>
      <button id="btnA4" class="btn">A4</button>
      <a href="#/orders" class="btn">Back</a>
    </div>
    <div id="rhost">${renderReceiptHTML(payload)}</div>
  `;

  const $ = (id)=> rootEl.querySelector("#"+id);
  $("btnPrint").addEventListener("click", ()=> window.print());
  $("btnThermal").addEventListener("click", ()=> document.body.classList.add("thermal-80mm"));
  $("btnA4").addEventListener("click", ()=> document.body.classList.remove("thermal-80mm"));

  return ()=>{ document.body.classList.remove("thermal-80mm"); };
}
