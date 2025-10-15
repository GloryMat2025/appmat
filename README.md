<<<<<<< HEAD
# appmat
=======
# appmat – Bilingual README (BM & EN)

This document provides a concise overview of your project structure, page flow, dev/build commands, security notes, and quick debugging tips in **both English (EN)** and **Bahasa Melayu (BM)**.

---

## 1) Project Structure / Struktur Projek

**EN**
```
appmat/
├─ public/                       # Static assets & pages
│  ├─ menu.html                  # Menu page
│  ├─ cart.html                  # Cart
│  ├─ checkout.html              # Checkout
│  ├─ orders.html                # Orders list/status
│  ├─ rewards.html               # Rewards/loyalty
│  ├─ account.html               # User account
│  ├─ reports.html               # Ops/Reports
│  ├─ popups/
│  │  └─ select-your-outlet.html # Select outlet popup
│  ├─ pickup/
│  │  └─ index.html              # Pickup flow
│  ├─ delivery/
│  │  ├─ index.html              # Delivery address
│  │  └─ confirm.html            # Confirm address/slot
│  ├─ js/                        # Small helpers (sw-register, toast, etc.)
│  ├─ assets/                    # Tailwind output (tailwind.css/min.css)
│  ├─ offline.html               # PWA offline page
│  ├─ manifest.webmanifest       # PWA manifest
│  └─ sw.js                      # Service Worker
│
├─ src/                          # Sources (Vanilla JS + Tailwind src)
│  ├─ input.css                  # Tailwind source
│  ├─ main.js, app.js            # Entry & event wiring
│  ├─ components/
│  │  ├─ modals/                 # Popup/modal components
│  │  ├─ OrderSteps, NotifyBell, OfflineBanner, CommandPalette
│  └─ pages/                     # Page logic
│
├─ server/ (optional)            # Express API + OIDC/SSO + middleware
│  ├─ index.js
│  ├─ routes/                    # auth, 2fa, rbac, apikeys, metrics, notify, backups, etc.
│  ├─ lib/                       # db (pg/redis), notifier, queue, storage, crypto_env
│  ├─ middleware/                # csrf, ratelimit, lockout, auth, require2fa, perm
│  └─ db/                        # schema.sql, rbac.sql, apikeys.sql, secrets.sql, webhooks.sql
│
├─ scripts/                      # Build & ops tools
│  ├─ dev.mjs, serve-auto.mjs
│  ├─ minify-js.js, rev-assets.mjs, images-pipeline.mjs
│  └─ migrate.js, seed_roles.js
│
├─ styles/                       # Component-specific CSS
├─ capacitor.config.ts (optional)
├─ service-worker.js (optional notifications)
├─ tailwind.config.js / postcss.config.*
├─ .env.example
└─ package.json
```

**BM**
```
appmat/
├─ public/                       # Aset statik & halaman
│  ├─ menu.html                  # Halaman menu utama
│  ├─ cart.html                  # Troli
│  ├─ checkout.html              # Pembayaran/checkout
│  ├─ orders.html                # Senarai/Status pesanan
│  ├─ rewards.html               # Ganjaran/loyalti
│  ├─ account.html               # Akaun pengguna
│  ├─ reports.html               # Laporan/operasi
│  ├─ popups/
│  │  └─ select-your-outlet.html # Popup pilih cawangan
│  ├─ pickup/
│  │  └─ index.html              # Aliran pickup
│  ├─ delivery/
│  │  ├─ index.html              # Alamat penghantaran
│  │  └─ confirm.html            # Sahkan alamat/slot
│  ├─ js/                        # Skrip kecil
│  ├─ assets/                    # Hasil Tailwind (tailwind.css/min.css)
│  ├─ offline.html               # Halaman offline PWA
│  ├─ manifest.webmanifest       # Manifest PWA
│  └─ sw.js                      # Service Worker
│
├─ src/                          # Sumber (Vanilla JS + Tailwind)
│  ├─ input.css                  # Asal Tailwind
│  ├─ main.js, app.js            # Entry & wiring event
│  ├─ components/
│  │  ├─ modals/                 # Komponen popup/modal
│  │  ├─ OrderSteps, NotifyBell, OfflineBanner, CommandPalette
│  └─ pages/                     # Logik halaman
│
├─ server/ (opsyenal)            # Express API + OIDC/SSO + middleware
│  ├─ index.js
│  ├─ routes/                    # auth, 2fa, rbac, apikeys, metrics, notify, backups, dll.
│  ├─ lib/                       # db (pg/redis), notifier, queue, storage, crypto_env
│  ├─ middleware/                # csrf, ratelimit, lockout, auth, require2fa, perm
│  └─ db/                        # schema.sql, rbac.sql, apikeys.sql, secrets.sql, webhooks.sql
│
├─ scripts/                      # Alat build & operasi
│  ├─ dev.mjs, serve-auto.mjs
│  ├─ minify-js.js, rev-assets.mjs, images-pipeline.mjs
│  └─ migrate.js, seed_roles.js
│
├─ styles/                       # CSS komponen
├─ capacitor.config.ts (opsyen)
├─ service-worker.js (notifikasi opsyen)
├─ tailwind.config.js / postcss.config.*
├─ .env.example
└─ package.json
```

---

## 2) Run / Build

**EN**
```bash
npm i
npm run dev           # http://localhost:5173
npm run build         # Tailwind build
npm run build:prod    # minify + revision + image pipeline
npm run serve:dist    # serve production bundle (e.g., http://localhost:5174)
```

**BM**
```bash
npm i
npm run dev           # http://localhost:5173
npm run build         # bina Tailwind
npm run build:prod    # minify + revision + image pipeline
npm run serve:dist    # servis output produksi (cth: http://localhost:5174)
```

---

## 3) Page Flow / Aliran Halaman

**EN**
```
Menu → Cart → Checkout → Orders
  ├─ Delivery toggle → delivery/index.html → confirm.html
  ├─ Pickup toggle   → pickup/index.html
  └─ Rewards         → rewards.html
Account (account.html) & Reports (reports.html) are accessible via nav.
```

**BM**
```
Menu → Cart → Checkout → Orders
  ├─ Tukar ke Delivery → delivery/index.html → confirm.html
  ├─ Tukar ke Pickup   → pickup/index.html
  └─ Rewards           → rewards.html
Akaun (account.html) & Laporan (reports.html) boleh dicapai dari nav.
```

---

## 4) Security Notes / Nota Keselamatan (API Optional)

