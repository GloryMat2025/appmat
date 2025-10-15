import { buildReceiptFromOrder } from "../utils/receipt.js";
import { sl_newId, sl_put } from "../utils/shortlink.js";
import { getScheduleConfig, generateSlots, selectSlot, validateSelectedSlot } from "../utils/schedule.js";
import { notify, getNotifySettings } from "../utils/notify.js";
import { getOutlets, findOutlet } from "../utils/outlets.js";
import { getOutletZones, computeDeliveryFee } from "../utils/deliveryFee.js";
import { formatCurrency } from "../utils/format.js";
// --- Delivery Fee & Distance Logic ---
function currentHubOutlet() {
  const s = orderStore.getState();
  const id = s.deliveryHubOutletId || s.selectedOutletId;
  const o = (findOutlet(id) || {});
  return { id, name: o.name, lat: o.lat, lng: o.lng };
}

function recalcDeliveryFee() {
  const s = orderStore.getState();
  if ((s.mode || "delivery") !== "delivery") {
    writeFee(0, null); return;
  }
  const hub = currentHubOutlet();
  const addr = s.address || {};
  const zones = getOutletZones(hub.id);
  const ctx = { outlet: hub, address: addr, cartTotal: Number(s.totalAfterDiscount ?? s.cartTotal ?? 0), outletZones: zones };
  const res = computeDeliveryFee(ctx);
  if (!res.ok) {
    const msg = res.reason === "no_outlet_coords" ? "Outlet has no coordinates" :
                res.reason === "no_address_coords" ? "Add delivery coordinates" :
                res.reason === "beyond_zone" ? `Outside service area (${res.distKm?.toFixed(1)} km)` : "Unavailable";
    writeFee(null, msg, res.distKm); 
    return;
  }
  // write fee into store; you may already have deliveryFee field
  const next = { ...s, deliveryFee: res.fee, deliveryDistKm: res.distKm, deliveryZone: res.zone };
  orderStore.setState(next);
  writeFee(res.fee, null, res.distKm, res.zone);
  // update grand total display if you're not already doing so:
  const totalEl = rootEl.querySelector("#orderTotal");
  if (totalEl) totalEl.textContent = formatCurrency(Math.max(0, Number(next.payableTotal ?? ((next.totalAfterDiscount ?? next.cartTotal ?? 0) - (next.loyaltyRedeemValue||0) + (next.tax||0) + (next.serviceFee||0) + (res.fee||0)))));
}
function writeFee(fee, err=null, distKm=null, zone=null) {
  const rowId = "rowDeliveryFee";
  let row = rootEl.querySelector("#"+rowId);
  if (!row) {
    row = document.createElement("div");
    row.id = rowId; row.style.cssText="display:flex;justify-content:space-between";
    row.innerHTML = `<div id="feeLbl">Delivery</div><div id="feeVal"></div>`;
    const anchor = rootEl.querySelector("#rowDiscount") || rootEl.querySelector("#subtotal")?.parentElement;
    anchor?.appendChild(row);
  }
  const feeLbl = rootEl.querySelector("#feeLbl");
  const feeVal = rootEl.querySelector("#feeVal");
  if (err) {
    feeLbl.textContent = "Delivery";
    feeVal.textContent = err;
    feeVal.style.color = "#ef4444";
  } else {
    feeLbl.textContent = `Delivery${distKm!=null ? ` • ${distKm.toFixed(1)} km` : ""}${zone?` • ${zone}`:""}`;
    feeVal.textContent = formatCurrency(fee||0);
    feeVal.style.color = "";
  }
}

// recompute on relevant changes
let prev = orderStore.getState();
orderStore.subscribe(()=> {
  const s = orderStore.getState();
  if (s.mode !== prev.mode || s.address !== prev.address || s.cartTotal !== prev.cartTotal || s.totalAfterDiscount !== prev.totalAfterDiscount || s.selectedOutletId !== prev.selectedOutletId || s.deliveryHubOutletId !== prev.deliveryHubOutletId) {
    recalcDeliveryFee();
  }
  prev = s;
});
recalcDeliveryFee();
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



