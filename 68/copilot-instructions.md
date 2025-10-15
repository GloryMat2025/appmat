# Copilot Instructions for appmat
 # Copilot Instructions for appmat

 Quick, actionable guide for AI agents working in this repo (focused on the static frontend under `public/`).

 ## Big picture
 - This repo is primarily a static, multi-page frontend served from `public/`.
 - No single-page framework — Vanilla JS modules and Tailwind CSS power the UI.
 - PWA support is present: service worker (`public/sw.js`), registration (`public/js/sw-register.js`) and manifest (`public/manifest.webmanifest`).

 ## Key directories & files
 - `public/`
   - HTML pages: `index.html`, `menu.html`, `cart.html`, `checkout.html`, `orders.html`, `account.html`, etc.
   - `public/popups/`: reusable popup fragments (`product-details.html`, `select-your-outlet.html`).
   - `public/js/`: client scripts (e.g. `main.js`, `app.js`, `popup-loader.js`, `popup-controllers.js`, `role-gate.js`, `audit-client.js`, `cart.js`, `checkout.js`, `sw-register.js`, `toast.js`).
   - `public/assets/`: Tailwind outputs (`tailwind.css`, `tailwind.min.css`) and compiled app CSS in `assets/css/`.
   - `public/data/`: sample JSON/CSV (e.g. `products.json`, `categories.json`, `orders.json`, `inventory.csv`).
   - `public/sw.js` and `public/offline.html`: service worker and offline fallback.
   - `public/i18n/`: `en.json`, `bm.json`, and loader helpers used by HTML fragments.

 ## Project-specific patterns (do NOT assume framework defaults)
 - Modals / Popups:
   - Triggering: `data-modal-target` attributes. The popup lifecycle is implemented in `public/js/popup-loader.js` and `public/js/popup-controllers.js`.
   - Fragments live in `public/popups/` — add an HTML fragment there and ensure `popup-loader`/`popup-controllers` can fetch and attach it.
# Copilot Instructions for appmat

Quick, actionable guide for AI agents working in this repo (focused on the static frontend under `public/`).

## Big picture
- This repo is primarily a static, multi-page frontend served from `public/`.
- No single-page framework — Vanilla JS modules and Tailwind CSS power the UI.
- PWA support is present: service worker (`public/sw.js`), registration (`public/js/sw-register.js`) and manifest (`public/manifest.webmanifest`).

## Key directories & files
- `public/`
  - HTML pages: `index.html`, `menu.html`, `cart.html`, `checkout.html`, `orders.html`, `account.html`, etc.
  - `public/popups/`: reusable popup fragments (`product-details.html`, `select-your-outlet.html`).
  - `public/js/`: client scripts (e.g. `main.js`, `app.js`, `popup-loader.js`, `popup-controllers.js`, `role-gate.js`, `audit-client.js`, `cart.js`, `checkout.js`, `sw-register.js`, `toast.js`).
  - `public/assets/`: Tailwind outputs (`tailwind.css`, `tailwind.min.css`) and compiled app CSS in `assets/css/`.
  - `public/data/`: sample JSON/CSV (e.g. `products.json`, `categories.json`, `orders.json`, `inventory.csv`).
  - `public/sw.js` and `public/offline.html`: service worker and offline fallback.
  - `public/i18n/`: `en.json`, `bm.json`, and loader helpers used by HTML fragments.