**EN**
- Lockout & rate‑limit login attempts.
- Enable CSRF for sensitive routes (not needed for login).
- Enforce 2FA for high‑risk actions (restore/keys).
- Use RBAC via `rbac.sql` + `perm` middleware.
- Store secrets in env/KV, not in the repo.

**BM**
- Lockout & rate limit untuk login.
- Aktifkan CSRF bagi route sensitif (bukan login).
- Wajibkan 2FA untuk tindakan berisiko (restore/settings).
- Guna RBAC (`rbac.sql` + middleware `perm`).
- Rahsia disimpan dalam env/KV, bukan repo.

---

## 5) Quick Debug / Debug Pantas

**EN**
- CSS not applying → check link to `public/assets/tailwind.css`, ensure watch/build is running.
- Old SW cache → hard refresh / bump `CACHE_VERSION` in `sw.js`.
- Asset paths in `serve:dist` → verify relative URLs.
- Modals not opening → verify `data-modal-target` & event listeners after DOM ready.
- CORS/API → check `server/index.js` (helmet + cors) & request headers.

**BM**
- CSS tidak memuat → semak pautan ke `public/assets/tailwind.css`, pastikan watch/build berjalan.
- Cache SW lama → hard refresh / naikkan `CACHE_VERSION` dalam `sw.js`.
- Laluan aset ketika `serve:dist` → sahkan URL relatif.
- Modal tak buka → semak `data-modal-target` & listener selepas DOM ready.
- CORS/API → semak `server/index.js` (helmet + cors) & header permintaan.
# appmat – Struktur & Panduan Ringkas

Dokumen ini merangkum struktur projek, aliran halaman (peta navigasi), skrip pembangunan, serta tip debug pantas. Sesuai untuk **HTML + Vanilla JS + Tailwind** dengan PWA & (opsyenal) Express API.

---

## 1) Struktur Direktori (ringkas)

```
appmat/
├─ public/                       # Aset statik & halaman
│  ├─ menu.html
│  ├─ cart.html
│  ├─ checkout.html
│  ├─ orders.html
│  ├─ rewards.html
│  ├─ account.html
│  ├─ reports.html
│  ├─ popups/
│  │  └─ select-your-outlet.html
│  ├─ pickup/
│  │  └─ index.html
│  ├─ delivery/
│  │  ├─ index.html
│  │  └─ confirm.html
│  ├─ js/                        # helper kecil (sw-register, toast, dll.)
│  ├─ assets/                    # tailwind.css (output)
│  ├─ offline.html
│  ├─ manifest.webmanifest
│  └─ sw.js                      # Service Worker PWA
│
├─ src/                          # Sumber utama (Vanilla JS + Tailwind src)
│  ├─ input.css                  # Tailwind source
│  ├─ main.js, app.js
│  ├─ components/
│  │  ├─ modals/ (DeliveryAddressModal, PickupOutletModal, PaymentModal, dll.)
│  │  ├─ OrderSteps, NotifyBell, OfflineBanner, CommandPalette, dll.
│  └─ pages/ (MenuPage, CheckoutPage, OrderDetailPage, MyOrdersPage, ...)
│
├─ server/ (opsyen)              # Express API + OIDC/SSO + middleware
│  ├─ index.js
│  ├─ routes/ (auth, 2fa, rbac, apikeys, metrics, notify, backups, dll.)
│  ├─ lib/ (db pg/redis, notifier, queue, storage, crypto_env)
│  ├─ middleware/ (csrf, ratelimit, lockout, auth, require2fa, perm)
│  └─ db/ (schema.sql, rbac.sql, apikeys.sql, secrets.sql, webhooks.sql)
│
├─ scripts/ (build & ops)
│  ├─ dev.mjs, serve-auto.mjs
│  ├─ minify-js.js, rev-assets.mjs, images-pipeline.mjs
│  └─ migrate.js, seed_roles.js
│
├─ styles/ (CSS khusus komponen)
├─ capacitor.config.ts (opsyen)
├─ service-worker.js (notifikasi; jika berbeza dari sw.js)
├─ tailwind.config.js / postcss.config.*
├─ .env.example
└─ package.json
```

> **Nota**: Struktur di atas adalah ringkasan praktikal daripada kandungan projek anda. Nama fail/komponen mungkin berbeza sedikit mengikut versi.

---

## 2) Jalankan Projek

### Dev (Frontend)
```bash
npm i
npm run dev           # serve di http://localhost:5173 (rujuk .dev-port)
```
Tailwind auto‑watch disatukan melalui `dev.mjs`. Jika perlu manual:
```bash
npm run watch:css     # watch Tailwind src/input.css → public/assets/tailwind.css
```

### Build (Production)
```bash
npm run build         # build CSS (Tailwind)
npm run build:prod    # minify + revision + image pipeline
npm run serve:dist    # serve hasil build (cth: http://localhost:5174)
```

### API Server (Opsyenal)
```bash
cd server
npm i
npm run dev
```
Sediakan `.env` mengikut `/.env.example` (contoh: `PORT`, `SESSION_SECRET`, `OAUTH_*`). Guna PostgreSQL (rujuk `server/lib/db.js` & `server/db/*.sql`).

---

## 3) Peta Navigasi (Page Flow)

```
Menu (/public/menu.html)
  ├─ Add to Cart → Cart (/public/cart.html)
  ├─ View Item → (popup info/produk)
  ├─ Toggle Delivery/Pickup →
  │     • Delivery: /public/delivery/index.html → confirm.html
  │     • Pickup:   /public/pickup/index.html
  └─ Rewards → /public/rewards.html

Cart (/public/cart.html)
  └─ Checkout → /public/checkout.html

Checkout (/public/checkout.html)
  ├─ Pilih kaedah bayaran → PaymentModal (receipt/invoice)
  └─ Submit order → Orders (/public/orders.html)

Orders (/public/orders.html)
  └─ Lihat order detail / resit (popup)

Akaun (/public/account.html) • Laporan (/public/reports.html)
```

Untuk **modals/popup**, gunakan komponen di `src/components/modals/` atau halaman kecil dalam `public/popups/`.

---

## 4) Konvensyen Kod & UI

