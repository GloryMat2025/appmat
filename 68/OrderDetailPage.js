import { buildReceiptFromOrder } from "../utils/receipt.js";
import { sl_newId, sl_put } from "../utils/shortlink.js";
  // --- RECEIPT ACTIONS ---
  setTimeout(() => {
    const actions = document.createElement("div");
    actions.className = "receipt-actions";
    actions.innerHTML = `
      <button id="btnDlPdf" class="btn">Download PDF</button>
      <button id="btnShareRcpt" class="btn">Share Link</button>
    `;
    rootEl.querySelector(".card")?.appendChild(actions);
    const $ = (id)=> rootEl.querySelector("#"+id);
    $("btnDlPdf")?.addEventListener("click", () => {
      const s = orderStore.getState();
      const rcpt = buildReceiptFromOrder(s);
      const url = `${location.origin}${location.pathname}#/receipt/current`;
      const w = window.open(url, "_blank", "noopener");
      setTimeout(()=> { try { w && w.print && w.print(); } catch {} }, 600);
    });
    $("btnShareRcpt")?.addEventListener("click", async () => {
      const s = orderStore.getState();
      const rcpt = buildReceiptFromOrder(s);
      const id = sl_newId();
      sl_put(id, rcpt);
      const link = `${location.origin}${location.pathname}#/r/${id}`;
      try { await navigator.clipboard.writeText(link); alert("Link copied!"); }
      catch { prompt("Copy this link:", link); }
    });
  }, 0);


import { orderStore } from "../store/orderStore.js";
import { OrderSteps } from "../components/OrderSteps.js";
import { ReceiptModal } from "../components/modals/ReceiptModal.js";
import { InvoiceModal } from "../components/modals/InvoiceModal.js";

import { canNotify, getOrderNotifyFlag, setOrderNotifyFlag } from "../utils/notify.js";
import { setSnoozeUntil } from "../utils/notify.js";
import { downloadICS } from "../utils/ics.js";
import { webShare } from "../utils/share.js";

import { initETA, addMinutes, setExactTime, secondsLeft, formatHMMSS } from "../utils/eta.js";
import { tp, t } from "../utils/i18n.js";
import { getSettings } from "../utils/settings.js";

