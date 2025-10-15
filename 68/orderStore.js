  // --- ETA Countdown Helpers ---
  function setEtaTarget(minutes) {
    const cur = state.orders.find(o => o.id === state.currentOrderId);
    if (!cur) return;
    if (minutes == null || minutes <= 0) {
      cur.etaTargetAt = null;
      cur.etaMinutes = 0;
      persist();
      state.subscribers.forEach(fn => fn(getState()));
      return;
    }
    const target = Date.now() + minutes * 60 * 1000;
    cur.etaTargetAt = new Date(target).toISOString();
    tickEta();
  }

  function tickEta() {
    const cur = state.orders.find(o => o.id === state.currentOrderId);
    if (!cur || !cur.etaTargetAt) { cur && (cur.etaMinutes = 0); persist(); state.subscribers.forEach(fn => fn(getState())); return; }
    const msLeft = new Date(cur.etaTargetAt).getTime() - Date.now();
    const mins = Math.max(0, Math.ceil(msLeft / 60000));
    cur.etaMinutes = mins;
    // Auto-advance when it hits 0 and not terminal/ready/completed
    if (mins === 0 && !["ready","completed","cancelled","failed"].includes(cur.status)) {
      const ts = { ...(cur.timestamps || {}) };
      if (!ts.ready) ts.ready = new Date().toISOString();
      cur.status = "ready";
      cur.timestamps = ts;
      cur.etaTargetAt = null;
      cur.etaMinutes = 0;
    }
    persist();
    state.subscribers.forEach(fn => fn(getState()));
  }

  function startEtaCountdown() {
    const cur = state.orders.find(o => o.id === state.currentOrderId);
    if (!cur) return;
    if (!cur.etaTargetAt && cur.status === "preparing") {
      const base = cur.mode === "pickup" ? 10 : 25;
      setEtaTarget(base);
    }
  }

  function stopEtaCountdown() {
    setEtaTarget(null);
  }

// Demo promo catalog
const PROMOS = {
  "WELCOME10": { type: "percent", value: 0.10, minSubtotal: 20, expiresAt: null, desc: "10% off, min RM20" },
  "SAVE5":     { type: "fixed",   value: 5.00, minSubtotal: 30, expiresAt: null, desc: "RM5 off, min RM30" },
  "FREESHIP":  { type: "freeship", value: 1,  minSubtotal: 0,  expiresAt: null, desc: "Waive delivery fee" },
  // Example with expiry (YYYY-MM-DD)
  "OCTSALE":   { type: "percent", value: 0.15, minSubtotal: 50, expiresAt: "2025-10-31", desc: "15% off till Oct 31" },
};

// Tiny pub/sub store for order state (now with delivery/pickup + totals)
const FLOW = ["received", "preparing", "ready", "completed"];
const TERMINALS = ["cancelled", "failed"];
const STORAGE_KEY = "myapp.orders";


