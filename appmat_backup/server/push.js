import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import express from 'express';

const app = express();
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

webpush.setVapidDetails(
  'mailto:admin@appmat.com',
  process.env.VAPID_PUBLIC,
  process.env.VAPID_PRIVATE
);

let subscriptions = [];

// Terima subscription dari client
app.post('/api/subscribe', (req, res) => {
  const sub = req.body;

  // Try to persist subscription to Supabase table `push_subscriptions` if available
  (async () => {
    try {
      await supabase.from('push_subscriptions').insert({ subscription: sub });
      console.log('💾 Stored subscription in Supabase');
    } catch (dbErr) {
      // If DB insert fails, keep in-memory as a fallback
      console.warn('⚠️ Could not store subscription in Supabase, falling back to memory', dbErr);
      subscriptions.push(sub);
    }
  })();

  res.status(201).json({});
});

// Accept notify requests from relay (Edge Function). Body: { subscription } or { subscriptions: [...], record }
app.post('/api/notify', async (req, res) => {
  const body = req.body || {};
  const targets = body.subscriptions || (body.subscription ? [body.subscription] : []);
  if (!Array.isArray(targets) || targets.length === 0) {
    return res.status(400).json({ error: 'missing subscription(s)' });
  }

  const payload = body.record ? JSON.stringify({ title: 'Pesanan Baru!', body: `Order baru: RM${body.record.total ?? ''}`, url: '/admin/orders' }) : JSON.stringify({ title: 'Pesanan Baru!', body: 'Order baru', url: '/admin/orders' });

  const promises = targets.map((sub) =>
    webpush
      .sendNotification(sub, payload)
      .then(() => ({ ok: true }))
      .catch((err) => {
        console.error('webpush send error', err);
        return { ok: false, error: String(err) };
      })
  );

  const results = await Promise.all(promises);
  return res.json({ ok: true, results });
});

// Helper: get all push subscribers (prefer DB lookup, fallback to memory)
const getPushSubscribers = async () => {
  try {
    const { data, error } = await supabase.from('push_subscriptions').select('subscription');
    if (error) throw error;
    if (Array.isArray(data) && data.length > 0) {
      return data.map((r) => r.subscription).filter(Boolean);
    }
  } catch (err) {
    console.warn('⚠️ Failed to read subscriptions from Supabase, using in-memory list', err);
  }

  return subscriptions;
};

// Dengar trigger dari Supabase
supabase
  .channel('new_order_channel')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'orders' },
    async (payload) => {
      console.log('� Pesanan baru:', payload.new);

      // Push ke semua client yang ada subscription
      const subscribers = await getPushSubscribers();
      const promises = subscribers.map((sub) =>
        webpush
          .sendNotification(
            sub,
            JSON.stringify({
              title: '🛍️ Pesanan Baru!',
              body: `RM${payload.new.total} - ${payload.new.payment_metl}`,
              url: '/admin/orders',
            })
          )
          .catch((err) => console.error('webpush error', err))
      );

      await Promise.all(promises);
    }
  )
  .subscribe();

app.listen(3000, () => console.log('🚀 Push server listening on port 3000'));
