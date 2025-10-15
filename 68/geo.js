// src/utils/geo.js
export function haversineKm(a, b) {
  const R = 6371; // km
  const dLat = toRad((b.lat - a.lat) || 0);
  const dLng = toRad((b.lng - a.lng) || 0);
  const sLat1 = toRad(a.lat), sLat2 = toRad(b.lat);
  const h = Math.sin(dLat/2)**2 + Math.cos(sLat1)*Math.cos(sLat2)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1-h));
}
export const toRad = (d)=> d * Math.PI / 180;
export const fmtKm = (k)=> `${(Math.round(k*10)/10).toFixed(1)} km`;
export function parseLatLng(text) {
  const m = String(text||"").trim().match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
  return m ? { lat: Number(m[1]), lng: Number(m[2]) } : null;
}