- **HTML + Vanilla JS**: Komponen kecil (modals/toast) dipanggil melalui `data-*` attribute + listener di `src/main.js`/`app.js`.
- **Tailwind**: Sumber di `src/input.css` (import base/components/utilities). Hasil ke `public/assets/tailwind.css`.
- **Order Steps**: Guna komponen `OrderSteps` (kelas utiliti: `.is-active`, `.is-done`).
- **Notifikasi/Offline**: `NotifyBell`, `OfflineBanner`, & `sw-register(.min).js`.
- **PWA**: `public/manifest.webmanifest`, `public/sw.js`, `public/offline.html`. Tukar **cache version** bila deploy baru.

---

## 5) Keselamatan (Jika guna API)

- **Login Brute Force**: `lockout` + `ratelimit` middleware.
- **CSRF**: aktif untuk route sensitif (bukan login).
- **2FA**: `require2fa` untuk tindakan berisiko (restore, keys).
- **RBAC**: gunakan `rbac.sql` dan middleware `perm` untuk role‑gated UI.
- **Secrets**: simpan di env/kv, bukan di repo.

---

## 6) Petua Debug Pantas

- **CSS tak apply**: Pastikan link ke `public/assets/tailwind.css` (atau `tailwind.min.css`), tidak ke fail sementara. Jalankan `npm run watch:css`/`dev`.
- **Cache SW lama**: Hard refresh (Ctrl+F5). Naikkan `CACHE_VERSION` dalam `sw.js`.
- **Font/ikon tak keluar**: Semak path relatif bila `serve:dist` (kadang perlu `base`).
- **Modals tak buka**: Semak selector `data-modal-target` dan listener didaftarkan selepas DOM ready.
- **CORS API**: Semak `server/index.js` (helmet + cors) dan `Origin` semasa dev.

---

## 7) Checklist Sebelum Deploy

- [ ] `.env` diisi (PORT, SESSION_SECRET, OAUTH_*, DB_URL, REDIS_URL jika ada).
- [ ] `npm run build` + `npm run build:prod` selesai tanpa error.
- [ ] `sw.js` versi dikemas kini; `offline.html` boleh dilihat tanpa rangkaian.
- [ ] Gambar diproses oleh `images-pipeline.mjs` (saiz/format dioptimumkan).
- [ ] Ujian aliran: Menu → Cart → Checkout → Orders → Resit.
- [ ] Semak Lighthouse (PWA, Performance, Accessibility).

---

## 8) Lesen & Sumbangan
Masukkan teks lesen anda di sini (MIT/Proprietary). PR/isu: ikut panduan dalaman projek.

---

**Disediakan untuk projek anda (appmat).** Jika anda mahu versi **BM penuh** atau mahu saya tambah **gaya jenama** (warna/typography), beritahu dan saya akan kemas kini dokumen ini.

Generated README • 2025-10-12

## 1) Project Overview
This repo contains the source code for **appmat**. It is primarily built with **JavaScript**.

## 2) Tech Stack (Detected)
- Language: **JavaScript**
- Tooling/Frameworks: **—**
- Package Manager: **npm** (change if you use yarn/pnpm)
- Lint/Format: — / —
- Styling: —
- Testing: — / — / —
- Containerization: —
- Python markers: No

## 3) Getting Started
### Prerequisites
- Node.js 18+ recommended
- npm (or yarn/pnpm)

### Installation
```bash
# In the project root
npm install
```

### Development
```bash
npm run dev
```
> Refer to the **Scripts** section if your dev command differs.

### Build
```bash
npm run build
```

### Preview / Start
```bash
# For Vite
npm run preview

# Or for server apps
npm run start
```

## 4) Scripts
- (No npm scripts found)

## 5) Environment Variables
Create a `.env` file in the project root (and `.env.local` / `.env.production` as needed). Below are inferred examples—adjust to your needs:

```env
PATH=
```

> Never commit real secrets. Add `.env*` files to `.gitignore`.

## 6) Folder Structure
Top-level folders detected:
- `/appmat/`

_No conventional roots found (src/app/api/public etc.)._

For detailed explanations, see **appmat_structure_with_notes.md**.

## 7) Security & Quality Checklist
- [ ] Do **not** commit `.env` or secrets (rotate if leaked).
- [ ] Enable **CSRF** for sensitive actions (if server-rendered forms).
- [ ] Use **HTTPS** everywhere in production.
- [ ] Set secure cookies: `SameSite=Lax|Strict`, `HttpOnly`, `Secure`.
- [ ] Add **rate limiting** / **login lockout** for auth routes.
- [ ] **CSP** headers for mitigation of XSS (and sanitize any HTML input).
- [ ] Run **lint** & **tests** in CI; block merges on failures.
- [ ] Keep dependencies updated (e.g., `npm audit`, `pnpm audit`).

## 8) Deployment (General)
- Build: `npm run build`
- Static hosting: deploy `dist/` or `.next/` as per framework
- Server: run `npm run start` behind a reverse proxy (Nginx), with env vars set
- Docker (if present): build image with `docker build -t appmat:latest .`

## 9) Troubleshooting
- Port already in use → kill existing process or change dev port in config.
- Tailwind classes not applying → ensure content globs in `tailwind.config.*` include all source paths.
- Import errors → check tsconfig `paths` and Vite/Next alias config.
- Blank page on build → verify SPA base path and asset URLs.
- ESM/CJS issues → align `"type"` in `package.json` and imports.

## 10) License
Check `LICENSE` file if present; otherwise, add an appropriate license (MIT/Apache-2.0/etc.).

# Drift Guard Patch Kit

...existing code...

# Audit Log Add-on for appmat_api

This adds:
- `middleware/audit.js` — capture request metadata into an in-memory store
- `routes/audit.js` — list & summarize audit entries with filters and cursor pagination
- `public/audit.html` — viewer UI with filters, CSV export, "load more"

## Install

Copy files into your API project and wire them:

```js
// index.js
import { audit } from './middleware/audit.js';
import auditRoutes from './routes/audit.js';

// Attach audit around sensitive routes (before handlers)
app.use('/api/settings', audit('settings:update'), csrf(), settingsRoutes);
app.use('/api/backups',  audit(req => req.method + ' ' + req.path), csrf(), backupsRoutes);
app.use('/api/metrics',  audit('metrics:read'), metricsRoutes);

// Reader endpoints (protected)
app.use('/api/audit', auditRoutes);
```

Ensure your permission policy includes `audit:read` for roles that should access the viewer.

## Notes
- In production, persist `AUDIT_STORE.rows` to a durable target (DB or append-only logs).
- Consider adding request body redaction for secrets and large payloads.
- Add retention & PII policies (e.g., IP hashing, UA truncation) as needed.
# appmat-api (Express skeleton)

