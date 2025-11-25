# VAPID keys and WebPush relay

This document explains how to generate VAPID keys for WebPush and wire a simple relay
to perform WebPush deliveries from the server side. The project includes a small
helper script `supabase/scripts/generate_vapid.cjs` that uses `web-push` to generate
keys.

1. Generate VAPID keys (local)

- Install `web-push`:

  npm install web-push --save-dev

- Run the helper:

  node supabase/scripts/generate_vapid.cjs

- The script prints JSON with `publicKey` and `privateKey`.

2. Set secrets in Supabase (example)

Use the Supabase CLI (or Dashboard) to set the secrets. The CLI cannot set names
that start with `SUPABASE_` so set `SERVICE_ROLE_KEY` instead. Example:

    npx supabase secrets set --project-ref <your-project-ref> SERVICE_ROLE_KEY="..." ADMIN_TEST_TOKEN="..." VAPID_PUBLIC_KEY="<public>" VAPID_PRIVATE_KEY="<private>"

3. Delivery approaches

- FCM legacy: set `FCM_SERVER_KEY` and the function will POST to FCM when it sees an `fcm` endpoint.
- WebPush relay (recommended): run a small relay service (Node/Express) that accepts subscription objects and calls `web-push` to deliver. Then set `PUSH_RELAY_URL` to the relay's `/api/notify` endpoint. The Edge Function will POST to the relay with the subscription and record data.

4. Relay example (Node)

```js
// express + web-push relay (example)
const express = require('express');
const webpush = require('web-push');
webpush.setVapidDetails(
  'mailto:you@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);
const app = express();
app.use(express.json());
app.post('/api/notify', async (req, res) => {
  const { subscription, record } = req.body;
  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({ title: 'New order', body: `Order total ${record?.total}` })
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});
app.listen(3000, () => console.log('Relay listening on :3000'));
```

5. After setting keys and/or relay URL, re-run the smoke test to verify deliveries.
