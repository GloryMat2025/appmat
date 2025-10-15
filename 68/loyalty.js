// src/utils/loyalty.js
const LS_KEY = "myapp.loyalty";
const ST_KEY = "myapp.loyalty.settings";

const DEFAULT_SETTINGS = {
  enabled: true,
  accrualPerCurrency: 1,     // points earned per 1.00 currency spent (net payable)
  redeemCurrencyPerPoint: 0.05, // each point = 0.05 MYR (5 sen)
  minRedeemPoints: 50,       // min points to redeem
  maxRedeemPercent: 50,      // cap redemption at % of net (post-promo) subtotal
};

export function getLoyalty() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}" ); } catch { return {}; }
}
export function setLoyalty(v) {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ balance: 0, ledger: [], ...v })); } catch {}
}
export function getLoyaltySettings() {
  try { return { ...DEFAULT_SETTINGS, ...(JSON.parse(localStorage.getItem(ST_KEY) || "{}")) }; } catch { return DEFAULT_SETTINGS; }
}
export function setLoyaltySettings(patch) {
  const next = { ...getLoyaltySettings(), ...(patch||{}) };
  try { localStorage.setItem(ST_KEY, JSON.stringify(next)); } catch {}
  return next;
}

export function credit(points, meta={}) {
  if (!Number.isFinite(points) || points <= 0) return;
  const s = getLoyalty();
  const entry = { ts: Date.now(), type: "earn", points: Math.floor(points), meta };
  setLoyalty({ balance: (s.balance||0) + entry.points, ledger: [entry, ...(s.ledger||[])] });
}
export function debit(points, meta={}) {
  if (!Number.isFinite(points) || points <= 0) return false;
  const s = getLoyalty();
  const use = Math.min(Math.floor(points), Math.max(0, s.balance||0));
  if (use <= 0) return false;
  const entry = { ts: Date.now(), type: "redeem", points: use, meta };
  setLoyalty({ balance: (s.balance||0) - use, ledger: [entry, ...(s.ledger||[])] });
  return true;
}

// Helpers
export function valueForPoints(points, settings=getLoyaltySettings()) {
  return round2(points * Number(settings.redeemCurrencyPerPoint));
}
export function pointsForValue(amount, settings=getLoyaltySettings()) {
  const per = Number(settings.redeemCurrencyPerPoint || 0.05);
  return Math.floor((amount || 0) / per);
}
export function maxRedeemablePoints({ netSubtotal }, settings=getLoyaltySettings()) {
  const cap = Math.max(0, Number(settings.maxRedeemPercent || 50))/100;
  return pointsForValue(netSubtotal * cap, settings);
}
export function estEarnPoints({ payable }, settings=getLoyaltySettings()) {
  const per = Number(settings.accrualPerCurrency || 1);
  return Math.max(0, Math.floor(per * Number(payable||0)));
}
function round2(n){ return Math.round(Number(n||0) * 100)/100; }