## Run
```bash
cd appmat_api
cp .env.example .env
npm install
npm start
```
Server: http://localhost:3000

## Endpoints (selected)
- `GET /api/csrf` → set CSRF cookie `{ token }`
- `POST /api/auth/login` → `{ email, password }` → cookie session + JWT
- `GET /api/auth/me` → current user
- `GET /api/settings` (settings:read)
- `POST /api/settings` (settings:write) — requires `X-CSRF-Token` header
- `POST /api/settings/restore` (settings:write)
- `GET /api/backups` (backups:read)
- `POST /api/backups/run { type }` (backups:write)
- `POST /api/backups/restore { id }` (backups:write)
- `DELETE /api/backups/:id` (backups:write)
- `GET /api/metrics/overview` (metrics:read), `/timeseries`, `/endpoints`

## Permissions
Policy is read from `matrix.json`. The evaluator is in `lib/perm.js` and used by the `requirePerm()` middleware.

## Notes
- This is a minimal demo using in-memory stores. Replace with DB persistence (e.g., Postgres).
- For SSO, fill Google/Microsoft client IDs in `.env` and serve your app over HTTPS in production.

# Drift Guard Patch Kit

This kit contains drop-in snippets to add **Drift Guard** to your app:
- Server (Express): helper + status endpoint and promotion enforcement.
- UI (Synthetic Tests page): badge + optional override + error surfacing.

## What Drift Guard enforces
- Fresh run within `DRIFT_GUARD_WINDOW_MIN` minutes.
- Green quality (<= `DRIFT_GUARD_MAX_FAILS` failures; 0 by default).
- Optional admin override if `DRIFT_GUARD_ALLOW_OVERRIDE=true`.

## 1) Env
Append to your server `.env` / `.env.example`:
```
DRIFT_GUARD_ENABLED=true
DRIFT_GUARD_WINDOW_MIN=240
DRIFT_GUARD_REQUIRE_GREEN=true
DRIFT_GUARD_MAX_FAILS=0
DRIFT_GUARD_ALLOW_OVERRIDE=false
```

## 2) Server (Express)
Add this near your other helpers (requires `fs`, `path`, `PUBLIC_DIR`, `authLimiter`, `requireAuth`, `requireAdmin` in scope):
````markdown
// driftGuard.ts
import fs from 'fs';
import path from 'path';
import { PUBLIC_DIR } from './config';
import { authLimiter, requireAuth, requireAdmin } from './middleware';

const driftGuardWindowMin = parseInt(process.env.DRIFT_GUARD_WINDOW_MIN || '240', 10);
const driftGuardMaxFails = parseInt(process.env.DRIFT_GUARD_MAX_FAILS || '0', 10);
const driftGuardEnabled = process.env.DRIFT_GUARD_ENABLED === 'true';
const driftGuardAllowOverride = process.env.DRIFT_GUARD_ALLOW_OVERRIDE === 'true';

export function initDriftGuard(app) {
  if (!driftGuardEnabled) return;

  // 1. Status endpoint
  app.get('/_drift_guard/status', (req, res) => {
    // Check session or auth state
    const isAuthenticated = req.isAuthenticated && req.isAuthenticated();
    const user = req.user || {};
    const lastRun = user.lastDriftGuardRun || 0;
    const failCount = user.driftGuardFailCount || 0;

    // 2. Freshness check
    const now = Date.now();
    const windowStart = now - driftGuardWindowMin * 60 * 1000;
    const isFresh = lastRun > windowStart;

    // 3. Green quality check
    const isGreen = failCount <= driftGuardMaxFails;

    // 4. Admin override check
    const isAdmin = req.user && req.user.isAdmin;
    const isOverridden = driftGuardAllowOverride && isAdmin;

    if (isFresh && (isGreen || isOverridden)) {
      return res.json({ ok: true, isFresh, isGreen, isOverridden });
    }

    // 5. Fail response
    res.status(403).json({
      ok: false,
      error: 'Drift Guard checks failed',
      isFresh,
      isGreen,
      isOverridden,
      lastRun,
      failCount,
    });
  });

  // 6. Helper to update last run
  app.use((req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
      req.user.lastDriftGuardRun = Date.now();
      // Optionally reset fail count on successful auth
      // req.user.driftGuardFailCount = 0;
    }
    next();
  });
}

// In your main app file
import { initDriftGuard } from './driftGuard';
initDriftGuard(app);
````

## 3) UI (Synthetic Tests page)
Add this to your Synthetic Tests page (requires `driftGuardStatus` in scope):
````markdown
// Synthetic Tests page
import { useEffect, useState } from 'react';
import axios from 'axios';

export function SyntheticTestBadge() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    async function checkDriftGuard() {
      try {
        const res = await axios.get('/_drift_guard/status');
        setStatus(res.data);
      } catch (err) {
        setStatus({ ok: false, error: err.message });
      }
    }

    checkDriftGuard();
  }, []);

  if (status === null) return <span>Loading...</span>;
  if (status.ok) return <span className="badge green">Drift Guard OK</span>;
  return (
    <span className="badge red">
      Drift Guard Failed: {status.error}
      {/* Optional override button for admins */}
      {status.isOverridden ? null : <OverrideButton />}
    </span>
  );
}

// Override button component
function OverrideButton() {
  const [overridden, setOverridden] = useState(false);

  const handleOverride = async () => {
    // Call your override endpoint
    const res = await axios.post('/api/drift_guard/override');
    setOverridden(res.data.ok);
  };

  return (
    <button onClick={handleOverride} className="override-button">
      {overridden ? 'Overridden' : 'Override Drift Guard'}
    </button>
  );
}
````

# SSO Integration Guide (Google & Microsoft)

This guide pairs with **login.html** and **sso-admin.html**.

## 1) OAuth 2.0 / OIDC Flow (Server-Centric)
1. Start `/api/auth/:provider/start` → set `state`, `nonce`, PKCE; redirect to provider.
2. Callback `/api/auth/:provider/callback?code&state` → verify tokens & claims.
3. Domain allowlist + role mapping.
4. JIT provisioning (optional).
5. Create session cookie or short-lived JWT.

## 2) Example Endpoints
- `GET /api/auth/google/start`
- `GET /api/auth/google/callback`
- `GET /api/auth/microsoft/start`
- `GET /api/auth/microsoft/callback`

## 3) Env Config
```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
MS_CLIENT_ID=
MS_CLIENT_SECRET=
OAUTH_REDIRECT_BASE=https://your-app.example.com
SESSION_SECRET=
```

