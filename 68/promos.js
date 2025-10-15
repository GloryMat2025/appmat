// src/utils/promos.js
// Local promo engine: { code, type:"percent"|"amount", value, minSubtotal, stackable, modes:["delivery","pickup","any"],
// startsAt?, endsAt?, maxUses?, usedCount? }

const LS_KEY = "myapp.promos";

function now(){ return new Date(); }
function parseIso(s){ try { return s ? new Date(s) : null; } catch { return null; } }

export function seedDefaultPromos() {
  const existing = getPromos();
  if (existing.length) return;
  savePromos([
    { code:"SAVE10",  type:"percent", value:10, minSubtotal:20, stackable:false, modes:["any"],  note:"10% off ≥ 20" },
    { code:"LESS5",   type:"amount",  value:5,  minSubtotal:15, stackable:true,  modes:["any"],  note:"RM5 off ≥ 15" },
    { code:"PICKUP3", type:"amount",  value:3,  minSubtotal:10, stackable:true,  modes:["pickup"], note:"RM3 off pickup" },
  ]);
}

export function getPromos() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
}
export function savePromos(arr) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(arr||[])); } catch {}
}
export function upsertPromo(p) {
  const list = getPromos();
  const i = list.findIndex(x => x.code.toUpperCase() === p.code.toUpperCase());
  if (i >= 0) list[i] = { ...list[i], ...p };
  else list.push(p);
  savePromos(list);
}
export function removePromo(code) {
  const list = getPromos().filter(x => x.code.toUpperCase() !== code.toUpperCase());
  savePromos(list);
}

export function findPromo(code) {
  if (!code) return null;
  const c = code.toUpperCase();
  return getPromos().find(p => p.code.toUpperCase() === c) || null;
}

export function validatePromo(promo, { subtotal, mode }) {
  if (!promo) return { ok:false, reason:"invalid" };
  const nowD = now();
  const start = parseIso(promo.startsAt); const end = parseIso(promo.endsAt);
  if (start && nowD < start) return { ok:false, reason:"not_started" };
  if (end && nowD > end) return { ok:false, reason:"expired" };
  if (promo.minSubtotal && Number(subtotal||0) < Number(promo.minSubtotal)) return { ok:false, reason:"min" };
  if (promo.modes && !promo.modes.includes("any")) {
    const m = mode || "delivery";
    if (!promo.modes.includes(m)) return { ok:false, reason:"mode" };
  }
  if (promo.maxUses && Number(promo.usedCount||0) >= Number(promo.maxUses)) return { ok:false, reason:"max_uses" };
  return { ok:true };
}

export function discountFor(promo, subtotal) {
  const n = Number(subtotal||0);
  if (promo.type === "percent") {
    return Math.max(0, Math.round(n * (Number(promo.value||0)/100) * 100) / 100);
  }
  if (promo.type === "amount") {
    return Math.min(n, Math.max(0, Number(promo.value||0)));
  }
  return 0;
}

/** Compute stacked discounts under stack rules. Returns normalized list + totals. */
export function computeDiscounts(codes, { subtotal, mode }) {
  const valid = [];
  const reasons = {};
  let nonStackSeen = false;

  (codes||[]).forEach(code => {
    const promo = findPromo(code);
    const v = validatePromo(promo, { subtotal, mode });
    if (!v.ok) { reasons[code] = v.reason; return; }
    if (!promo.stackable) {
      if (nonStackSeen || valid.length) return; // only one non-stackable allowed, first wins
      nonStackSeen = true;
    }
    valid.push({ code: promo.code, promo });
  });

  // Apply in input order
  let runningSubtotal = Number(subtotal||0);
  let totalDiscount = 0;
  const breakdown = [];
  valid.forEach(({ code, promo }) => {
    const d = discountFor(promo, runningSubtotal);
    runningSubtotal = Math.max(0, runningSubtotal - d);
    totalDiscount = Math.max(0, Math.round((totalDiscount + d) * 100)/100);
    breakdown.push({ code, amount: d, type: promo.type, value: promo.value });
  });

  return { validCodes: valid.map(v=>v.code), discount: totalDiscount, breakdown, reasons };
}

export function markUsed(code) {
  const list = getPromos();
  const i = list.findIndex(x => x.code.toUpperCase() === String(code||"").toUpperCase());
  if (i >= 0) {
    const u = Number(list[i].usedCount||0) + 1;
    list[i] = { ...list[i], usedCount: u };
    savePromos(list);
  }
}