export function OrderDetailPage(rootEl, params = {}) {
  const { orderId = orderStore.getState().id } = params;



  rootEl.innerHTML = `
    <div class="card">
      <h2 class="title">Order #${orderId}</h2>
      <div id="stepsMount"></div>

      <div id="orderMeta" style="margin-top:16px; display:grid; gap:8px"></div>

      <div id="etaPillWrap"></div>
      <div id="etaProgressWrap" style="margin: 12px 0 0 0;"></div>

      <div id="totals" style="margin-top:8px; border-top:1px solid #eef2f7; padding-top:10px; display:grid; gap:6px"></div>

      <div style="margin-top:16px; display:flex; gap:8px; flex-wrap:wrap">
        <button id="btnReceipt" class="btn">View Receipt</button>
        <button id="btnInvoice" class="btn">Tax Invoice</button>
        <button id="btnComplete" class="btn" style="display:none">Mark Completed</button>
      </div>

      <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-top:8px">
        <label style="display:flex; align-items:center; gap:6px">
          <input id="chkThisOrder" type="checkbox" />
          <span>Notify me about this order</span>
        </label>
        <button id="btnSnooze30" class="btn">Snooze 30m</button>
        <button id="btnICS" class="btn">Add to Calendar</button>
        <button id="btnShareOrder" class="btn">Share Order</button>
      </div>
    </div>
    <div class="toast-container" id="toastMount"></div>
  `;

  // ETA Pill UI
  rootEl.querySelector("#etaPillWrap").innerHTML = `
    <div class="eta-pill" id="etaPill" aria-live="polite" style="margin-top:8px">
      <span class="eta-dot" aria-hidden="true"></span>
      <span id="etaHms">--:--</span>
      <span class="helper" id="etaMinLabel"></span>
      <button class="btn" id="etaMinus5" title="−5 min" aria-label="Minus 5 minutes">−5m</button>
      <button class="btn" id="etaPlus5" title="+5 min" aria-label="Plus 5 minutes">+5m</button>
      <button class="btn" id="etaSet" title="Set exact time" aria-label="Set exact time">Set</button>
    </div>
  `;
  // --- ETA Live Countdown Wiring ---
  initETA(orderStore);
  const $ = (id) => rootEl.querySelector("#"+id);
  const hms = $("etaHms");
  const lab = $("etaMinLabel");
  function repaint() {
    const s = orderStore.getState();
    const secs = secondsLeft(orderStore);
    hms.textContent = formatHMMSS(secs);
    lab.textContent = tp("order.eta", s.etaMinutes ?? Math.ceil(secs/60), { n: s.etaMinutes ?? Math.ceil(secs/60) });
    $("etaPill").style.opacity = secs <= 0 ? .6 : 1;
  }
  repaint();
  let unsubEta = orderStore.subscribe(repaint);
  // If you have a teardown hook, call unsub in it. Otherwise, let it live (lightweight).
  $("etaMinus5").addEventListener("click", ()=> addMinutes(orderStore, -5));
  $("etaPlus5").addEventListener("click", ()=> addMinutes(orderStore, +5));
  $("etaSet").addEventListener("click", ()=>{
    const cur = new Date(orderStore.getState().etaTargetAt || Date.now());
    const hh = String(cur.getHours()).padStart(2,"0");
    const mm = String(cur.getMinutes()).padStart(2,"0");
  const val = prompt(t("actions.set_eta_prompt"), `${hh}:${mm}`);
    if (!val) return;
    const m = /^(\d{1,2}):(\d{2})$/.exec(val.trim());
    if (!m) return alert("Invalid time");
    const next = new Date();
    next.setHours(Number(m[1]), Number(m[2]), 0, 0);
    setExactTime(orderStore, next);
  });

  // Wire up receipt modal button
  rootEl.querySelector("#btnReceipt").addEventListener("click", () => {
    const modal = ReceiptModal();
    modal.open();
  });

  // Wire up tax invoice modal button
  const btnInvoice = rootEl.querySelector("#btnInvoice");
  btnInvoice.addEventListener("click", () => {
    const s = orderStore.getState();
    if (s.payment?.status !== "paid") {
      showToast("Invoice available after payment.");
      return;
    }
    const modal = InvoiceModal();
    modal.open();
  });

  function showToast(msg) {
    const toastMount = rootEl.querySelector("#toastMount");
    if (!toastMount) return;
    const div = document.createElement("div");
    div.className = "toast";
    div.textContent = msg;
    toastMount.appendChild(div);
    setTimeout(() => { div.remove(); }, 2200);
  }

  // Optionally show Mark Completed when ready
  const btnComplete = rootEl.querySelector("#btnComplete");
  // --- Notification, ICS, and Share controls wiring ---
  // Quick snooze button
  rootEl.querySelector("#btnSnooze30").addEventListener("click", ()=>{
    const t = new Date(Date.now() + 30*60000);
    setSnoozeUntil(t.toISOString());
    showToast("Notifications snoozed for 30 minutes.", "info");
  });
  const s0 = orderStore.getState();
  const chkThis = rootEl.querySelector("#chkThisOrder");
  const btnICS = rootEl.querySelector("#btnICS");
  const btnShareOrder = rootEl.querySelector("#btnShareOrder");

  // Init per-order checkbox
  const policy = getSettings();
  chkThis.checked = policy.notificationsEnabled && getOrderNotifyFlag(s0.id);
  chkThis.disabled = !policy.notificationsEnabled || !canNotify();

  chkThis.addEventListener("change", () => setOrderNotifyFlag(s0.id, chkThis.checked));

  // Add to Calendar (.ics)
  btnICS.addEventListener("click", () => {
    const s = orderStore.getState();
    const start = s.etaStartAt ? new Date(s.etaStartAt) : new Date();
    const end = s.etaTargetAt ? new Date(s.etaTargetAt) :
               new Date(start.getTime() + Math.max(5, Number(s.etaMinutes||15)) * 60000);
    downloadICS({
      title: s.mode === "pickup" ? "Pickup Order" : "Delivery ETA",
      startISO: start.toISOString(),
      endISO: end.toISOString(),
      description: `Order ${s.id} — ${s.mode}`,
      location: s.mode === "pickup" ? (s.pickupOutlet?.name || "") : (s.deliveryAddress?.address1 || ""),
      uid: `order-${s.id}@myapp`
    });
  });

  // Share the Order Detail route via native sheet (fallback: copy link)
  btnShareOrder.addEventListener("click", async () => {
  const url = `${location.origin}${location.pathname}#/order/${orderStore.getState().id}`;
  await webShare({ title: "My order", text: `Order ${orderStore.getState().id}`, url });
  });
  function updateCompleteBtn() {
    const s = orderStore.getState();
    btnComplete.style.display = (s.status === "ready") ? "inline-block" : "none";
  }
  btnComplete.addEventListener("click", () => {
    const s = orderStore.getState();
    const ts = { ...(s.timestamps||{}) };
    if (!ts.completed) ts.completed = new Date().toISOString();
    orderStore.setStatus("completed");
  });


  const unmount = OrderSteps.mount(rootEl.querySelector("#stepsMount"));
  const meta = rootEl.querySelector("#orderMeta");
  const totals = rootEl.querySelector("#totals");
  const etaProgressWrap = rootEl.querySelector("#etaProgressWrap");
  const toastMount = rootEl.querySelector("#toastMount");


  // --- Toast, Beep, and Notification helpers ---
  let lastStatus = null;
  let toastTimeout = null;
  function showToast(msg, type = "info") {
    if (!toastMount) return;
    toastMount.innerHTML = `<div class="toast toast-${type}">${msg}</div>`;
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => { toastMount.innerHTML = ""; }, 3500);
  }
  function playBeep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = 880;
      o.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.18);
      setTimeout(() => ctx.close(), 250);
    } catch {}
  }
  function notifyDesktop(msg) {
    if (window.Notification && Notification.permission === "granted") {
      new Notification(msg, { icon: "/favicon.ico" });
    }
  }

  function paint() {
    const s = orderStore.getState();

    // --- ETA Progress Bar ---
    let etaHtml = "";
    if (s.etaTargetAt) {
      // Progress: 0 = just started, 1 = done
      const etaStart = new Date(s.timestamps?.preparing || s.timestamps?.received || Date.now()).getTime();
      const etaEnd = new Date(s.etaTargetAt).getTime();
      const now = Date.now();
      const total = etaEnd - etaStart;
      const elapsed = Math.max(0, Math.min(now - etaStart, total));
      const progress = total > 0 ? elapsed / total : 1;
      const pct = Math.round(progress * 100);
      etaHtml = `
        <div class="eta-progress-bar" style="position:relative;">
          <div class="eta-progress-bar-inner" style="width:${pct}%;"></div>
          <span class="eta-progress-label">${s.etaMinutes} min left</span>
        </div>
      `;
    }
    etaProgressWrap.innerHTML = etaHtml;

    // --- Meta and Totals ---
    const metaHtml = [
      `<div class="helper"><b>Mode:</b> ${s.mode}</div>`,
      s.mode === "delivery" && s.deliveryAddress
        ? `<div class="helper"><b>Deliver to:</b> ${s.deliveryAddress.address1}${s.deliveryAddress.address2 ? ", "+s.deliveryAddress.address2:""}, ${s.deliveryAddress.postcode} ${s.deliveryAddress.city}, ${s.deliveryAddress.state}</div>`
        : "",
      s.mode === "pickup" && s.pickupOutlet
        ? `<div class="helper"><b>Pickup at:</b> ${s.pickupOutlet.name} — ${s.pickupOutlet.address} (${s.pickupOutlet.hours})</div>`
        : "",
      `<div class="helper"><b>ETA:</b> ${s.etaMinutes} min</div>`,
    ].filter(Boolean).join("");
    meta.innerHTML = metaHtml;

    const total = (Number(s.subtotal) + Number(s.shippingFee)).toFixed(2);
    totals.innerHTML = `
      <div class="helper"><b>Subtotal:</b> RM ${Number(s.subtotal).toFixed(2)}</div>
      <div class="helper"><b>${s.mode === "pickup" ? "Pickup Fee" : "Delivery Fee"}:</b> RM ${Number(s.shippingFee).toFixed(2)}</div>
      <div style="font-weight:800">Total: RM ${total}</div>
    `;

    // --- Toast, Beep, and Notification on "ready" ---
    if (lastStatus !== s.status && s.status === "ready") {
      showToast("Order is ready!", "success");
      playBeep();
      notifyDesktop("Order #" + s.id + " is ready!");
    }
  lastStatus = s.status;
  updateCompleteBtn();
  }

  const unsub = orderStore.subscribe(paint);
  paint();

  return () => {
    if (typeof unmount === "function") unmount();
    unsub && unsub();
    clearTimeout(toastTimeout);
  };
}