## 4) Security
- Use PKCE + nonce; validate `state`.
- Verify ID token (iss, aud, exp, nonce).
- Enforce domain allowlist; lock by provider `sub`.
- If `ssoOnly`, disable password routes.

## 5) Node/Express Pseudocode
```ts
// npm i openid-client express cookie-session
import express from 'express';
import { Issuer, generators } from 'openid-client';
const app = express();
const redirectBase = process.env.OAUTH_REDIRECT_BASE;
const googleIssuer = await Issuer.discover('https://accounts.google.com');
const client = new googleIssuer.Client({
  client_id: process.env.GOOGLE_CLIENT_ID!,
  client_secret: process.env.GOOGLE_CLIENT_SECRET!,
  redirect_uris: [redirectBase + '/api/auth/google/callback'],
  response_types: ['code'],
});
app.get('/api/auth/google/start', (req,res)=>{
  const state = generators.state();
  const nonce = generators.nonce();
  const code_verifier = generators.codeVerifier();
  const code_challenge = generators.codeChallenge(code_verifier);
  // store state/nonce/code_verifier in session
  const url = client.authorizationUrl({ scope:'openid email profile', state, nonce, code_challenge, code_challenge_method:'S256' });
  res.redirect(url);
});
app.get('/api/auth/google/callback', async (req,res)=>{
  const { state, code } = req.query;
  // verify state, then exchange code
  const tokenSet = await client.callback(redirectBase + '/api/auth/google/callback', { code, state }, { /*nonce, code_verifier*/ });
  const claims = tokenSet.claims(); // email, sub, name
  // map role + set session
  res.redirect('/');
});
```

## 6) Front-End Wiring
- Buttons in **login.html** link to start endpoints.
- After callback, server sets session and redirects.
- App calls `/api/me` to hydrate `user` with role.

# 2FA (TOTP) Add-on for appmat-api

This add-on adds TOTP-based 2FA with QR codes and backup codes.

## Install

In your API project (appmat_api):

```bash
npm i speakeasy qrcode
```

Copy files:

- `routes/2fa.js` → `appmat_api/routes/2fa.js`
- `middleware/require2fa.js` → `appmat_api/middleware/require2fa.js`
- `public/2fa_setup.html` and `public/2fa_verify.html` → serve with your static hosting (or copy to your app)

Then wire them in `index.js`:

```js
import twofaRoutes from './routes/2fa.js';
// after sessionUser():
app.use('/api/2fa', twofaRoutes);
```

Optionally enforce 2FA for sensitive routes:

```js
import { require2FA } from './middleware/require2fa.js';
app.use('/api/settings', require2FA(), csrf(), settingsRoutes);
app.use('/api/backups', require2FA(), csrf(), backupsRoutes);
```

## Front-end

- **Setup**: open `/2fa_setup.html` while signed-in → Generate → Scan QR → Verify → backup codes shown.
- **Verify at login**: if your login step detects 2FA enabled, redirect user to `/2fa_verify.html` and set `localStorage.setItem('pending2fa.userId', userId)` (demo). In production, tie it to server session instead.

## Notes

- This demo stores secrets in-memory. Replace with DB persistence (hash backup codes with bcrypt).
- To prevent replay, mark session `passed2fa=true` after success and clear on logout.
- Consider "remember device" (signed cookie for 30 days) and lockout on repeated failures.


# Security Add-on: Rate Limiting + Account Lockouts

This add-on provides:
- **Rate Limiter** middleware (`middleware/rateLimit.js`) — sliding-window, per-key (e.g., IP or route-specific keys)
- **Account Lockout** helper (`middleware/lockout.js`) — exponential backoff after repeated login failures (per email + per IP)
- **Admin routes** (`routes/security.js`) — view counters, unlock, update config; includes a `/login-demo` endpoint
- **Admin UI** (`public/security.html`) — tweak thresholds, view buckets and lockouts, try login demo

## Wire it into your Express app

```js
// index.js
import securityRoutes from './routes/security.js';
app.use('/api/security', securityRoutes);
```

To protect an actual login route, compose the guards:

```js
import { rateLimit } from './middleware/rateLimit.js';
import { checkLocked, recordSuccess, recordFailure } from './middleware/lockout.js';

app.post('/api/auth/login',
  rateLimit({ windowMs: 60_000, max: 20, key: req => 'login:'+req.ip }),
  checkLocked,
  async (req, res) => {
    const { email, password } = req.body;
    const ok = await verifyPassword(email, password); // your real check
    if (!ok){ recordFailure(req); return res.status(401).json({ error:'invalid_credentials' }); }
    recordSuccess(req);
    // issue session...
    res.json({ ok:true });
  }
);
```

## Production notes
- Replace in-memory maps with **Redis**. For example, rate limit via `INCR` with 60s TTL; lockouts via counters and per-user key TTLs.
- Log/alert on mass lockouts; add CAPTCHA after N failures; block disposable email domains.
- Normalize IPs behind proxies (`app.set('trust proxy', 1)`) and prefer `req.ip` with proxy trust enabled.

# Backups Add-on: Scheduler + Signed Downloads

This add-on enhances backups with:
- **Scheduled snapshots** (simple in-process timers, interval in minutes)
- **Signed download links** (HMAC, short-lived)
- **Admin UI** to run backups, manage schedules, and get download links

## Files
- `lib/backupsStore.js` — in-memory storage + scheduler + HMAC signer
- `routes/backups_plus.js` — routes under `/api/backups2` (separate from your existing `/api/backups`)
- `public/backups_admin.html` — admin console UI

## Wire it (Express)

```js
// index.js
import backupsPlus from './routes/backups_plus.js';
app.use('/api/backups2', backupsPlus);
```

Environment:
- Uses `SESSION_SECRET` to sign URLs.
- Uses `OAUTH_REDIRECT_BASE` (or derives from request) to build absolute links.

## Notes
- For production, replace in-memory store with DB and background job runner (e.g., BullMQ/Redis, cron).
- `/api/backups2/download/:id` validates `exp` + `sig` and streams a **dummy** payload. Hook it to your real object storage.
- Consider encrypting backups and adding per-tenant access controls.

# Feature Flags Add-on

Adds deterministic percentage rollouts, attribute targeting, and an admin UI.

## Files
- `lib/flagEval.js` — evaluator (`evalFlag`, `evalAll`, `hashToPct`)
- `routes/flags.js` — REST under `/api/flags`
- `public/feature_flags.html` — management UI

