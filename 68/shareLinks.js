// Delete a specific short link by id
export function deleteShortLink(id) {
  const map = loadMap();
  if (map[id]) { delete map[id]; saveMap(map); return true; }
  return false;
}

// Clear all short links
export function clearAllShortLinks() {
  saveMap({});
  return true;
}
const MAP_KEY = "myapp.shareMap"; // { id: { token, expiresAt } }

function loadMap() {
  try { return JSON.parse(localStorage.getItem(MAP_KEY)) || {}; }
  catch { return {}; }
}
function saveMap(map) {
  localStorage.setItem(MAP_KEY, JSON.stringify(map));
}

export function createShortLink(token, ttlMinutes = 60) {
  purgeExpired();
  const id = Math.random().toString(36).slice(2, 8); // 6-char slug
  const exp = ttlMinutes > 0 ? Date.now() + ttlMinutes * 60 * 1000 : null;
  const map = loadMap();
  map[id] = { token, expiresAt: exp };
  saveMap(map);
  return id;
  
// Copy Short Link handler for receipt modal
// Usage: Call this after modal and btnShort are available in DOM
export function setupCopyShortLinkHandler({ btnShort, modal, orderStore, showToast }) {
  if (!btnShort || !modal || !orderStore) return;
  btnShort.addEventListener("click", async () => {
    const sNow = orderStore.getState();
    const payload = {
      id: sNow.id, mode: sNow.mode,
      deliveryAddress: sNow.mode === "delivery" ? (sNow.deliveryAddress || null) : null,
      pickupOutlet: sNow.mode === "pickup" ? (sNow.pickupOutlet || null) : null,
      subtotal: sNow.subtotal, discount: sNow.discount, shippingFee: sNow.shippingFee,
      taxRate: sNow.taxRate, total: sNow.total, promoCode: sNow.promoCode || null,
      cart: Array.isArray(sNow.cart) ? sNow.cart.map(({name,qty,price})=>({name,qty,price})) : null,
      timestamps: sNow.timestamps || {},
    };
    const encoded = encodeSharePayload(payload);

    const ttlSel = modal.body.parentElement.querySelector("#ttlSel"); // lives in actions
    const ttlMinutes = ttlSel ? Number(ttlSel.value) : 1440;
    const slug = createShortLink(encoded, ttlMinutes);
    const shortUrl = `${location.origin}${location.pathname}#/s/${slug}`;

    try {
      await navigator.clipboard.writeText(shortUrl);
      showToast?.("Short link copied!");
    } catch {
      prompt("Copy this short link:", shortUrl);
    }
  });
}
}

export function resolveShortLink(id) {
  const map = loadMap();
  const entry = map[id];
  if (!entry) return { ok: false, reason: "Not found" };
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    delete map[id]; saveMap(map);
    return { ok: false, reason: "Expired" };
  }
    // analytics
    entry.hits = (entry.hits || 0) + 1;
    entry.lastAccessAt = Date.now();
    saveMap(map);
    return { ok: true, token: entry.token, expiresAt: entry.expiresAt || null, hits: entry.hits, lastAccessAt: entry.lastAccessAt };
}

export function purgeExpired() {
  const map = loadMap();
  let changed = false;
  for (const [id, v] of Object.entries(map)) {
    if (v.expiresAt && Date.now() > v.expiresAt) { delete map[id]; changed = true; }
  }
  if (changed) saveMap(map);
}

export function listShortLinks() {
  // Optional: for debugging/admin listing
  purgeExpired();
  const map = loadMap();
    return Object.entries(map).map(([id, v]) => ({ id, ...v, hits: v.hits || 0, lastAccessAt: v.lastAccessAt || null }));
}