## Project-specific patterns (do NOT assume framework defaults)
- Modals / Popups:
  - Triggering: `data-modal-target` attributes. The popup lifecycle is implemented in `public/js/popup-loader.js` and `public/js/popup-controllers.js`.
  - Fragments live in `public/popups/` — add an HTML fragment there and ensure `popup-loader`/`popup-controllers` can fetch and attach it.
 # Copilot Instructions for appmat

 Quick, actionable guide for AI agents working in this repo (focused on the static frontend under `public/`).

 ## Big picture
 - This repo is primarily a static, multi-page frontend served from `public/`.
 - No single-page framework — Vanilla JS modules and Tailwind CSS power the UI.
 - PWA support is present: service worker (`public/sw.js`), registration (`public/js/sw-register.js`) and manifest (`public/manifest.webmanifest`).

 ## Key directories & files
 - `public/`
   - HTML pages: `index.html`, `menu.html`, `cart.html`, `checkout.html`, `orders.html`, `account.html`, etc.
   - `public/popups/`: reusable popup fragments (`product-details.html`, `select-your-outlet.html`).
   - `public/js/`: client scripts (e.g. `main.js`, `app.js`, `popup-loader.js`, `popup-controllers.js`, `role-gate.js`, `audit-client.js`, `cart.js`, `checkout.js`, `sw-register.js`, `toast.js`).
   - `public/assets/`: Tailwind outputs (`tailwind.css`, `tailwind.min.css`) and compiled app CSS in `assets/css/`.
   - `public/data/`: sample JSON/CSV (e.g. `products.json`, `categories.json`, `orders.json`, `inventory.csv`).
   - `public/sw.js` and `public/offline.html`: service worker and offline fallback.
   - `public/i18n/`: `en.json`, `bm.json`, and loader helpers used by HTML fragments.

 ## Project-specific patterns (do NOT assume framework defaults)
 - Modals / Popups:
   - Triggering: `data-modal-target` attributes. The popup lifecycle is implemented in `public/js/popup-loader.js` and `public/js/popup-controllers.js`.
   - Fragments live in `public/popups/` — add an HTML fragment there and ensure `popup-loader`/`popup-controllers` can fetch and attach it.
 # Copilot Instructions for appmat

 Quick, actionable guide for AI agents working in this repo (focused on the static frontend under `public/`).

 ## Big picture
 - This repo is primarily a static, multi-page frontend served from `public/`.
 - No single-page framework — Vanilla JS modules and Tailwind CSS power the UI.
 - PWA support is present: service worker (`public/sw.js`), registration (`public/js/sw-register.js`) and manifest (`public/manifest.webmanifest`).

 ## Key directories & files
 - `public/`
   - HTML pages: `index.html`, `menu.html`, `cart.html`, `checkout.html`, `orders.html`, `account.html`, etc.
   - `public/popups/`: reusable popup fragments (`product-details.html`, `select-your-outlet.html`).
   - `public/assets/js/` and `public/js/`: client scripts (e.g. `main.js`, `app.js`, `popup-loader.js`, `popup-controllers.js`, `role-gate.js`, `audit-client.js`, `cart.js`, `checkout.js`, `sw-register.js`, `toast.js`).
   - `public/assets/`: Tailwind outputs (`tailwind.css`, `tailwind.min.css`) and compiled app CSS in `assets/css/`.
   - `public/data/`: sample JSON/CSV (e.g. `products.json`, `categories.json`, `orders.json`, `inventory.csv`).
   - `public/sw.js` and `public/offline.html`: service worker and offline fallback.
   - `public/i18n/`: `en.json`, `bm.json`, and loader helpers used by HTML fragments.

 ## Project-specific patterns (do NOT assume framework defaults)
 - Modals / Popups:
   - Triggering: `data-modal-target` attributes and programmatic `openPopup(name, opts)` (see `public/assets/js/popup-loader.js`).
   - Controllers: `window.PopupControllers[name]` functions are looked up in `public/assets/js/popup-controllers.js`.
   - Fragments live in `public/popups/` — add an HTML fragment there and ensure loader/controllers are wired.
 - Role gating / RBAC:
   - Client-side gating uses `public/assets/js/role-gate.js`. This is a front-end guard — server-side enforcement (if any) is implemented in `server/` (middleware `requirePerm`).
 - PWA & caching:
   - Update `CACHE_VERSION` inside `public/sw.js` when changing cache semantics and add assets to the cache list.
   - Service worker registration is in `public/js/sw-register.js` — include it on pages that should register the SW.
 - i18n:
   - JSON files in `public/i18n/` drive translations. HTML loader helpers like `products_i18n_loader.html` show usage patterns.

 ## How to extend (concrete examples)
 - Add a new popup:
   1. Create fragment: `public/popups/my-popup.html` (copy structure from `product-details.html`).
   2. Add trigger in your page: `<button data-modal-target="my-popup">Open</button>` or call `openPopup('my-popup', opts)`.
   3. Add controller (optional): define `window.PopupControllers['my-popup']` in `public/assets/js/popup-controllers.js` to handle interactions and call `done()`.
 - Add a static data fixture:
   - Put JSON/CSV into `public/data/` and reference it from client code (see `public/assets/js/cart-categories.js` and `public/data/products.json`).
 - Add a new SW cached asset:
   - Add the path to the asset list in `public/sw.js` and bump `CACHE_VERSION`.

 ### Concrete popup example (copy/paste)
 Below is an exact minimal pattern to add a new popup named `my-popup` using the project's existing wiring. Adapt markup/classes as needed.

 1) HTML fragment — create `public/popups/my-popup.html`:

 ```html
 <div class="bg-white rounded-2xl shadow-lg max-w-sm w-full p-6">
   <button data-close class="absolute top-3 right-3">&times;</button>
   <h2 class="text-lg font-bold mb-2">Example popup</h2>
   <p class="text-sm text-gray-600 mb-4">Some content here.</p>
   <button data-action class="btn-primary">Confirm</button>
 </div>
 ```

 2) Controller — add to `public/assets/js/popup-controllers.js` (or the unminified source):

 ```javascript
 window.PopupControllers = window.PopupControllers || {};
 window.PopupControllers['my-popup'] = (dlg, opts, done) => {
   const action = dlg.querySelector('[data-action]');
   action.addEventListener('click', () => done({ ok: true }));
 };
 ```

 3) Trigger — anywhere in the UI (e.g., in `public/assets/js/menu.js`):

 ```javascript
 // openPopup(name, opts) is provided by public/assets/js/popup-loader.js
 document.getElementById('openExample').addEventListener('click', ()=>{
   openPopup('my-popup', { someOption: 123 }).then(result => {
     if (result) console.log('popup returned', result);
   });
 });
 ```

 ## Backend (optional) — quick guide
 The `server/` folder is an Express API used by some deployments. Important notes:
 - Entry: `server/index.js` (uses `helmet`, `cors`, `cookie-parser`, `cookie-session`).
 - Middleware: `rateLimit()` applied globally; `requirePerm()` used for RBAC checks; `audit()` middleware available for request auditing; `csrf()` used for sensitive routes; `require2FA()` for high-risk actions.
 - Routes: many are mounted under `/api/*` (examples: `/api/auth`, `/api/2fa`, `/api/audit`, `/api/backups`, `/api/settings`, `/api/health`).
 - Dev scripts: see `server/package.json` — run the API with:

 ```powershell
 cd server
 npm install
 npm run dev
 ```

 - Useful endpoints:
   - `GET /api/csrf` — sets a CSRF cookie and returns a token (browser flows).
   - `GET /api/health` — simple health check.

 ## Debugging tips (from repo evidence)
 - Assets not updating: bump `CACHE_VERSION` in `public/sw.js` and reload; check `public/js/sw-register.js` registration logs.
 - Modal not appearing: confirm fragment exists in `public/popups/` and that `data-modal-target` matches the fragment id; check console for `popup-loader.js` fetch errors.
 - Translations missing: verify keys exist in `public/i18n/en.json` / `public/i18n/bm.json` and that the relevant i18n loader script is included on the page.

 ## Where to look next
 - Scan `public/assets/js/*.js` for concrete implementations: `popup-loader.js`, `popup-controllers.js`, `role-gate.js`, `audit-client.js`, `main.js`, `menu.js`.
 - Inspect `public/sw.js` and `public/manifest.webmanifest` for PWA behaviour and cache lists.
 - For backend: inspect `server/index.js`, `server/package.json`, and `server/routes/` for auth, RBAC and audit usage.

 If you want, I can:
 - Add inline code snippets for common PR changes (bump SW cache, run `npm run build:prod`, check i18n keys).
 - Perform a small scan of `server/` and produce a short runbook for local API testing.

 Please tell me which next action you prefer or what to clarify.
