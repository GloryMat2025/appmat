// src/utils/reports.js
// Aggregates offline orders into metrics and series. Pure JS, no deps.

import { findOutlet, getOutlets } from "./outlets.js";

export function getAllOrders() {
  // Prefer store, fallback to LS
  try {
    const s = window.orderStore?.getState?.() || {};
    if (Array.isArray(s.orders)) return s.orders;
    const arr = JSON.parse(localStorage.getItem("myapp.orders") || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

export function filterOrders({ from, to, mode = "any", outletId = "any", includeCancelled = false }) {
  const F = new Date(normalizeDate(from) || 0).getTime();
  const T = new Date(normalizeDate(to) || Date.now()).getTime() + 86_400_000 - 1; // inclusive end
  return getAllOrders().filter(o => {
    const ts = new Date(o.createdAt || o.updatedAt || Date.now()).getTime();
    if (isNaN(ts) || ts < F || ts > T) return false;
    if (!includeCancelled && String(o.status) === "cancelled") return false;
    if (mode !== "any" && (o.mode || o.scheduledMode || "delivery") !== mode) return false;
    if (outletId !== "any" && String(o.outletId || "") !== String(outletId)) return false;
    return true;
  });
}

export function computeMetrics(orders) {
  const sum = { revenue:0, orders:0, discounts:0, loyalty:0, tax:0, fees:0, delivery:0, service:0 };
  orders.forEach(o => {
    const gross = num(o.cartTotal) ?? itemsSubtotal(o.items || o.cart || []);
    const disc = num(o.discountTotal);
    const loy  = num(o.loyaltyRedeemValue);
    const tax  = num(o.tax);
    const del  = num(o.deliveryFee);
    const svc  = num(o.serviceFee);
    const payable = firstNum(o.payableTotal, o.totalAfterDiscount, o.total, gross + del + svc + tax - disc - loy);

    sum.revenue += payable;
    sum.discounts += disc;
    sum.loyalty += loy;
    sum.tax += tax;
    sum.delivery += del;
    sum.service += svc;
    sum.orders += 1;
  });
  sum.fees = sum.delivery + sum.service;
  sum.aov = safeDiv(sum.revenue, sum.orders);
  roundAll(sum);
  return sum;
}

export function seriesByDay(orders) {
  const map = new Map(); // yyyy-mm-dd -> { revenue, orders }
  orders.forEach(o => {
    const d = yyyyMmDd(o.createdAt);
    const gross = num(o.cartTotal) ?? itemsSubtotal(o.items || o.cart || []);
    const disc = num(o.discountTotal), loy = num(o.loyaltyRedeemValue), tax = num(o.tax);
    const del = num(o.deliveryFee), svc = num(o.serviceFee);
    const payable = firstNum(o.payableTotal, o.totalAfterDiscount, o.total, gross + del + svc + tax - disc - loy);
    const x = map.get(d) || { day:d, revenue:0, orders:0 };
    x.revenue += payable; x.orders += 1; map.set(d, x);
  });
  const arr = Array.from(map.values()).sort((a,b) => a.day.localeCompare(b.day));
  arr.forEach(x => { x.revenue = round2(x.revenue); });
  return arr;
}

export function seriesByHour(orders) {
  const arr = Array.from({ length: 24 }, (_,h)=>({ hour:h, orders:0 }));
  orders.forEach(o => {
    const h = new Date(o.createdAt || Date.now()).getHours();
    arr[h].orders += 1;
  });
  return arr;
}

export function topItems(orders, limit = 20) {
  const map = new Map(); // name -> { qty, revenue }
  orders.forEach(o => {
    (o.items || o.cart || []).forEach(it => {
      const name = it.name || "Item";
      const qty = num(it.qty,1);
      const price = num(it.price,0);
      const m = map.get(name) || { name, qty:0, revenue:0 };
      m.qty += qty; m.revenue += qty * price;
      map.set(name, m);
    });
  });
  return Array.from(map.values())
    .map(x => ({ ...x, revenue: round2(x.revenue) }))
    .sort((a,b)=> b.qty - a.qty || b.revenue - a.revenue)
    .slice(0, limit);
}

export function promoUsage(orders) {
  const map = new Map(); // code -> { uses, discount }
  orders.forEach(o => {
    (o.appliedPromos || []).forEach(code => {
      const m = map.get(code) || { code, uses:0, discount:0 };
      m.uses += 1; m.discount += num(o.discountBreakdown?.find(b=>b.code===code)?.amount);
      map.set(code, m);
    });
  });
  return Array.from(map.values())
    .map(x => ({ ...x, discount: round2(x.discount || 0) }))
    .sort((a,b)=> b.uses - a.uses || b.discount - a.discount);
}

export function splitBy(key, orders) {
  // key: "mode" | "outlet"
  const map = new Map();
  orders.forEach(o => {
    const k = key === "mode" ? (o.mode || o.scheduledMode || "delivery") : String(o.outletId || "—");
    const gross = num(o.cartTotal) ?? itemsSubtotal(o.items || o.cart || []);
    const disc = num(o.discountTotal), loy = num(o.loyaltyRedeemValue), tax = num(o.tax);
    const del = num(o.deliveryFee), svc = num(o.serviceFee);
    const payable = firstNum(o.payableTotal, o.totalAfterDiscount, o.total, gross + del + svc + tax - disc - loy);
    const x = map.get(k) || { key:k, revenue:0, orders:0 };
    x.revenue += payable; x.orders += 1; map.set(k,x);
  });
  const arr = Array.from(map.values()).map(x => ({ ...x, revenue: round2(x.revenue) }));
  if (key === "outlet") {
    // add outlet names if we have them
    const list = getOutlets();
    arr.forEach(x => { const o = list.find(v=> String(v.id) === x.key); if (o) x.name = o.name; });
  }
  return arr.sort((a,b)=> b.revenue - a.revenue);
}

/* ----------------- helpers ----------------- */
function num(v, d=0){ const n = Number(v); return isFinite(n) ? n : d; }
function firstNum(...xs){ for (const x of xs) { const n = Number(x); if (isFinite(n)) return n; } return 0; }
function safeDiv(a,b){ return b ? round2(a/b) : 0; }
function round2(n){ return Math.round(Number(n||0)*100)/100; }
function roundAll(o){ Object.keys(o).forEach(k => o[k] = round2(o[k])); }
function itemsSubtotal(items){ return round2((items||[]).reduce((s,x)=> s + num(x.price)*num(x.qty,1), 0)); }
function yyyyMmDd(d){ try { return new Date(d).toISOString().slice(0,10); } catch { return ""; } }

export function defaultRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // today 00:00
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());   // today
  return { from: start.toISOString().slice(0,10), to: end.toISOString().slice(0,10) };
}
function normalizeDate(s){ if (!s) return null; const d = new Date(s); if (isNaN(d)) return null; return d.toISOString().slice(0,10); }
