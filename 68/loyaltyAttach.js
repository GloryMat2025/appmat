// src/store/loyaltyAttach.js
import { getLoyalty, getLoyaltySettings, valueForPoints, maxRedeemablePoints } from "../utils/loyalty.js";

/** Call once after store.hydrate(). Adds:
 * state: loyaltyAppliedPoints, loyaltyRedeemValue, payableTotal
 * methods: applyLoyaltyPoints(points), removeLoyalty()
 */
export function attachLoyalty(orderStore) {
  const s0 = orderStore.getState();
  orderStore.setState?.({ ...s0, loyaltyAppliedPoints: 0, loyaltyRedeemValue: 0, payableTotal: s0.totalAfterDiscount ?? s0.cartTotal ?? 0 });

  function recalc() {
    const s = orderStore.getState();
    const net = Number(s.totalAfterDiscount ?? s.cartTotal ?? 0);
    const settings = getLoyaltySettings();
    if (!settings.enabled) {
      orderStore.setState?.({ ...s, loyaltyAppliedPoints: 0, loyaltyRedeemValue: 0, payableTotal: net });
      return;
    }
    const balance = Number(getLoyalty().balance || 0);
    const capPts = maxRedeemablePoints({ netSubtotal: net }, settings);
    const wantPts = Math.min(Number(s.loyaltyAppliedPoints||0), balance, capPts);
    const redeemVal = valueForPoints(wantPts, settings);
    const payable = Math.max(0, Math.round((net - redeemVal) * 100)/100);
    orderStore.setState?.({ ...s, loyaltyAppliedPoints: wantPts, loyaltyRedeemValue: redeemVal, payableTotal: payable });
  }

  orderStore.applyLoyaltyPoints = (pts) => {
    const s = orderStore.getState();
    const n = Math.max(0, Math.floor(Number(pts||0)));
    orderStore.setState?.({ ...s, loyaltyAppliedPoints: n });
    recalc();
  };
  orderStore.removeLoyalty = () => {
    const s = orderStore.getState();
    orderStore.setState?.({ ...s, loyaltyAppliedPoints: 0 });
    recalc();
  };

  let prev = orderStore.getState();
  orderStore.subscribe?.(() => {
    const s = orderStore.getState();
    if (s.totalAfterDiscount !== prev.totalAfterDiscount || s.cartTotal !== prev.cartTotal || s.loyaltyAppliedPoints !== prev.loyaltyAppliedPoints) {
      recalc();
    }
    prev = s;
  });

  recalc();
}