This mirrors the `product-details` popup pattern (see `public/popups/product-details.html` and `public/assets/js/popup-controllers.js`).

 ## Debugging tips (from repo evidence)
 - Assets not updating: bump `CACHE_VERSION` in `public/sw.js` and reload; check `public/js/sw-register.js` registration logs.
 - Modal not appearing: confirm fragment exists in `public/popups/` and that `data-modal-target` matches the fragment id; check console for `popup-loader.js` fetch errors.
 - Translations missing: verify keys exist in `public/i18n/en.json` / `public/i18n/bm.json` and that the relevant i18n loader script is included on the page.

 ## Where to look next
 - Scan `public/js/*.js` for concrete implementations: `popup-loader.js`, `popup-controllers.js`, `role-gate.js`, `audit-client.js`, `main.js`.
 - Inspect `public/sw.js` and `public/manifest.webmanifest` for PWA behaviour and cache lists.
 - Use `public/data/` to find example payload shapes for client-side code.

 If you want, I can:
 - Update this file to include exact code snippets for adding a popup (based on an existing popup fragment).
 - Scan other top-level folders (`server/`, `src/`, `scripts/`) and merge their discovered workflows into this doc.

 Please tell me which next action you prefer or what to clarify.
Please tell me which next action you prefer or what to clarify.

