// src/store/outletAttach.js
import { getPrimaryOutletId, findOutlet } from "../utils/outlets.js";

export function attachOutletToStore(orderStore) {
  const s = orderStore.getState?.() || {};
  const selected = s.selectedOutletId || getPrimaryOutletId();
  const deliveryHub = s.deliveryHubOutletId || selected;
  orderStore.setState?.({ ...s, selectedOutletId: selected, deliveryHubOutletId: deliveryHub });

  orderStore.setOutlet = (id) => {
    const st = orderStore.getState();
    orderStore.setState?.({ ...st, selectedOutletId: id });
  };
  orderStore.setDeliveryHub = (id) => {
    const st = orderStore.getState();
    orderStore.setState?.({ ...st, deliveryHubOutletId: id });
  };

  // Optional helper for UI
  window.appAPI = window.appAPI || {};
  window.appAPI.getSelectedOutlet = () => findOutlet(orderStore.getState()?.selectedOutletId);
}
