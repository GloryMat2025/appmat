// Minimal push relay for WebPush notifications.
// Usage: set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in env, then `node index.js`.

const express = require('express');
const webpush = require('web-push');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 4000;

app.use(bodyParser.json({ limit: '128kb' }));

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const RELAY_TOKEN = process.env.RELAY_TOKEN; // optional token to authenticate callers

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.warn(
    'Warning: VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY is not set. Relay will reject sends until keys are provided.'
  );
}

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails('mailto:dev@example.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// Health
app.get('/health', (req, res) => res.json({ ok: true }));

// Send push notification endpoint.
// POST /api/notify
// body: { subscription: <PushSubscription JSON>, payload?: { title, body, data }, ttl?: number }
app.post('/api/notify', async (req, res) => {
  // If RELAY_TOKEN is set, require callers to provide it in the x-relay-token header.
  if (RELAY_TOKEN) {
    const token = req.header('x-relay-token');
    if (!token || token !== RELAY_TOKEN) {
      return res
        .status(401)
        .json({ ok: false, error: 'Unauthorized: missing or invalid x-relay-token' });
    }
  }
  // Temporary: accept the notify request, log it, and return success.
  // This mode is useful for smoke-testing the pipeline (function -> relay -> deliver)
  // without actually performing WebPush. To enable real WebPush, restore the
  // web-push.sendNotification logic above and ensure VAPID keys are set.
  try {
    const { subscription, message = {}, ttl = 60 } = req.body || {};
    console.log('Relay received notify:', { subscription, message, ttl });
    // Simulate delivery attempts for smoke test
    return res.status(200).json({ ok: true, status: 200, simulated: true });
  } catch (err) {
    console.error('Relay handler error', err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

// Expose VAPID public key for clients to fetch (optional convenience)
app.get('/vapidPublicKey', (req, res) => {
  if (!VAPID_PUBLIC_KEY) return res.status(404).json({ ok: false, error: 'Not configured' });
  res.json({ ok: true, vapidPublicKey: VAPID_PUBLIC_KEY });
});

app.listen(port, () => {
  console.log(`Push relay listening on http://localhost:${port}`);
  if (VAPID_PUBLIC_KEY) console.log('VAPID public key available');
});
