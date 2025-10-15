/* api-reservations.js
   Small client helper for creating and releasing reservations.
   Drop into `public/assets/js/` and include on pages that need reservation flow.
*/

const CONFIG = {
  API_BASE: '', // e.g. 'https://api.example.com' or relative '/api'
  AUTH_TOKEN: '',
  TIMEOUT_MS: 12000
};

function configureReservations(opts = {}){
  Object.assign(CONFIG, opts);
}

async function apiFetch(path, { method = 'GET', headers = {}, body } = {}){
  const ctl = new AbortController();
  const to = setTimeout(() => ctl.abort(), CONFIG.TIMEOUT_MS);
  try {
    const res = await fetch((CONFIG.API_BASE || '') + path, {
      method,
      headers: Object.assign({ 'Content-Type': 'application/json' },
        CONFIG.AUTH_TOKEN ? { Authorization: CONFIG.AUTH_TOKEN } : {}, headers),
      body: body ? JSON.stringify(body) : undefined,
      signal: ctl.signal
    });

    const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch (err) { void err; }

    if (!res.ok) {
      const msg = json?.message || json?.error || res.statusText || 'Request failed';
      const err = new Error(msg);
      err.status = res.status;
      err.body = json;
      throw err;
    }

    return json;
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('Request timed out');
    throw err;
  } finally {
    clearTimeout(to);
  }
}

// Reservations API
const RESERVE_MS = 5 * 60 * 1000; // default hold window (5 minutes)

async function apiCreateReservation(payload){
  // payload: { items: [{ productId, qty }], ttlMs }
  return apiFetch('/reservations', { method: 'POST', body: payload });
}

async function apiReleaseReservation(reservationId){
  return apiFetch(`/reservations/${encodeURIComponent(reservationId)}`, { method: 'DELETE' });
}

// Reliable release queue: attempts DELETE with exponential backoff on failure.
const _releaseQueue = new Map(); // id -> { attempts, timer }
const RELEASE_BASE_DELAY = 1000; // ms
const RELEASE_MAX_ATTEMPTS = 4;

async function _attemptRelease(id){
  if (!id) return false;
  const state = _releaseQueue.get(id) || { attempts: 0, timer: null };
  try {
    await apiReleaseReservation(id);
  // on success, cleanup and locally release
  if (state.timer) clearTimeout(state.timer);
  _releaseQueue.delete(id);
  try { releaseReservationLocal(id); } catch(e){ void e; }
    return true;
  } catch (err) {
    const attempts = (state.attempts || 0) + 1;
    if (attempts >= RELEASE_MAX_ATTEMPTS) {
      // give up after max attempts
      if (state.timer) clearTimeout(state.timer);
      _releaseQueue.delete(id);
      return false;
    }
    // schedule next attempt with exponential backoff + small jitter
    const delay = Math.min(30000, Math.round(RELEASE_BASE_DELAY * Math.pow(2, attempts - 1) + Math.random() * 500));
    const timer = setTimeout(()=> _attemptRelease(id), delay);
    _releaseQueue.set(id, { attempts, timer });
    return false;
  }
}

// Public helper: attempt reliable release and return a promise that resolves when release succeeds or final failure occurs
function apiReleaseReservationReliable(reservationId){
  if (!reservationId) return Promise.resolve(false);
  if (_releaseQueue.has(reservationId)) return Promise.resolve(false); // already scheduled
  _releaseQueue.set(reservationId, { attempts: 0, timer: null });
  return _attemptRelease(reservationId);
}


// If the file is included via a plain <script> (no module loader), provide
// a safe global so existing pages can call the helpers: window.apiReservations
if (typeof window !== 'undefined') {
  window.apiReservations = window.apiReservations || {};
  Object.assign(window.apiReservations, {
    configureReservations,
    apiCreateReservation,
    apiReleaseReservation,
    RESERVE_MS
  });
}

/* === Reservation countdown & local helpers ===
   These helpers are intentionally lightweight and avoid touching the DOM
   directly. Pass an `el` object with optional `reserveTimer` and `payStatus`
   DOM nodes, and/or provide callbacks via `opts`.
*/

let reserveTimerIv = null;
let activeReserveId = null;
let reservations = [];