## Reservations client — usage

Quick examples for the new `public/assets/js/api-reservations.js` helper. The file exposes both ES module exports and a safe global `window.apiReservations` for pages that don't use modules.

Module (recommended when bundling or using `<script type="module">`):

```javascript
import {
  configureReservations,
  apiCreateReservation,
  apiReleaseReservation,
  startReserveCountdown,
  setActiveReservationId,
  RESERVE_MS
} from '/assets/js/api-reservations.js';

configureReservations({ API_BASE: '/api', AUTH_TOKEN: 'Bearer ...' });

// build items: [{ productId, qty }]
const svr = await apiCreateReservation({ items, ttlMs: RESERVE_MS });
setActiveReservationId(svr.reservationId);
startReserveCountdown(svr.expiresAt, {
  el: { reserveTimer: document.getElementById('reserveTimer'), payStatus: document.getElementById('payStatus') },
  onExpire: (id) => { /* optional: show UI feedback */ }
});

// when closing payment or cancelling:
await apiReleaseReservation(svr.reservationId);
```

Non-module (legacy pages):

```html
<script src="/assets/js/api-reservations.js"></script>
<script>
  window.apiReservations.configureReservations({ API_BASE: '/api' });
  const svr = await window.apiReservations.apiCreateReservation({ items, ttlMs: window.apiReservations.RESERVE_MS });
  window.apiReservations.setActiveReservationId(svr.reservationId);
  window.apiReservations.startReserveCountdown(svr.expiresAt, { el: { reserveTimer, payStatus } });
  // release:
  await window.apiReservations.apiReleaseReservation(svr.reservationId);
</script>
```

Fallbacks and compatibility
- The client will call `window.tryReserveCart()` if your UI implements it when the server reservation fails; otherwise `tryReserveCart()` returns `{ ok: false }` so callers can display a stock message.
- The library exposes `releaseReservation(id)` (alias for the local release helper) for compatibility with existing UI code.
- You can listen for local reservation changes by assigning a callback: `window.apiReservations.onReservationsUpdated = (arr) => { /* update UI */ }`.

Notes
- The helpers deliberately avoid assuming global DOM elements — pass DOM nodes via the `el` option to `startReserveCountdown` so the helper can update the timer and status text.
- Network errors while releasing reservations are swallowed by default to avoid blocking the UI; if you need retries or stronger guarantees, extend `apiReleaseReservation` with retry logic.

