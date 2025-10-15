// src/store/discounts.js
import { computeDiscounts } from "../utils/promos.js";
import { enqueueEvent } from "../utils/sync.js"; // optional analytics

/** Attach discount fields + helpers to your orderStore. Call once on boot. */
export function attachDiscounts(orderStore) {
  const s0 = orderStore.getState();
  if (!("appliedPromos" in s0)) orderStore.setState?.({ ...s0, appliedPromos: [], discountTotal: 0 });

  function recalc() {
    const s = orderStore.getState();
    const subtotal = Number(s.cartTotal ?? s.subtotal ?? 0);
    const mode = s.mode || "delivery";
    const { validCodes, discount, breakdown, reasons } = computeDiscounts(s.appliedPromos || [], { subtotal, mode });
    const total = Math.max(0, Math.round((subtotal - discount) * 100)/100);
    orderStore.setState?.({ ...s, appliedPromos: validCodes, discountTotal: discount, discountBreakdown: breakdown, discountReasons: reasons, totalAfterDiscount: total });
  }

  // Expose tiny API on store instance (optional)
  orderStore.applyPromo = (code) => {
    const s = orderStore.getState();
    if (!code) return { ok:false, reason:"empty" };
    const next = Array.from(new Set([...(s.appliedPromos||[]), code.toUpperCase()]));
    orderStore.setState?.({ ...s, appliedPromos: next });
    recalc();
    enqueueEvent?.("promo_applied_attempt", { code }); // analytics
    enqueueEvent?.("promo_applied", { code });
    return { ok:true };
  };
  orderStore.removePromo = (code) => {
    const s = orderStore.getState();
    const next = (s.appliedPromos||[]).filter(c => c.toUpperCase() !== String(code||"").toUpperCase());
    orderStore.setState?.({ ...s, appliedPromos: next });
    recalc();
    enqueueEvent?.("promo_removed", { code });
  };

  // Recalc whenever cart/mode changes
  let last = orderStore.getState();
  orderStore.subscribe?.(() => {
    const s = orderStore.getState();
    if (s.cartTotal !== last.cartTotal || s.mode !== last.mode || s.appliedPromos !== last.appliedPromos) {
      recalc();
    }
    last = s;
  });

  recalc();
}
