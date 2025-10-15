
import { DeliveryAddressModal } from "../components/modals/DeliveryAddressModal.js";
import { PickupOutletModal } from "../components/modals/PickupOutletModal.js";
import { orderStore } from "../store/orderStore.js";
import { purgeExpired, listShortLinks } from "../utils/shareLinks.js";

export function MenuPage(rootEl) {
  rootEl.innerHTML = `
    <div class="card">
      <h2 class="title">Menu</h2>

      <!-- Search bar -->
      <div style="display:grid; gap:10px; margin-bottom:12px">
        <input id="menuSearch" class="input" placeholder="Search foods, drinks…" />
        <div class="helper">Try typing “nasi”, “kopi”… (demo only)</div>
      </div>

      <!-- Delivery / Pickup toggles -->

      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:12px">
        <button id="btnDelivery" class="btn">Set delivery address</button>
        <button id="btnPickup" class="btn">Select pickup outlet</button>
        <button id="btnCheckout" class="btn primary">Go to Checkout</button>
      </div>

      <!-- Selected summary -->
      <div id="selectionSummary" style="display:grid; gap:6px"></div>

      <!-- Menu grid placeholder -->
      <div id="menuGrid" style="margin-top:12px; display:grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap:10px">
        ${Array.from({length:8}).map((_,i)=>`
          <div style="border:1px solid #eee; border-radius:12px; padding:10px">
            <div style="height:100px; background:#f5f7fb; border-radius:10px"></div>
            <div style="margin-top:8px; font-weight:700">Sample Item ${i+1}</div>
            <div class="helper">RM ${(8+i).toFixed(2)}</div>
            <button class="btn" style="margin-top:8px">Add</button>
          </div>
        `).join("")}
      </div>
    </div>
  `;


  const summary = rootEl.querySelector("#selectionSummary");

  // Promo code hint for users
  const hint = document.createElement("div");
  hint.className = "helper";
  hint.style.marginTop = "6px";
  hint.textContent = "Try promo codes at Checkout: WELCOME10, SAVE5, FREESHIP, OCTSALE";
  summary.appendChild(hint);

  // Admin/debug buttons for short links
  const admin = document.createElement("div");
  admin.style.marginTop = "8px";
  admin.className = "helper";
  admin.innerHTML = `<button class="btn" id="purgeShort">Purge expired short links</button>
    <button class="btn" id="listShort">List short links (console)</button>`;
  rootEl.appendChild(admin);
  rootEl.querySelector("#purgeShort").addEventListener("click", ()=>{ purgeExpired(); alert("Expired links purged."); });
  rootEl.querySelector("#listShort").addEventListener("click", ()=>{ console.log(listShortLinks()); alert("See console for list."); });


  // Wire Delivery modal
  const deliveryModal = DeliveryAddressModal({
    onSave: (addr) => {
      orderStore.setMode("delivery");
      orderStore.setDeliveryAddress(addr);
      showSummary(summary, "Delivery Address", `${addr.name}, ${addr.phone}<br>${addr.address1}${addr.address2 ? ", "+addr.address2:""}<br>${addr.postcode} ${addr.city}, ${addr.state}`);
    }
  });
  rootEl.querySelector("#btnDelivery").addEventListener("click", deliveryModal.open);

  // Wire Pickup modal
  const pickupModal = PickupOutletModal({
    onSave: (outlet) => {
      orderStore.setMode("pickup");
      orderStore.setPickupOutlet(outlet);
      showSummary(summary, "Pickup Outlet", `${outlet.name} — ${outlet.address} (${outlet.hours})`);
    }
  });
  rootEl.querySelector("#btnPickup").addEventListener("click", pickupModal.open);

  // Wire Go to Checkout button
  rootEl.querySelector("#btnCheckout").addEventListener("click", ()=>{
    location.hash = "#/checkout";
  });

  // Return teardown
  return () => {};
}

function showSummary(el, title, html) {
  const card = document.createElement("div");
  card.style.border = "1px solid #eef2f7";
  card.style.borderRadius = "12px";
  card.style.padding = "10px";
  card.innerHTML = `<div style="font-weight:800; margin-bottom:4px">${title}</div><div class="helper">${html}</div>`;
  el.prepend(card);
}
