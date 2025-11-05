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
  subscriptions.push(req.body);
  res.status(201).json({});
});

// Helper: get all push subscribers (could be replaced with DB lookup)
const getPushSubscribers = async () => {
  // For now keep subscribers in memory; replace with DB-backed storage if needed
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