## Wire (Express)
```js
import flagRoutes from './routes/flags.js';
app.use('/api/flags', flagRoutes);
```

# Feature Flag Server-side Check Example

To evaluate a feature flag for a user on the server:

```js
import { evalFlag } from './lib/flagEval.js';
const env = process.env.NODE_ENV === 'production' ? 'prod' : 'staging';
const on = evalFlag({ flags }, 'new_dashboard', env, { id: user.id, email: user.email, plan: user.plan }).on;
if (on) enableNewUI();
```

- `flags`: The flag definitions (from DB, config, or API)
- `'new_dashboard'`: The flag key to evaluate
- `env`: The environment string (e.g., 'prod', 'staging')
- User context: `{ id, email, plan }` or any relevant user info
- Returns: `{ on: true|false, ... }` — use `.on` to check if enabled

# Notifications & Webhooks Add-on

Send events to Webhooks (HMAC signed), Slack, and Email (SMTP). Includes admin UI.

## Files
- `lib/notifier.js` — webhooks/Slack/email senders, HMAC signature header `x-signature: sha256=...`; retry with backoff.
- `routes/notify.js` — under `/api/notify`:
  - `GET /subs`, `POST /subs/webhook|slack|email`, `DELETE /subs/:kind/:id`
  - `POST /smtp` to set SMTP
  - `POST /test` to publish a test event
- `public/notifications.html` — admin UI

## Wire it (Express)
```js
import notifyRoutes from './routes/notify.js';
app.use('/api/notify', notifyRoutes);
```

## Emit events
```js
import { publish } from './lib/notifier.js';
await publish('backup.completed', { id, createdAt });
await publish('security.lockout', { email, ip });
await publish('audit.entry', { action, actor, time });
```
# Postgres Persistence Add-on

**Schema + DB-backed routes** for Flags, Audit, Backups, and Notifications.

## Files
- `db/schema.sql`
- `lib/db.js`, `scripts/migrate.js`
- `lib/flags_pg.js`, `routes/flags_pg.js`
- `lib/audit_pg.js`, `routes/audit_pg.js`
- `lib/backups_pg.js`, `routes/backups_pg.js`
- `lib/notify_pg.js`, `routes/notify_pg.js`

## Setup
1) `export DATABASE_URL=postgres://user:pass@host:5432/appmat`
2) `npm i pg`
3) `node scripts/migrate.js`
4) Wire routes:
```js
import flagsPg from './routes/flags_pg.js';
import auditPg from './routes/audit_pg.js';
import backupsPg from './routes/backups_pg.js';
import notifyPg from './routes/notify_pg.js';
app.use('/api/flags', flagsPg);
app.use('/api/audit', auditPg);
app.use('/api/backups2', backupsPg);
app.use('/api/notify', notifyPg);
```

Notes:
- Publishing in `lib/notifier.js` still reads in-memory subs; load from DB if you want fully DB-driven publishing.
- Add RLS/tenancy & encryption if multitenant.

# SSO (OIDC) Add-on

Single Sign-On via OpenID Connect (Okta, Auth0, Azure AD, Google, Keycloak).

## Files
- `routes/sso_oidc.js` — `/api/sso/login|callback|refresh|logout|me`
- `lib/session.js` — helpers for `express-session`
- `public/login.html` — basic login page

## Install
```bash
npm i openid-client express-session
```
Ensure `express-session` is configured in your app.

## Env
```
OIDC_ISSUER_URL=...
OIDC_CLIENT_ID=...
OIDC_CLIENT_SECRET=...
OIDC_REDIRECT_URI=https://yourapp.example.com/api/sso/callback
OIDC_SCOPES=openid profile email offline_access
OIDC_ROLE_CLAIM=roles
OIDC_NAME_CLAIM=name
OIDC_EMAIL_CLAIM=email
```

## Wire
```js
import sso from './routes/sso_oidc.js';
app.use('/api/sso', sso);
```
# RBAC Add-on (Postgres-backed)

Role-Based Access Control with **roles**, **permissions**, and **user assignments**, plus a drop-in `requirePerm` middleware and an admin UI.

## Files
- `db/rbac.sql` — tables: `permissions`, `roles`, `role_permissions`, `user_roles`
- `lib/rbac_pg.js` — helpers to seed and manage RBAC, and compute user permissions
- `middleware/perm.js` — `requirePerm(perm)` Express middleware
- `routes/rbac.js` — RBAC admin API under `/api/rbac`
- `public/rbac_admin.html` — simple UI to manage permissions, roles, and assignments
- `scripts/seed_roles.js` — seeds defaults (admin/ops/auditor/staff)

## Setup

1) Apply schema (run alongside your existing schema):
```bash
psql "$DATABASE_URL" -f db/rbac.sql
```

2) Wire middleware & routes:
```js
// Use this perm middleware app-wide (replaces your previous stub if any)
import { requirePerm } from './middleware/perm.js';

// Admin API
import rbacRoutes from './routes/rbac.js';
app.use('/api/rbac', rbacRoutes);

// Example protection:
app.get('/api/audit/summary', requirePerm('audit:read'), handler);
app.post('/api/backups2/run', requirePerm('backups:write'), handler);
```

3) Seed defaults:
```bash
node scripts/seed_roles.js
```

4) Assign roles to users (by email or user id) using the UI at `public/rbac_admin.html` or via API:
```bash
curl -XPOST /api/rbac/assign -H "content-type: application/json"   -d '{"userKey":"alice@example.com","roleId":"admin"}'
```

## API

- `GET /api/rbac/all` — dump of perms, roles, role-perms, user-roles
- `POST /api/rbac/seed` — seed defaults
- `POST /api/rbac/perm { perm, note? }`, `DELETE /api/rbac/perm/:perm`
- `POST /api/rbac/role { id, name, note? }`, `DELETE /api/rbac/role/:id`
- `POST /api/rbac/grant { roleId, perm }`, `POST /api/rbac/revoke { roleId, perm }`
- `POST /api/rbac/assign { userKey, roleId }`, `POST /api/rbac/unassign { userKey, roleId }`

## Notes

- `user_key` is your canonical user identifier (commonly the user’s email lowercased). Adjust as needed.
- The middleware reads the current user from `req.session.user` (compatible with the SSO add-on).
- Extend the default permission set to match your modules (e.g., `flags:write`, `notify:write`).

# API Keys / Personal Access Tokens Add-on

