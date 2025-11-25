# Notifications pipeline — quick reference

This file documents the minimal steps, secrets and test helpers for the notifications
pipeline (Supabase Edge Function + optional Node relay).

Files of interest
- `supabase/functions/notify-new-order-fixed/index.js` — Deno Edge Function that
  fetches `public.push_subscriptions` and delivers notifications (FCM or delegates to
  a relay via `PUSH_RELAY_URL`).
- `supabase/scripts/integration_notify_test.cjs` — local helper to insert a test
  subscription (uses `supabase/.env.local` service role key), trigger the function,
  and delete the row. Use when you have a valid local service role key.

Required secrets / env
- `SUPABASE_URL` — project URL, e.g. `https://<proj>.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` (preferred) or `SERVICE_ROLE_KEY` — service role key
  for server-side PostgREST access. The Supabase CLI cannot set secrets that start
  with `SUPABASE_`, so `SERVICE_ROLE_KEY` is sometimes used for CLI set operations.
- `FCM_SERVER_KEY` — optional: legacy FCM server key for endpoints that use FCM.
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` — for server-side WebPush (relay).
- `PUSH_RELAY_URL` — optional: the external relay URL (e.g. `https://api.example.com`)
  that the Edge Function will POST to at `/api/notify` to perform WebPush sends.

How to run the integration locally (using local service key)
1. Ensure `supabase/.env.local` contains a valid service role key (no trailing
   inline comments after the key value). Example lines:

```
SUPABASE_URL=https://<proj>.supabase.co
SERVICE_ROLE_KEY=eyJ...                # or SUPABASE_SERVICE_ROLE_KEY=...
```

2. Run the integration script (it will insert -> invoke -> delete):

```cmd
node supabase\scripts\integration_notify_test.cjs
```

If you get a 401 "Invalid API key", the key in `.env.local` is stale or contains
trailing comment text — remove inline comments or paste the raw key and try again.

How to run the integration without a local key (runtime helpers)
1. The Edge Function temporarily includes runtime helpers that use the runtime's
   valid service key. Use the following query params to control them:
   - `?debug=insert_test` — inserts a test subscription and returns the representation.
   - `?debug=delete_by_endpoint&endpoint=<url>` — deletes subscriptions matching endpoint.

2. Example flow (we used this in CI-style tests):

```cmd
curl -X POST "https://<proj>.functions.supabase.co/notify-new-order-fixed?debug=insert_test"
# then trigger: curl -X POST "https://<proj>.functions.supabase.co/notify-new-order-fixed" -d "{ \"record\": { \"id\": 1, \"total\": 9.99 } }"
# cleanup: curl -X POST "https://<proj>.functions.supabase.co/notify-new-order-fixed?debug=delete_by_endpoint&endpoint=https://example.com/push/runtime-inserted-test"
```

Notes & recommendations
- Do not leave debug helpers in production for longer than needed. We add/remove
  them briefly during tests. If you want permanent test endpoints, secure them.
- Prefer delegating WebPush to a Node relay (`server/push.js`) — `web-push` in
  Node is mature and easier to maintain than bundling a Deno WebPush library.
- If you plan CI automation, prefer the runtime helper approach for CI runs and
  the local script for developer runs when a service role key is available.

If you'd like, I can:
- Remove the `integration_notify_test.cjs` file if you'd rather not keep it in
  the repo (I left it there for convenience).
- Add a README section in the repository root linking to this file.
