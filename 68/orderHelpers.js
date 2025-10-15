// src/utils/orderHelpers.js
export function readOrders(store) {
  const s = store?.getState?.() || {};
  if (Array.isArray(s.orders)) return s.orders;
  if (Array.isArray(s.list)) return s.list;
  if (Array.isArray(s.history)) return s.history;
  if (s.id) return [s]; // single-order shape
  try { const arr = JSON.parse(localStorage.getItem("myapp.orders") || "[]"); if (Array.isArray(arr)) return arr; } catch {}
  return [];
}

export function setOrderStatus(store, id, status) {
  // Prefer a native API if app exposes it
  if (typeof store?.updateOrderStatus === "function") return store.updateOrderStatus(id, status);
  // Generic fallbacks
  const s = store?.getState?.();
  if (!s) return;
  const next = { ...s };
  const arr = Array.isArray(s.orders) ? [...s.orders] : (s.id ? [{...s}] : []);
  const i = arr.findIndex(o => String(o.id ?? o.orderId) === String(id));
  if (i >= 0) {
    arr[i] = { ...arr[i], status };
    if (Array.isArray(s.orders)) next.orders = arr;
    else Object.assign(next, arr[0]);
    store.setState?.(next);
  }
}

export function orderId(o) { return String(o.id ?? o.orderId ?? ""); }
export function orderMode(o) { return o.mode || "delivery"; }
export function orderItems(o) { return o.items || o.cart || []; }
export function orderSubtotal(o) {
  const items = orderItems(o);
  return Math.round(items.reduce((s, it)=> s + (Number(it.price||0) * (Number(it.qty||1))), 0) * 100)/100;
}