import { orderStore } from "../stores/orderStore.js";
import { PaymentModal } from "../components/modals/PaymentModal.js";

import { seedDefaultPromos, findPromo, validatePromo, markUsed } from "../utils/promos.js";
import { formatCurrency } from "../utils/format.js";
import { getLoyalty, getLoyaltySettings, valueForPoints, maxRedeemablePoints, credit, debit, estEarnPoints } from "../utils/loyalty.js";


  const s = orderStore.getState();


  rootEl.innerHTML = `
    <div class="card">
      <h2 class="title">Checkout</h2>
      <div style="display:grid; gap:12px">
        <section style="border:1px solid #eef2f7; border-radius:12px; padding:12px">
          <div style="font-weight:800; margin-bottom:6px">Fulfilment</div>
          <div class="helper"><b>Mode:</b> ${s.mode}</div>
          ${
            s.mode === "delivery" && s.deliveryAddress
              ? `<div class="helper"><b>Deliver to:</b> ${s.deliveryAddress.name}, ${s.deliveryAddress.phone}<br>${s.deliveryAddress.address1}${s.deliveryAddress.address2 ? ", "+s.deliveryAddress.address2 : ""}<br>${s.deliveryAddress.postcode} ${s.deliveryAddress.city}, ${s.deliveryAddress.state}</div>`
              : s.mode === "pickup" && s.pickupOutlet
              ? `<div class="helper"><b>Pickup at:</b> ${s.pickupOutlet.name} — ${s.pickupOutlet.address} (${s.pickupOutlet.hours})</div>`
              : `<div class="helper" style="color:#b91c1c">No ${s.mode} details set yet. Go back to Menu to set them.</div>`
          }
          <div class="helper"><b>ETA:</b> ${s.etaMinutes} min</div>
        </section>


        <div id="promoBox" style="border:1px dashed var(--border); border-radius:10px; padding:10px; display:grid; gap:8px; margin-top:10px">
          <div style="font-weight:700">Promo Code</div>
          <div style="display:flex; gap:8px; flex-wrap:wrap">
            <input id="promoInput" class="input" placeholder="Enter code e.g. SAVE10" style="flex:1; min-width:220px"/>
            <button id="promoApply" class="btn">Apply</button>
          </div>
          <div id="promoChips" style="display:flex; gap:6px; flex-wrap:wrap"></div>
          <div id="promoMsg" class="helper"></div>
        </div>


        <div id="loyaltyBox" style="border:1px dashed var(--border); border-radius:10px; padding:10px; display:grid; gap:8px; margin-top:10px">
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap">
            <div style="font-weight:700">Loyalty Points</div>
            <div id="loyaltyBalance" class="helper"></div>
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap">

            <input id="loyaltyInput" class="input" type="number" min="0" step="1" placeholder="Points to use" style="flex:1; min-width:220px"/>
            <button id="loyaltyApply" class="btn">Apply</button>
            <button id="loyaltyClear" class="btn">Clear</button>
          </div>
          <div id="loyaltyMsg" class="helper"></div>
        </div>


        <div id="slotBox" style="border:1px dashed var(--border); border-radius:10px; padding:10px; display:grid; gap:8px; margin-top:10px">
          <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap">
            <div style="font-weight:700">Pickup/Delivery Time</div>
            <div id="slotOutlet" class="helper"></div>
            <div id="slotMsg" class="helper"></div>
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center">
            <input id="slotDate" class="input" type="date" style="width:180px">
            <select id="slotMode" class="select">
              <option value="delivery">Delivery</option>
              <option value="pickup">Pickup</option>
            </select>
            <button id="slotReload" class="btn">Refresh</button>
          </div>
          <div id="slotList" style="display:flex; gap:8px; flex-wrap:wrap"></div>
        </div>


        <section style="display:flex; gap:8px; flex-wrap:wrap">
          <button id="btnBackMenu" class="btn">Back to Menu</button>
          <button id="btnConfirm" class="btn primary">Confirm Order</button>
        </section>
      </div>
    </div>
  `;


  // --- PROMO UI WIRING ---
  seedDefaultPromos();
  const $ = (id) => rootEl.querySelector("#"+id);
  const input = $("promoInput");
  const msg = $("promoMsg");
  const chips = $("promoChips");
  function paintChips() {
    const s = orderStore.getState();
    chips.innerHTML = "";
    (s.appliedPromos||[]).forEach(code => {
      const chip = document.createElement("div");
      chip.style.cssText = "display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border:1px solid var(--border);border-radius:999px";
      chip.innerHTML = `<span>${code}</span><button class="btn" aria-label="Remove">×</button>`;
      chip.querySelector("button").addEventListener("click", ()=> orderStore.removePromo(code));
      chips.appendChild(chip);
    });

    // update totals UI (discount line)
    const s2 = orderStore.getState();
    const discount = Number(s2.discountTotal||0);
    const subtotalEl = rootEl.querySelector("#subtotal");
    const discountRow = rootEl.querySelector("#rowDiscount") || (() => {
      const row = document.createElement("div");
      row.id = "rowDiscount"; row.style.cssText="display:flex;justify-content:space-between";
      row.innerHTML = `<div>Discount</div><div id="discountVal"></div>`;
      subtotalEl?.parentElement?.insertBefore(row, subtotalEl.nextSibling);
      return row;
    })();
    rootEl.querySelector("#discountVal").textContent = discount > 0 ? `− ${formatCurrency(discount)}` : formatCurrency(0);

    const totalEl = rootEl.querySelector("#orderTotal");
    if (totalEl) {
      const s3 = orderStore.getState();
      totalEl.textContent = formatCurrency(s3.totalAfterDiscount ?? s3.cartTotal ?? 0);
    }
  }
  orderStore.subscribe(paintChips); paintChips();

  $("promoApply").addEventListener("click", () => {
    const code = (input.value || "").trim().toUpperCase();
    if (!code) { msg.textContent = "Enter a promo code"; return; }
    const p = findPromo(code);
    const s = orderStore.getState();
    const v = validatePromo(p, { subtotal: s.cartTotal ?? 0, mode: s.mode || "delivery" });
    if (!v.ok) {
      msg.textContent = reasonText(v.reason);
      return;
    }
    orderStore.applyPromo(code);
    msg.textContent = "Applied!";
    input.value = "";
  });

  function reasonText(r) {
    return ({
      invalid: "Code not found",
      not_started: "Not started yet",
      expired: "Code expired",
      min: "Subtotal too low",
      mode: "Not valid for this mode",
      max_uses: "Redemption limit reached"
    })[r] || "Not applicable";
  }


  rootEl.querySelector("#btnBackMenu").addEventListener("click", () => {
    location.hash = "#/menu";
  });



  // Payment modal integration

  const paymentModal = PaymentModal({
    onConfirm: (method) => {
      // On payment, set status to 'preparing' and go to order detail
      orderStore.confirmOrder(); // stamp 'received' + timestamps
      // Store payment method/status for receipt
      orderStore.set({ payment: { status: "paid", method } });
      // Mark promo codes as used
      (orderStore.getState().appliedPromos || []).forEach(code => markUsed(code));

      // Loyalty: Redeem (deduct used) and Earn
      const s = orderStore.getState();
      const usedPts = Number(s.loyaltyAppliedPoints || 0);
      if (usedPts > 0) { debit(usedPts, { orderId: s.id }); }
      const earn = estEarnPoints({ payable: Number(s.payableTotal || 0) });
      if (earn > 0) { credit(earn, { orderId: s.id }); }
      orderStore.removeLoyalty?.();

      setTimeout(() => {
        orderStore.setStatus('preparing');
        alert(`Payment successful via ${method}. Order is now preparing!`);
        location.hash = "#/order/" + orderStore.getState().id;
      }, 600); // simulate short payment delay
    }
  });



  rootEl.querySelector("#btnConfirm").addEventListener("click", () => {
    // Guard rails: ensure required data is present for chosen mode
    const cur = orderStore.getState();
    if (cur.mode === "delivery" && !cur.deliveryAddress) {
      alert("Please set your delivery address on the Menu page first.");
      return;
    }
    if (cur.mode === "pickup" && !cur.pickupOutlet) {
      alert("Please select a pickup outlet on the Menu page first.");
      return;
    }
    paymentModal.open();
  });


  // --- LOYALTY UI WIRING ---