// Provide a global `activeReserveId` property for legacy UI code that reads/writes
// a top-level variable. This proxies to the module-local `activeReserveId` so
// both sides stay in sync.
if (typeof window !== 'undefined') {
  try {
    Object.defineProperty(window, 'activeReserveId', {
      get() { return activeReserveId; },
      set(v) { activeReserveId = v; },
      configurable: true
    });
  } catch (e) {
    void e;
  }
}

function setActiveReservationId(id){ activeReserveId = id; }
function getActiveReservationId(){ return activeReserveId; }
function getReservations(){ return reservations.slice(); }
function setReservations(arr){ reservations = Array.isArray(arr) ? arr.slice() : []; }

function startReserveCountdown(expiresAt, opts = {}){
  // opts: { el: { reserveTimer, payStatus }, onTick(msLeft, mm, ss), onExpire(id) }
  clearReserveCountdown();
  const { el = {}, onTick, onExpire } = opts;
  const tick = ()=>{
    const left = Math.max(0, expiresAt - Date.now());
    const mm = String(Math.floor(left/60000)).padStart(2,"0");
    const ss = String(Math.floor((left%60000)/1000)).padStart(2,"0");
    if (el.reserveTimer) el.reserveTimer.textContent = `${mm}:${ss}`;
    if (typeof onTick === 'function') onTick(left, mm, ss);
    if(left <= 0){
      clearReserveCountdown();
      const id = activeReserveId;
      if (id) {
        // best-effort server release, swallow errors
        apiReleaseReservation(id).catch(()=>{ void 0; });
        releaseReservationLocal(id);
      }
      if (el.payStatus) el.payStatus.textContent = "Tempahan stok tamat. Cuba semula.";
      if (typeof onExpire === 'function') onExpire(id);
      setTimeout(()=> { if (typeof window.closePayModal === "function") window.closePayModal(); }, 800);
    }
  };
  reserveTimerIv = setInterval(tick, 250);
  tick();
}

function clearReserveCountdown(){
  if (reserveTimerIv) { clearInterval(reserveTimerIv); reserveTimerIv = null; }
  // if caller provided a DOM node earlier, they should clear it; we don't
  // assume global `el` exists. For convenience, update if a last-known element
  // was passed via startReserveCountdown's opts but we don't store it here.
}

function releaseReservationLocal(id){
  if(!id) return;
  reservations = reservations.filter(r => r.id !== id);
  if (activeReserveId === id) activeReserveId = null;
  // notify pages that care — they may register a callback on window.apiReservations.onReservationsUpdated
  if (typeof window.apiReservations?.onReservationsUpdated === 'function') {
    try { window.apiReservations.onReservationsUpdated(getReservations()); } catch(e) { void e; }
  }
}

// Compatibility alias expected by some UI code
function releaseReservation(id){ return releaseReservationLocal(id); }

// Defensive fallback for local-only reservation attempts.
// If your app provides a global `tryReserveCart()` implementation (returns { ok, expiresAt, need, available }),
// this wrapper will call it. Otherwise it returns { ok: false } so callers can present a helpful message.
async function tryReserveCart(){
  if (typeof window.tryReserveCart === 'function') {
    try {
      return await Promise.resolve(window.tryReserveCart());
    } catch(e){
      return { ok: false, error: e };
    }
  }
  return { ok: false, need: 0, available: 0 };
}

// Export the helpers and expose on the global helper object too
export {
  configureReservations,
  apiCreateReservation,
  apiReleaseReservation,
  apiReleaseReservationReliable,
  RESERVE_MS,
  startReserveCountdown,
  clearReserveCountdown,
  releaseReservationLocal,
  releaseReservation,
  tryReserveCart,
  setActiveReservationId,
  getActiveReservationId,
  getReservations,
  setReservations
};

if (typeof window !== 'undefined') {
  Object.assign(window.apiReservations, {
    startReserveCountdown,
    clearReserveCountdown,
    releaseReservationLocal,
    releaseReservation,
    apiReleaseReservationReliable,
    tryReserveCart,
    setActiveReservationId,
    getActiveReservationId,
    getReservations,
    setReservations
  });
}
