// src/utils/analytics.js
// Local analytics over your stored orders (no server). Safe on large-ish data sets.

export function readAllOrders() {
  // Prefer store.orders; fallback to LS mirror if you keep one
  try {
    const s = window.orderStore?.getState?.();
    if (Array.isArray(s?.orders)) return s.orders;
    const arr = JSON.parse(localStorage.getItem("myapp.orders") || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

export function filterOrders(orders, { from, to, outletId, mode } = {}) {
  return (orders || []).filter(o => {
    const ts = +new Date(o.createdAt || o.updatedAt || 0);
    if (from && ts < +from) return false;
    if (to && ts >= +to) return false;
    if (outletId && String(o.outletId||"") !== String(outletId)) return false;
    if (mode && (o.mode || o.scheduledMode || "delivery") !== mode) return false;
    return true;
  });
}

export function money(n){ return Math.round(Number(n||0)*100)/100; }

export function computeMetrics(orders) {
  const m = {
    orders: 0, items: 0,
    revenueGross: 0, discounts: 0, loyalty: 0, fees: 0, tax: 0, revenueNet: 0, aov: 0,
    byMode: { delivery:{cnt:0,sum:0}, pickup:{cnt:0,sum:0} },
    byOutlet: {}, // {outletId: {name, cnt, sum}}
    topItems: [], // [{name, qty, sum}]
    promoUsage: {}, // code -> {cnt, sum}
    loyaltyPoints: { used:0, earned:0 },
    timing: { onTime:0, late:0, avgReadyMins:null, avgCompleteMins:null },
    slots: { filled:0, total:0 },
  };

  const itemMap = new Map();
  const outletMap = new Map();

  orders.forEach(o => {
    const items = o.items || o.cart || [];
    const mode = o.mode || o.scheduledMode || "delivery";
    const outlet = String(o.outletId || "—");
    const outletName = (o.merchant?.name) || outlet;

    const subtotal = money(items.reduce((s,it)=> s + (Number(it.price||0) * (Number(it.qty||1))), 0));
    const disc = money(o.discountTotal || 0);
    const loy  = money(o.loyaltyRedeemValue || 0);
    const del  = money(o.deliveryFee || 0);
    const svc  = money(o.serviceFee || 0);
    const tax  = money(o.tax || 0);
    const paid = money(o.payableTotal ?? o.totalAfterDiscount ?? o.cartTotal ?? (subtotal - disc - loy + del + svc + tax));

    m.orders += 1;
    m.items  += items.reduce((s,it)=> s + (Number(it.qty||1)), 0);
    m.revenueGross += subtotal;
    m.discounts += disc;
    m.loyalty += loy;
    m.fees += del + svc;
    m.tax += tax;
    m.revenueNet += paid;
    m.byMode[mode] = m.byMode[mode] || {cnt:0,sum:0};
    m.byMode[mode].cnt += 1; m.byMode[mode].sum += paid;

    const out = outletMap.get(outlet) || { name: outletName, cnt:0, sum:0 };
    out.cnt += 1; out.sum += paid; outletMap.set(outlet, out);

    // Items
    items.forEach(it => {
      const key = (it.id ? String(it.id) + "|" : "") + (it.name || "Unnamed");
      const rec = itemMap.get(key) || { name: it.name || "Unnamed", qty:0, sum:0 };
      rec.qty += Number(it.qty||1);
      rec.sum += money((Number(it.qty||1) * Number(it.price||0)));
      itemMap.set(key, rec);
    });

    // Promos (if stored on order)
    if (Array.isArray(o.appliedPromos)) {
      o.appliedPromos.forEach(code => {
        const p = m.promoUsage[code] || { cnt:0, sum:0 };
        p.cnt += 1; p.sum += money(o.discountBreakdown?.find(b=>b.code===code)?.amount || 0);
        m.promoUsage[code] = p;
      });
    }

    // Loyalty ledger hints (if present on order)
    if (Number(o.loyaltyAppliedPoints||0) > 0) m.loyaltyPoints.used += Number(o.loyaltyAppliedPoints||0);
    if (Number(o.loyaltyEarnedPoints||0) > 0) m.loyaltyPoints.earned += Number(o.loyaltyEarnedPoints||0);

    // Timing / on-time vs scheduled
    const createdAt = new Date(o.createdAt || Date.now());
    const readyAt = o.readyAt ? new Date(o.readyAt) : null;
    const doneAt  = o.completedAt ? new Date(o.completedAt) : null;
    if (readyAt) accumAvg(m.timing, "avgReadyMins", (readyAt - createdAt)/60000);
    if (doneAt)  accumAvg(m.timing, "avgCompleteMins", (doneAt - createdAt)/60000);

    if (o.scheduledAt) {
      m.slots.total += 1;
      if (o.status === "completed" || o.status === "ready" || o.status === "preparing") m.slots.filled += 1;
      const sched = new Date(o.scheduledAt);
      const ref = readyAt || doneAt || new Date(); // best-effort
      if (+ref <= +sched) m.timing.onTime += 1; else m.timing.late += 1;
    }
  });

  m.revenueGross = money(m.revenueGross);
  m.revenueNet   = money(m.revenueNet);
  m.aov = m.orders ? money(m.revenueNet / m.orders) : 0;

  m.byOutlet = Object.fromEntries([...outletMap.entries()].map(([id,v]) => [id, { ...v, sum: money(v.sum) }]));
  m.topItems = [...itemMap.values()].sort((a,b)=> b.qty - a.qty).slice(0, 10).map(x=> ({ ...x, sum: money(x.sum) }));

  return m;
}

function accumAvg(obj, field, x) {
  const prev = obj[field]; // store as {sum,count} internally? keep simple running avg
  if (prev == null) { obj[field] = Math.max(0, Number(x||0)); obj[field+"_n"]=1; }
  else { const n = (obj[field+"_n"]||1) + 1; obj[field] = ((obj[field]*(n-1))+x)/n; obj[field+"_n"]=n; }
}

export function toCSV(rows, headers) {
  const esc = (v)=> {
    const s = String(v??"");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
  };
  const head = headers || Object.keys(rows[0]||{});
  const lines = [ head.join(","),
    ...rows.map(r => head.map(h => esc(r[h])).join(",")) ];
  return new Blob([lines.join("\n")], { type: "text/csv" });
}
