// src/utils/net-dev.js
let forceOffline = false;
export function setSimulateOffline(v){ forceOffline = !!v; }
export async function netFetch(input, init={}) {
  if (forceOffline) throw new Error("Simulated offline");
  return fetch(input, init);
}
export function forceSync() {
  return navigator.serviceWorker?.ready.then(r => r.sync?.register("outbox-sync"));
}