Issue hashed **API keys** with **scopes** and **expirations**. Includes middleware to protect endpoints and a simple UI.

## Files
- `db/apikeys.sql` — table for keys
- `lib/apikeys_pg.js` — PG-backed helpers (`createKey`, `listKeys`, `findByToken`, `revokeKey`, `deleteKey`)
- `middleware/auth_api_key.js` — `authApiKey(requiredScopes)` Express middleware
- `routes/apikeys.js` — endpoints under `/api/apikeys`
- `public/api_keys.html` — self-service page for users to create/revoke their keys

## Wire it (Express)
```js
import apiKeysRoutes from './routes/apikeys.js';
import { authApiKey } from './middleware/auth_api_key.js';

app.use('/api/apikeys', apiKeysRoutes);

// Example: protect a public API route (machine-to-machine)
app.get('/api/public/metrics', authApiKey(['metrics:read']), (req,res)=>{
  res.json({ ok:true, who: req.apiKey.owner });
});
```

## Usage
- Create: `POST /api/apikeys/create { label, scopes[], expiresInDays? }` → returns `{ token }`
- List (admin): `GET /api/apikeys?owner=<email|userId|self>`
- Revoke: `POST /api/apikeys/:id/revoke`
- Delete: `DELETE /api/apikeys/:id`

## Security notes
- Full tokens are shown **only at creation time** and stored as SHA-256 hash.
- Tokens are formatted `ak_<id>_<secret>`; the `<id>` is used as a lookup hint.
- Prefer TLS, strict CORS, and per-route minimal scopes.
- Consider adding rate limits and audit entries for key usage.

# Rate Limiting & Quotas Add-on (Redis)

Redis-backed **sliding window** rate limiter and **daily/monthly quotas** with an admin UI and Express middleware.

## Files
- `lib/redis.js` — `ioredis` client
- `lib/ratelimit.js` — policy store + sliding window (ZSET) + quotas (INCR)
- `middleware/ratelimit.js` — Express middleware `rateLimit()`
- `routes/ratelimit.js` — admin API under `/api/rl`
- `public/ratelimit.html` — UI to edit policy & peek usage

## Install
```bash
npm i ioredis
export REDIS_URL=redis://127.0.0.1:6379/0
```

## Wire it (Express)
```js
import { rateLimit } from './middleware/ratelimit.js';
import rlRoutes from './routes/ratelimit.js';

// Put rateLimit middleware *before* your API routes:
app.use(rateLimit());

// Admin endpoints
app.use('/api/rl', rlRoutes);
```

## Configure policy
Open `public/ratelimit.html` or call API:
```jsonc
{
  "routes": [
    { "name":"public-metrics", "match": "^/api/public/metrics", "limit": 120, "windowSec": 60, "by": "key", "quotaScope":"key", "cost": 1 },
    { "name":"audit-read", "match": "^/api/audit", "limit": 60, "windowSec": 60, "by": "user" }
  ],
  "quotas": [
    { "scope": "key", "period": "day", "limit": 10000 },
    { "scope": "key", "period": "month", "limit": 300000 }
  ]
}
```

## Response headers on throttle
- `x-ratelimit-limit`
- `x-ratelimit-remaining`
- `retry-after` (seconds)

## Notes
- Policies are in-memory in this add-on. For production, load/save from Postgres or config management.
- Sliding window precision depends on Redis clock; uses ZSET timestamps in ms.
- If Redis is down, middleware allows traffic but sets `x-ratelimit-error: 1` header.
- Combine with API Keys add-on for `by:"key"` mode (reads `req.apiKey`). Otherwise uses `user` or `ip`.

# Rate Limiting & Quotas Add-on (Redis)

Redis-backed **sliding window** rate limiter and **daily/monthly quotas** with an admin UI and Express middleware.

## Files
- `lib/redis.js` — `ioredis` client
- `lib/ratelimit.js` — policy store + sliding window (ZSET) + quotas (INCR)
- `middleware/ratelimit.js` — Express middleware `rateLimit()`
- `routes/ratelimit.js` — admin API under `/api/rl`
- `public/ratelimit.html` — UI to edit policy & peek usage

## Install
```bash
npm i ioredis
export REDIS_URL=redis://127.0.0.1:6379/0
```

## Wire it (Express)
```js
import { rateLimit } from './middleware/ratelimit.js';
import rlRoutes from './routes/ratelimit.js';

// Put rateLimit middleware *before* your API routes:
app.use(rateLimit());

// Admin endpoints
app.use('/api/rl', rlRoutes);
```

## Configure policy
Open `public/ratelimit.html` or call API:
```jsonc
{
  "routes": [
    { "name":"public-metrics", "match": "^/api/public/metrics", "limit": 120, "windowSec": 60, "by": "key", "quotaScope":"key", "cost": 1 },
    { "name":"audit-read", "match": "^/api/audit", "limit": 60, "windowSec": 60, "by": "user" }
  ],
  "quotas": [
    { "scope": "key", "period": "day", "limit": 10000 },
    { "scope": "key", "period": "month", "limit": 300000 }
  ]
}
```

## Response headers on throttle
- `x-ratelimit-limit`
- `x-ratelimit-remaining`
- `retry-after` (seconds)

## Notes
- Policies are in-memory in this add-on. For production, load/save from Postgres or config management.
- Sliding window precision depends on Redis clock; uses ZSET timestamps in ms.
- If Redis is down, middleware allows traffic but sets `x-ratelimit-error: 1` header.
- Combine with API Keys add-on for `by:"key"` mode (reads `req.apiKey`). Otherwise uses `user` or `ip`.

# Audit Explorer UI + CSV Export Add-on

Feature-rich **Audit UI** (filters, infinite scroll, timeline) and **CSV export** route.

## Files
- `public/audit.html` — filterable explorer: search, actor, action, IP, from/to; summary cards; mini timeline; table with copy-on-click; CSV export button.
- `routes/audit_export.js` — `GET /api/audit/export.csv` (requires `audit:read`), streams up to 5k rows as CSV.

## Wire it (Express)
```js
import auditExport from './routes/audit_export.js';
app.use('/api/audit', auditExport); // alongside your existing audit routes
```

The UI expects the **Postgres-backed audit routes** from the PG add-on:
- `GET /api/audit` (with query params `q, actor, action, ip, from, to, limit, cursor`) — returns `{ rows, nextCursor }`
- `GET /api/audit/summary` — returns overall counts/breakdowns