setTimeout(() => {
  const L$ = (id) => rootEl.querySelector("#"+id);
  function paintLoyaltyBox() {
    const s = orderStore.getState();
    const bal = Number(getLoyalty().balance || 0);
    const settings = getLoyaltySettings();
    const net = Number(s.totalAfterDiscount ?? s.cartTotal ?? 0);
    const capPts = maxRedeemablePoints({ netSubtotal: net }, settings);
    if (L$("loyaltyBalance")) L$("loyaltyBalance").textContent = `Balance: ${bal} pts · Max this order: ${capPts} pts (${formatCurrency(valueForPoints(capPts))})`;
    if (L$("loyaltyInput")) L$("loyaltyInput").value = String(s.loyaltyAppliedPoints || 0);
    // Discount row for loyalty
    const rowId = "rowLoyalty";
    if (!rootEl.querySelector("#"+rowId)) {
      const subtotalEl = rootEl.querySelector("#rowDiscount") || rootEl.querySelector("#subtotal")?.parentElement;
      const row = document.createElement("div");
      row.id = rowId; row.style.cssText = "display:flex;justify-content:space-between";
      row.innerHTML = `<div>Loyalty</div><div id="loyaltyVal"></div>`;
      (rootEl.querySelector("#rowDiscount") || rootEl.querySelector("#subtotal")?.parentElement)?.appendChild(row);
    }
    const dVal = formatCurrency(Number(s.loyaltyRedeemValue || 0));
    if (rootEl.querySelector("#loyaltyVal")) {
      rootEl.querySelector("#loyaltyVal").textContent = Number(s.loyaltyRedeemValue||0) > 0 ? `- ${dVal}` : formatCurrency(0);
    }

    // Payable total
    const totalEl = rootEl.querySelector("#orderTotal");
    if (totalEl) totalEl.textContent = formatCurrency(s.payableTotal ?? net);
  }
  orderStore.subscribe(paintLoyaltyBox); paintLoyaltyBox();

  if (L$("loyaltyApply")) L$("loyaltyApply").addEventListener("click", () => {
    const s = orderStore.getState();
    const settings = getLoyaltySettings();
    const pts = Math.max(0, Math.floor(Number(L$("loyaltyInput").value || 0)));
    if (pts < settings.minRedeemPoints) {
      if (L$("loyaltyMsg")) L$("loyaltyMsg").textContent = `Min redeem is ${settings.minRedeemPoints} pts`;
      return;
    }
    orderStore.applyLoyaltyPoints(pts);
    const applied = orderStore.getState().loyaltyAppliedPoints;
    if (L$("loyaltyMsg")) {
      L$("loyaltyMsg").textContent = applied ? `Applied ${applied} pts (- ${formatCurrency(valueForPoints(applied))})` : "Nothing applied";
    }
  });
  if (L$("loyaltyClear")) L$("loyaltyClear").addEventListener("click", () => {
    orderStore.removeLoyalty(); if (L$("loyaltyMsg")) L$("loyaltyMsg").textContent = "Cleared.";
  });
}, 0);




  // --- SLOT UI WIRING ---
  const $S = (id)=> rootEl.querySelector("#"+id);
  (function slotsInit(){
    const today = new Date().toISOString().slice(0,10);
    $S("slotDate").value = today;
    const s = orderStore.getState();
    $S("slotMode").value = (s.mode || s.scheduledMode || "delivery");

    function currentOutletIdFor(mode) {
      const s = orderStore.getState();
      return mode === "pickup" ? (s.selectedOutletId) : (s.deliveryHubOutletId || s.selectedOutletId);
    }

    // --- Slot Reminder Notification Logic ---
    let slotReminderTimeout = null;
    function clearSlotReminder() {
      if (slotReminderTimeout) {
        clearTimeout(slotReminderTimeout);
        slotReminderTimeout = null;
      }
    }
    function scheduleSlotReminder(slotISO, mode) {
      clearSlotReminder();
      const settings = getNotifySettings();
      const leadMin = Number(settings.leadMinutesReminder || 10);
      if (!slotISO || !settings.enabled) return;
      const slotTime = new Date(slotISO).getTime();
      const now = Date.now();
      const fireAt = slotTime - leadMin * 60 * 1000;
      const ms = fireAt - now;
      if (ms > 0) {
        slotReminderTimeout = setTimeout(() => {
          notify({
            title: "Upcoming Order Reminder",
            body: `Your ${mode} order is scheduled soon. Please be ready!`,
            tag: "slot-reminder",
            data: { slotISO, mode }
          });
        }, ms);
      }
    }

    function paintSlots() {
      const mode = $S("slotMode").value;
      const outletId = currentOutletIdFor(mode);
      const outlet = findOutlet(outletId);
      if ($S("slotOutlet")) {
        $S("slotOutlet").textContent = outlet ? `Outlet: ${outlet.name}` : "";
      }
      const dateISO = $S("slotDate").value || today;
      const list = $S("slotList");
      list.innerHTML = "";
      const slots = generateSlots(dateISO, mode, { outletId, fromNow: new Date() });
      if (!slots.length) {
        list.innerHTML = "<div class='helper'>No slots — closed/blackout?</div>";
        return;
      }
      const selISO = orderStore.getState().scheduledAt;
      slots.forEach(sl => {
        const btn = document.createElement("button");
        btn.className = "btn";
        btn.textContent = sl.label + (sl.full ? " (Full)" : "");
        btn.disabled = !!sl.disabled;
        if (selISO && Math.abs(new Date(selISO) - new Date(sl.iso)) < 60_000) {
          btn.style.outline = "2px solid #3b82f6";
        }
        btn.addEventListener("click", () => {
          selectSlot(orderStore, sl.iso, mode);
          // also tag the order with the outlet used for this schedule
          const s = orderStore.getState();
          orderStore.setState({ ...s, outletId });
          // Schedule slot reminder notification
          scheduleSlotReminder(sl.iso, mode);
          paintSlots();
        });
        list.appendChild(btn);
      });
    }
    $S("slotReload").addEventListener("click", paintSlots);
    $S("slotDate").addEventListener("change", paintSlots);
    $S("slotMode").addEventListener("change", () => {
      if (orderStore.setMode) orderStore.setMode($S("slotMode").value);
      paintSlots();
    });
    orderStore.subscribe(() => {
      paintSlots();
      // Reschedule reminder if slot changes
      const s = orderStore.getState();
      if (s.scheduledAt) {
        scheduleSlotReminder(s.scheduledAt, s.scheduledMode || s.mode || "delivery");
      } else {
        clearSlotReminder();
      }
    });
    paintSlots();
  })();

  // At “place order” time (where you validate/submit in Checkout):
  function validateBeforeSubmit() {
    const s = orderStore.getState();
    if ((s.mode||"delivery")==="delivery" && (s.deliveryFee==null || isNaN(s.deliveryFee))) {
      alert("Delivery not available. Please add coordinates or change address/mode.");
      return false;
    }
    const v = validateSelectedSlot({ scheduledAt: s.scheduledAt, mode: s.scheduledMode || s.mode || "delivery" });
    if (!v.ok) {
      const map = { missing:"Please choose a time slot", lead:"Slot is too soon (lead time)", full:"Slot is full", blackout:"Blackout date", closed:"Outside business hours" };
      alert(map[v.reason] || "Invalid slot"); return false;
    }
    return true;
  }

  // Patch confirm handler to use validateBeforeSubmit
  const btnConfirm = rootEl.querySelector("#btnConfirm");
  if (btnConfirm) {
    const origHandler = btnConfirm.onclick;
    btnConfirm.onclick = function(e) {
      if (!validateBeforeSubmit()) return;
      if (origHandler) origHandler.call(this, e);
      else btnConfirm.dispatchEvent(new Event('confirm'));
    };
  }

  // No need for paintTotals, handled by paintChips
  // Return teardown (not needed now but kept for consistency)
  return () => {};
