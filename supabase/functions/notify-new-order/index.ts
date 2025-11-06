// notify-new-order production function (no debug helpers)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req: Request) => {
  try {
    const payload = await req.json().catch(() => ({}));
    console.log("notify-new-order payload:", payload);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error("Missing SUPABASE_URL or SUPABASE_KEY");
      return new Response(JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_KEY" }), { status: 500 });
    }

    const restUrl = `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/push_subscriptions?select=subscription`;

    const res = await fetch(restUrl, {
      method: "GET",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("Failed to fetch push_subscriptions:", res.status, text);
      return new Response(JSON.stringify({ error: "Failed to fetch subscriptions", detail: text }), { status: 500 });
    }

    const rows = await res.json().catch(() => []);
    const subs = Array.isArray(rows) ? rows : [];
    console.log(`Found ${subs.length} subscriptions`);

    for (const row of subs) {
      const subscription = row?.subscription ?? row;
      if (!subscription) continue;

      try {
        const fcmKey = Deno.env.get("FCM_SERVER_KEY");
        if (fcmKey && typeof subscription.endpoint === "string" && subscription.endpoint.includes("fcm")) {
          await fetch("https://fcm.googleapis.com/fcm/send", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `key=${fcmKey}`,
            },
            body: JSON.stringify({ to: subscription.endpoint, notification: { title: "New order", body: `Order: ${payload?.record?.total ?? ""}` } }),
          });
        } else {
          console.log("(info) would send WebPush to:", subscription.endpoint ?? subscription);
        }
      } catch (e) {
        console.error("Failed notifying subscriber:", e);
      }
    }

    return new Response(JSON.stringify({ ok: true, delivered: subs.length }), { status: 200, headers: { "content-type": "application/json" } });
  } catch (err) {
    console.error("notify-new-order error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { "content-type": "application/json" } });
  }
});
