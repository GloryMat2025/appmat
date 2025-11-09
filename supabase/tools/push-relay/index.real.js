// Production push relay - single, minimal implementation

const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

// pipe console.* -> file logger (best-effort)
try {
  const logger = require('./logger');
  const _log = console.log;
  const _err = console.error;
  console.log = (...args) => {
    _log(...args);
    try {
      logger.info(args.join(' '));
    } catch (e) {
      _err('logger.info failed', e && e.stack);
    }
  };
  console.error = (...args) => {
    _err(...args);
    try {
      logger.error(args.join(' '));
    } catch (e) {
      _err('logger.error failed', e && e.stack);
    }
  };
} catch (e) {
  console.warn('logger load failed', e && (e.stack || e));
}

// Load local .env.local if present
try {
  const dotenvPath = path.resolve(__dirname, '..', '..', '.env.local');
  if (fs.existsSync(dotenvPath)) {
    try {
      require('dotenv').config({ path: dotenvPath });
      console.log('Loaded local env from', dotenvPath);
    } catch (e) {
      console.warn('dotenv load failed', e && (e.stack || e));
    }
  }
} catch (e) {
  console.warn('env load check failed', e && (e.stack || e));
}

const PORT = process.env.PORT ? Number(process.env.PORT) : 4001;
const RELAY_TOKENS = (
  process.env.ALLOWED_RELAY_TOKENS ||
  process.env.RELAY_TOKEN ||
  process.env.PUSH_RELAY_TOKEN ||
  ''
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC || '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || process.env.VAPID_PRIVATE || '';

let webpush = null;
let canSendReal = false;
try {
  webpush = require('web-push');
  if (VAPID_PUBLIC && VAPID_PRIVATE) {
    webpush.setVapidDetails('mailto:admin@example.com', VAPID_PUBLIC, VAPID_PRIVATE);
    canSendReal = true;
  }
} catch (e) {
  console.warn('web-push load failed', e && (e.stack || e));
  webpush = null;
}

const app = express();
app.use(bodyParser.json({ limit: '256kb' }));

app.get('/', (req, res) => res.type('text').send('push-relay - POST /api/notify'));

app.post('/api/notify', async (req, res) => {
  const ts = new Date().toISOString();
  const token = (req.headers['x-relay-token'] || '').toString();
  const payload = req.body || {};
  const subscription = payload.subscription;
  const record = payload.record || null;

  if (!subscription || !subscription.endpoint)
    return res.status(400).json({ ok: false, error: 'missing subscription.endpoint' });

  if (canSendReal && webpush) {
    try {
      const data = JSON.stringify({ record, timestamp: Date.now() });
      await webpush.sendNotification(subscription, data);
      return res.json({ ok: true, delivered: 1, simulated: false });
    } catch (err) {
      console.error('web-push error:', err && (err.stack || err));
      // fall through to simulated response
    }
  }

  return res.json({ ok: true, delivered: 1, simulated: true });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Push relay listening on http://127.0.0.1:${PORT}`);
});
