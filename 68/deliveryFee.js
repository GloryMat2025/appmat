// src/utils/deliveryFee.js
// Storage shape: { [outletId]: { freeThreshold: 80, tiers: [{maxKm:3, fee:3},{maxKm:6, fee:6}], noServiceBeyondKm: 10 } }
const LS = "myapp.delivery.zones";
export function getZonesMap() { try { return JSON.parse(localStorage.getItem(LS) || "{}" ); } catch { return {}; } }
export function saveZonesMap(map) { try { localStorage.setItem(LS, JSON.stringify(map||{})); } catch {} }
export function setOutletZones(outletId, cfg) {
  const map = getZonesMap(); map[String(outletId)] = cfg; saveZonesMap(map); return cfg;
}
export function getOutletZones(outletId) {
  const map = getZonesMap(); return map[String(outletId)] || { freeThreshold: 0, tiers: [], noServiceBeyondKm: 0 };
}

/** Compute fee given outlet coords, address coords, cart total, and outlet's zone config */
export function computeDeliveryFee({ outlet, address, cartTotal, outletZones }) {
  if (!outlet || !isFinite(outlet.lat) || !isFinite(outlet.lng)) return { ok:false, reason:"no_outlet_coords" };
  if (!address || !isFinite(address.lat) || !isFinite(address.lng)) return { ok:false, reason:"no_address_coords" };

  const distKm = distance(outlet, address);
  const cfg = outletZones || { tiers:[], freeThreshold:0, noServiceBeyondKm:0 };

  if (cfg.noServiceBeyondKm && distKm > cfg.noServiceBeyondKm) {
    return { ok:false, reason:"beyond_zone", distKm };
  }

  if (cfg.freeThreshold && Number(cartTotal||0) >= Number(cfg.freeThreshold)) {
    return { ok:true, fee:0, distKm, zone:"free" };
  }

  // find first tier whose maxKm >= dist
  const tier = (cfg.tiers || []).find(t => distKm <= Number(t.maxKm));
  if (tier) return { ok:true, fee: Number(tier.fee||0), distKm, zone:`≤ ${tier.maxKm}km` };

  // if no tiers and still inside noServiceBeyondKm (or unlimited), fee 0 by default
  return { ok:true, fee: 0, distKm, zone:"base" };
}

function distance(a, b) {
  // inline (avoid import loops)
  const R = 6371, toRad = (d)=> d*Math.PI/180;
  const dLat = toRad((b.lat - a.lat)||0), dLng = toRad((b.lng - a.lng)||0);
  const sLat1 = toRad(a.lat), sLat2 = toRad(b.lat);
  const h = Math.sin(dLat/2)**2 + Math.cos(sLat1)*Math.cos(sLat2)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1-h));
}