## Usage
- Open `public/audit.html` while authenticated.
- Apply filters, scroll/load more, click a chip to filter by action, copy any cell by clicking, and export CSV with current filters.

## Notes
- The canvas timeline is a lightweight custom chart (no extra libs).
- CSV includes `meta` as JSON string.
- For very large exports, prefer a background job that writes to object storage and emails a link.

# Backups Storage Adapter (S3/GCS/FS) + Integrity + Signed URLs

Add storage for your backups with **S3 / GCS / local FS** drivers, **SHA-256 integrity**, presigned **download URLs**, and a simple upload UI.

## Files
- `lib/storage.js` — Driver selector by env (`STORAGE_DRIVER=s3|gcs|fs`), helpers: `putObject`, `headObject`, `removeObject`, `signedUrl`, `sha256`.
- `lib/backups_update.js` — `updateBackupInfo(id, { sizeBytes, checksum })` to update existing `backups` row.
- `routes/backups_storage.js` — `/api/storage/backups/*`:
  - `POST /upload` (multipart `file`) → stores blob under key `backups/<id>`, records size + sha256
  - `GET /:id/url?expires=3600` → returns signed download URL
  - `GET /:id/head` → existence / metadata
  - `DELETE /:id/blob` → removes object (keeps DB row)
- `public/backups_storage.html` — upload + manage blobs UI

## Prereqs
This piggybacks on the **Backups (PG)** add-on for DB rows:
```js
import backupsPg from './routes/backups_pg.js';
app.use('/api/backups', backupsPg);
```

## Wire it (Express)
```js
import storageRoutes from './routes/backups_storage.js';
app.use('/api/storage/backups', storageRoutes);
```

## Env
```
# Choose a driver
STORAGE_DRIVER=s3            # s3 | gcs | fs (default fs)
STORAGE_BUCKET=my-bucket     # required for s3/gcs
STORAGE_PREFIX=backups/      # object key prefix (default: backups/)
STORAGE_LOCAL_DIR=./data_backups   # for fs driver

# S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# GCS
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

## Install deps
```bash
# Choose SDKs you need
npm i multer
npm i @aws-sdk/client-s3 @aws-sdk/s3-request-presigner   # if using S3
npm i @google-cloud/storage                               # if using GCS
```

## Notes
- Object key is derived from the backup `id`: `backups/<id>`.
- Checksums are SHA-256 of the uploaded buffer and saved to `backups.checksum`.
- For FS driver, files are written under `${STORAGE_LOCAL_DIR}/backups/<id>`; serve them via your own static route if needed.
- To delete a row entirely, use your existing `/api/backups/:id` endpoint after deleting the blob.

# Secrets Manager + .env Editor (Envelope Encryption, AES-GCM)

Manage application secrets with **envelope encryption** (AES-256-GCM) and a simple **.env-style key/value** editor (non-sensitive).

## Files
- `db/secrets.sql` — tables: `app_secrets` (encrypted), `app_kv` (plain config).
- `lib/crypto_env.js` — envelope crypto helpers (`SECRET_MASTER_KEY` 32B base64).
- `lib/secrets_pg.js` — PG helpers: list/upsert/reveal/delete + KV set/list/delete.
- `routes/secrets.js` — `/api/secrets` CRUD (RBAC: `secrets:read`/`secrets:write`) and `/api/secrets/kv/*` for config.
- `public/secrets.html` — UI to manage secrets and app config.

## Wire (Express)
```js
import secretsRoutes from './routes/secrets.js';
app.use('/api/secrets', secretsRoutes);
```

## RBAC
Add permissions:
- `secrets:read`
- `secrets:write`

## Env
```
SECRET_MASTER_KEY=BASE64_32_BYTES
```
Generate:
```js
console.log(require('crypto').randomBytes(32).toString('base64'));
```

## Security
- Plaintext is only returned on explicit `POST /api/secrets/:name/reveal` with `{"confirm": true}` and `secrets:write`.
- Master key is never stored in DB. For KMS, adapt `wrapDataKey/unwrapDataKey` to call your provider and store ciphertext.

# Webhook Verification + Replay Queue Add-on

Receive, verify, and store incoming webhooks (Stripe/GitHub/Slack/Generic HMAC). Queue **replayable deliveries** to any target URL with retries and exponential backoff. Includes an admin UI.

## Files
- `db/webhooks.sql` — tables: `webhooks_in`, `webhook_deliveries`
- `routes/webhooks_in.js` — inbound endpoints under `/api/webhooks/in/*` (uses **raw body** for signature verification)
- `routes/webhook_admin.js` — list inbound events, create deliveries, list deliveries, and `POST /process_once` to process one due job
- `lib/verify.js` — signature checks for Stripe, GitHub, Slack, and generic HMAC-SHA256
- `lib/queue.js` — claims due jobs via `FOR UPDATE SKIP LOCKED`, delivers, and schedules retries
- `lib/deliver.js` — minimal HTTP POST helper
- `public/webhooks.html` — admin UI

## Wiring (Express)

**Important:** Use `express.raw({type:'*/*'})` parser **only** for these inbound routes to keep the exact body for signature verification.

```js
import express from 'express';
import webhooksIn from './routes/webhooks_in.js';
import webhooksAdmin from './routes/webhook_admin.js';

// Raw body only for /api/webhooks/in/*
app.use('/api/webhooks/in', express.raw({ type: '*/*' }), webhooksIn);

// JSON parser for the rest of your app
app.use(express.json());

// Admin / replay APIs
app.use('/api/webhooks', webhooksAdmin);
```

## Env
```
STRIPE_SIGNING_SECRET=whsec_xxx
GITHUB_WEBHOOK_SECRET=xxx
SLACK_SIGNING_SECRET=xxx
WEBHOOK_GENERIC_SECRET=xxx
```

## Processing
This add-on provides a cooperative job runner:
- Call `POST /api/webhooks/process_once` from a cron (e.g., every minute) to process one due job.
- Or run a worker script that calls `processOne()` in a loop (not included).

## UI
Open `public/webhooks.html` (requires RBAC: `audit:read` to view, `settings:write` to create deliveries/process).

## Notes
- Inbound rows store both `raw_body` (bytea) and `json_body` (best-effort parsed).
- Exponential backoff up to 10 attempts then status becomes `dead`.
- Add your own signing for outbound deliveries if needed (e.g., add HMAC headers in `deliver.js`).
```


>>>>>>> 201bf9d (ci(playwright): add CI Playwright config + debug workflow; add helper scripts for E2E debugging)
