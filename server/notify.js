import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

webpush.setVapidDetails(
  "mailto:admin@yourdomain.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

supabase
  .channel("new_order_channel")
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "orders" },
    async (payload) => {
      const { data: subs } = await supabase.from("push_subscribers").select("*");
      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            sub.sub_data,
            JSON.stringify({
              title: "🛍️ Pesanan Baru!",
              body: `Jumlah RM${payload.new.total} | ${payload.new.payment_metl}`,
              url: "/admin/orders",
            })
          );
        } catch (err) {
          console.error("❌ Hantar gagal:", err);
        }
      }
    }
  )
  .subscribe();
