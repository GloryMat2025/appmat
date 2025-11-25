# Smoke test for notify-new-order

This file describes how to run the local smoke test for the `notify-new-order` Supabase Edge Function.

What the script does

- Inserts a temporary `push_subscriptions` row using the REST API (requires a service role key).
- POSTs to the deployed `notify-new-order` function to trigger notification processing.
- Deletes the temporary row and prints the function response.

Files

- `supabase/scripts/notify_smoke.cjs` — Node script that runs the smoke test.

Requirements

- `node` installed (v16+ recommended)
- A Supabase project URL (SUPABASE_URL) and a service role key (SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY).

Running the test (cmd.exe)

```
set SUPABASE_URL=https://<your-project>.supabase.co
set SERVICE_ROLE_KEY=<your-service-role-key>
node supabase\\scripts\\notify_smoke.cjs
```

Running the test (PowerShell)

```
$env:SUPABASE_URL = 'https://<your-project>.supabase.co'
$env:SERVICE_ROLE_KEY = '<your-service-role-key>'
node .\\supabase\\scripts\\notify_smoke.cjs
```

Notes

- The script uses the REST API to insert and delete rows and therefore requires a service role key. Do not paste service role keys in public channels.
- Real push delivery requires FCM or VAPID keys to be set as project secrets in the Supabase dashboard; otherwise the function will run and may log delivery attempts but actual push delivery will be skipped or fail.

Setting Supabase project secrets

1. Go to the Supabase project dashboard: https://app.supabase.com
2. Select your project → Settings → API to find `SUPABASE_URL` and `anon`/`service_role` keys.
3. Add project secrets via Project Settings → Environment Variables (or Secret Manager) with the keys used by the function:
   - `FCM_SERVER_KEY` (optional, for FCM delivery)
   - `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` (optional, for WebPush)
   - `PUSH_RELAY_URL` (if you use a relay server)

Check function logs

- Use the Supabase Dashboard (Functions → select function → Logs) to inspect runtime logs and confirm behavior.

If you want me to run the smoke test from this environment, provide the service role key in a secure way or run the commands locally and paste the resulting output here.