function createOrderStore(initial = {}) {
  // Orders array and current orderId

  const state = {
    orders: initial.orders || [
      {
        id: initial.id || "A1021",
        status: initial.status || "received",
        timestamps: { ...(initial.timestamps || {}) },
        mode: initial.mode || "delivery",
        deliveryAddress: initial.deliveryAddress || null,
        pickupOutlet: initial.pickupOutlet || null,
        subtotal: initial.subtotal ?? 48.00,
        shippingFee: initial.shippingFee ?? 0,
        etaMinutes: initial.etaMinutes ?? 0,
        etaTargetAt: initial.etaTargetAt || null,
        cart: initial.cart || [],
        paymentMethod: initial.paymentMethod || null,
        // --- Promo/Tax/Total ---
        promoCode: initial.promoCode || null,       // e.g., "WELCOME10"
        discount: initial.discount ?? 0,            // computed RM discount
        taxRate: initial.taxRate ?? 0.06,           // 6% SST (adjust as needed)
        total: initial.total ?? 0,                  // computed subtotal - discount + shipping + tax
      }
    ],
    currentOrderId: initial.id || "A1021",
    subscribers: new Set(),
  };
  // --- Promo helpers ---
  function validatePromo(code, subtotal) {
    if (!code) return { ok: false, reason: "No code" };
    const key = String(code).trim().toUpperCase();
    const p = PROMOS[key];
    if (!p) return { ok: false, reason: "Code not found" };
    if (p.expiresAt) {
      const now = new Date(); const exp = new Date(p.expiresAt + "T23:59:59");
      if (now > exp) return { ok: false, reason: "Code expired" };
    }
    if ((subtotal || 0) < (p.minSubtotal || 0)) {
      return { ok: false, reason: `Min subtotal RM${(p.minSubtotal||0).toFixed(2)}` };
    }
    return { ok: true, promo: { key, ...p } };
  }

  function computeDiscount(subtotal, shippingFee, promo) {
    if (!promo) return 0;
    if (promo.type === "percent") {
      return Math.round(subtotal * promo.value * 100) / 100;
    }
    if (promo.type === "fixed") {
      return Math.min(subtotal, Math.round(promo.value * 100) / 100);
    }
    if (promo.type === "freeship") {
      // We record the discount as the shipping fee waived (for clarity on Checkout)
      return Math.min(shippingFee, shippingFee);
    }
    return 0;
  }

  function applyPromo(code) {
    const s = getState();
    const check = validatePromo(code, s.subtotal);
    if (!check.ok) {
      // do not change promo — return reason for UI
      return { ok: false, reason: check.reason };
    }
    const promo = check.promo;
    // store code & recompute later in recompute()
    set({ promoCode: promo.key });
    return { ok: true, promo };
  }

  function removePromo() {
    set({ promoCode: null, discount: 0 });
  }


  function persist() {
    const { subscribers, ...clean } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  }


  function getState() {
    const { subscribers, ...clean } = state;
    // Return current order merged with global state
    const order = state.orders.find(o => o.id === state.currentOrderId) || state.orders[0];
    return { ...order, orders: state.orders, currentOrderId: state.currentOrderId };
  }


  function set(partial) {
    // Only update the current order
    const idx = state.orders.findIndex(o => o.id === state.currentOrderId);
    if (idx !== -1) {
      state.orders[idx] = { ...state.orders[idx], ...partial };
      recompute();
      persist();
      state.subscribers.forEach((fn) => fn(getState()));
    }
  }

  function setGlobal(partial) {
    Object.assign(state, partial);
    persist();
    state.subscribers.forEach((fn) => fn(getState()));
  }


  function subscribe(fn) {
    state.subscribers.add(fn);
    return () => state.subscribers.delete(fn);
  }

  // ----- MULTI-ORDER HELPERS -----
  function addOrder(order) {
    state.orders.unshift(order);
    state.currentOrderId = order.id;
    persist();
    state.subscribers.forEach((fn) => fn(getState()));
  }

  function listOrders() {
    return [...state.orders];
  }

  function setCurrentOrder(id) {
    if (state.orders.some(o => o.id === id)) {
      state.currentOrderId = id;
      persist();
      state.subscribers.forEach((fn) => fn(getState()));
    }
  }

  // ----- STATUS -----
  function setStatus(next) {
    const nowIso = new Date().toISOString();
    const ts = { ...state.timestamps };
    const nextStr = String(next).toLowerCase();

    const idx = TERMINALS.includes(nextStr) ? FLOW.length - 1 : FLOW.indexOf(nextStr);
    if (idx >= 0) {
      FLOW.forEach((s, i) => {
        if (i <= idx && !ts[s]) ts[s] = nowIso;
      });
    }
    if (TERMINALS.includes(nextStr)) ts[nextStr] = nowIso;

    set({ status: nextStr, timestamps: ts });
  }

  // ----- MODE + DETAILS -----
  function setMode(nextMode) {
    set({ mode: nextMode });
  }
  function setDeliveryAddress(addr) {
    set({ deliveryAddress: addr });
    if (state.mode !== "delivery") set({ mode: "delivery" });
  function setDeliveryAddress(addr) {
    set({ deliveryAddress: addr });
    if (state.mode !== "delivery") set({ mode: "delivery" });
  }
  function setPickupOutlet(outlet) {
    set({ pickupOutlet: outlet });
    if (state.mode !== "pickup") set({ mode: "pickup" });
  }
  function setSubtotal(amount) {
    set({ subtotal: Number(amount) || 0 });

  // ----- COMPUTATIONS -----
  function computeShippingFee({ mode, deliveryAddress, pickupOutlet }) {
    if (mode === "pickup") return 0;

    // Flat RM5 + small pseudo-distance factor by postcode last digit (demo only)
    let fee = 5;
    const pc = deliveryAddress?.postcode || "";
    const last = Number(String(pc).slice(-1));
    if (!Number.isNaN(last)) fee += Math.min(4, last * 0.3); // up to +RM3
    return Math.round(fee * 100) / 100;
  }

  function computeEtaMinutes({ mode, status }) {
    // Base ETAs (demo): pickup 10 min, delivery 25 min.
    const base = mode === "pickup" ? 10 : 25;
    // If already "ready" or beyond, ETA is near 0
    if (["ready", "completed", "cancelled", "failed"].includes(status)) return 0;
    // If still preparing, add a small buffer
    if (status === "preparing") return base - 5;
    return base;
  }

  function recompute() {
    // existing: shipping fee & ETA
    state.shippingFee = computeShippingFee(state);

    // Live ETA precedence if using etaTargetAt/etaStartAt
    if (state.etaTargetAt && state.etaStartAt) {
      const now = Date.now();
      const startMs = new Date(state.etaStartAt).getTime();
      const targetMs = new Date(state.etaTargetAt).getTime();
      const dur = Math.max(1, targetMs - startMs);
      const left = Math.max(0, targetMs - now);
      state.etaMinutes = Math.max(0, Math.ceil(left / 60000));
      state.etaProgress = Math.min(1, Math.max(0, 1 - left / dur));
    } else {
      state.etaMinutes = computeEtaMinutes(state);
      state.etaProgress = state.etaProgress || 0;
    }

    // ---- NEW: discount, tax, total ----
    let effectiveShipping = state.shippingFee;
    let discount = 0;

    // If promo freeship, we compute as discount equal to shipping fee
    const promo = state.promoCode ? PROMOS[state.promoCode] : null;

    if (promo && promo.type === "freeship") {
      discount = computeDiscount(state.subtotal, state.shippingFee, promo);
      effectiveShipping = Math.max(0, state.shippingFee - discount); // display-friendly, though discount shows separately
    } else {
      discount = computeDiscount(state.subtotal, state.shippingFee, promo);
    }

    // Clamp
    discount = Math.max(0, Math.min(discount, state.subtotal));

    // Tax is calculated on (subtotal - discount) only (typical case; adjust if your jurisdiction differs)
    const taxable = Math.max(0, state.subtotal - discount);
    const tax = Math.round(taxable * (state.taxRate ?? 0.06) * 100) / 100;

    const total = Math.round((taxable + effectiveShipping + tax) * 100) / 100;

    state.discount = discount;
    state.total = total;
    // (Persist happens in set() or tickEta(); no need to re-notify here)
  }

  // ----- CHECKOUT HELPERS -----

  function confirmOrder() {
    // Reset timestamps for a fresh confirmation, then stamp 'received'
    const nowIso = new Date().toISOString();
    const cur = state.orders.find(o => o.id === state.currentOrderId);
    if (!cur) return;
    const ts = { ...cur.timestamps };
    ["received","preparing","ready","completed","cancelled","failed"].forEach(k => delete ts[k]);
    ts.received = nowIso;
    set({ status: "received", timestamps: ts });
  }


  function startNewOrder(newId) {
    // Start a new blank order (keeps mode + address/outlet from last order)
    const last = state.orders[0] || {};
    const id = newId || makeOrderId();
    const newOrder = {
      id,
      status: "received",
      timestamps: { received: new Date().toISOString() },
      mode: last.mode || "delivery",
      deliveryAddress: last.deliveryAddress || null,
      pickupOutlet: last.pickupOutlet || null,
      subtotal: 0,
      shippingFee: 0,
      etaMinutes: 0,
      cart: [],
      paymentMethod: null,
    };
    addOrder(newOrder);
  }

  // Tiny ID generator for demo orders (Axxxx)
  function makeOrderId() {
    const n = Math.floor(Math.random() * 9000) + 1000;
    return "A" + n;
  }
  function hydrate() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) { recompute(); persist(); return; }
      const saved = JSON.parse(raw);
      Object.assign(state, saved);
      recompute();
      // notify once hydrated
      state.subscribers.forEach((fn) => fn(getState()));
    } catch {
      recompute();
      persist();
    }
  }

  // Initial compute + persist on first load
  recompute();
  persist();


  return {
    getState, subscribe, setStatus,
    setMode, setDeliveryAddress, setPickupOutlet, setSubtotal,
    hydrate, FLOW, TERMINALS,
    confirmOrder, startNewOrder,
    addOrder, listOrders, setCurrentOrder, // multi-order helpers
    // Promo/Tax helpers
    applyPromo, removePromo, validatePromo,
  };
}

export const orderStore = createOrderStore({
  id: "A1021",
  status: "preparing",
  timestamps: {
    received: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    preparing: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
});
