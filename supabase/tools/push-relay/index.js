// Minimal, single-instance push relay (CommonJS). Node 18+ required for global fetch.
const express = require('express');
const webpush = require('web-push');

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json({ limit: '128kb' }));

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const RELAY_TOKEN = process.env.RELAY_TOKEN; // optional auth

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.warn('Warning: VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY is not set. WebPush will be simulated.');
} else {
  webpush.setVapidDetails('mailto:dev@example.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// Health
app.get('/health', (_req, res) => res.json({ ok: true }));

// Order status endpoint (compatible with function relay post). Optional FCM forwarding if configured.
app.post('/order-status', async (req, res) => {
  try {
    const { order_id, status } = req.body || {};
    console.log('order-status:', { order_id, status });

    const subsEndpoint = process.env.SUBSCRIPTION_ENDPOINT; // expects JSON [{token: "..."}, ...]
    const fcmKey = process.env.FCM_SERVER_KEY;

    if (subsEndpoint && fcmKey) {
      const r = await fetch(subsEndpoint);
      const list = await r.json().catch(() => []);
      const tokens = Array.isArray(list) ? list.map((d) => d.token).filter(Boolean) : [];
      for (const t of tokens) {
        await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `key=${fcmKey}`,
          },
          body: JSON.stringify({
            to: t,
            notification: { title: 'Order Update', body: `Your order is now ${status}.` },
          }),
        }).catch((e) => console.warn('FCM send failed:', e));
      }
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error('order-status error', e);
    return res.status(500).json({ ok: false, error: String(e) });
  }
});

// Generic WebPush endpoint (simulated when VAPID not configured)
// POST /api/notify { subscription, message?: {title, body, data}, ttl?: number }
app.post('/api/notify', async (req, res) => {
  try {
    if (RELAY_TOKEN) {
      const token = req.header('x-relay-token');
      if (!token || token !== RELAY_TOKEN) {
        return res.status(401).json({ ok: false, error: 'Unauthorized' });
      }
    }

    const { subscription, message = {}, ttl = 60 } = req.body || {};
    if (!subscription) {
      return res.status(400).json({ ok: false, error: 'missing subscription' });
    }

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.log('Simulated notify:', { subscription, message, ttl });
      return res.status(200).json({ ok: true, simulated: true });
    }

    await webpush.sendNotification(subscription, JSON.stringify(message), { TTL: ttl });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('notify error', err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

app.listen(port, () => {
  console.log(`Push relay listening on http://localhost:${port}`);
  if (VAPID_PUBLIC_KEY) console.log('VAPID public key configured');
});
