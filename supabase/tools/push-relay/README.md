# appmat push relay

Small, local push relay to deliver WebPush notifications using VAPID keys.

Files created:

- `index.js` — Express app exposing /api/notify and /vapidPublicKey.
- `package.json` — npm manifest with dependencies.

Quick start

1. Install dependencies:

```powershell
cd supabase\tools\push-relay
npm install
```

2. Generate VAPID keys (you can use the helper in the repo):

```powershell
# from repo root
npm install --no-save web-push
node supabase\scripts\generate_vapid.cjs
```

3. Run the relay (set keys in environment):

```powershell
set VAPID_PUBLIC_KEY=BLah...your_public_key
set VAPID_PRIVATE_KEY=...your_private_key
node supabase\tools\push-relay\index.js
```

4. Configure Supabase function to use the relay by setting secret `PUSH_RELAY_URL` to the relay public URL.

Notes

- If you run locally and want Supabase to reach it, expose it using a tunnel (ngrok, localtunnel). Example ngrok:
  - `ngrok http 4000` and then set `PUSH_RELAY_URL` to the generated forwarding URL + `/api/notify`.
- For production use, deploy this relay behind TLS and add authentication/allow-listing.

Auth (recommended)

- The relay supports a simple token auth. Set an environment variable `RELAY_TOKEN` when running the relay. Clients must then send that token in an `x-relay-token` header. If `RELAY_TOKEN` is not set, the relay accepts requests without auth (useful for local dev only).

Example (run with token):

```powershell
set RELAY_TOKEN=super-secret-token
set VAPID_PUBLIC_KEY=BLah...your_public_key
set VAPID_PRIVATE_KEY=...your_private_key
node index.js
```

When deploying and connecting from your Supabase Edge Function, set a secret `PUSH_RELAY_TOKEN` (or a name you prefer) and have the function send it on the `x-relay-token` header when calling the relay.

Example: set Supabase secret for the relay token:

```powershell
npx supabase secrets set --project-ref <your-project-ref> PUSH_RELAY_TOKEN="super-secret-token"
```

Then in your Edge Function, include the header when POSTing to the relay:

```js
fetch(PUSH_RELAY_URL, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-relay-token': process.env.PUSH_RELAY_TOKEN,
  },
  body: JSON.stringify({ subscription, payload }),
});
```

Security

- Do not expose the relay publicly without auth. Add a secret token header or other auth when moving to production.

Docker / local container

1. Copy `.env.example` to `.env` and fill keys.

Windows (cmd.exe):

```cmd
cd supabase\tools\push-relay
copy .env.example .env
REM Edit .env to add VAPID keys and a RELAY_TOKEN
```

PowerShell:

```powershell
Set-Location 'supabase\tools\push-relay'
Copy-Item .env.example .env
# Edit .env to add VAPID keys and a RELAY_TOKEN
```

2. Build and run with docker-compose (if Docker is installed):

Windows (cmd.exe):

```cmd
docker compose up --build -d
```

PowerShell:

```powershell
docker compose up --build -d
```

3. Confirm the service is healthy:

```cmd
curl http://localhost:4000/health
```

4. Test the relay locally with the included script (Node 18+):

Windows (cmd.exe):

```cmd
set RELAY_URL=http://localhost:4000/api/notify
set RELAY_TOKEN=super-secret-token
node test_notify.cjs
```

PowerShell:

```powershell
$env:RELAY_URL='http://localhost:4000/api/notify'
$env:RELAY_TOKEN='super-secret-token'
node test_notify.cjs
```

If you're exposing the service via ngrok, set `PUSH_RELAY_URL` in Supabase to the ngrok forwarding URL + `/api/notify`, and set the Supabase secret `PUSH_RELAY_TOKEN` to match `RELAY_TOKEN` in your relay container.

Troubleshooting

- "The term 'docker' is not recognized...": Docker Desktop is not installed or not in PATH. If you don't want to install Docker, run the relay directly with Node (see "Run locally without Docker" below).
- "The term '::' is not recognized...": `::` is a cmd/batch comment and causes errors in PowerShell. Use `REM` in cmd.exe or `#` in PowerShell. The examples above show correct usage per shell.

Run locally without Docker

If Docker isn't available, use Node directly (this is the simplest path and was used during initial testing):

cmd.exe:

```cmd
cd supabase\tools\push-relay
copy .env.example .env
set VAPID_PUBLIC_KEY=BLah...your_public_key
set VAPID_PRIVATE_KEY=your_private_key_here
set RELAY_TOKEN=super-secret-token
node index.js
```

PowerShell:

```powershell
Set-Location 'supabase\tools\push-relay'
Copy-Item .env.example .env
$env:VAPID_PUBLIC_KEY='BLah...your_public_key'
$env:VAPID_PRIVATE_KEY='your_private_key_here'
$env:RELAY_TOKEN='super-secret-token'
node index.js
```
