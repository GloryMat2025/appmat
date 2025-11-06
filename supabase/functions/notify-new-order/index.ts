import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req: Request) => {
  try {
    const payload = await req.json().catch(() => ({}));
    console.log("📦 New order received:", payload);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error("Missing SUPABASE_URL or SUPABASE_KEY environment variable(s)");
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
      const text = await res.text();
      console.error("Failed to fetch push_subscriptions:", res.status, text);
      return new Response(JSON.stringify({ error: "Failed to fetch subscriptions", detail: text }), { status: 500 });
    }

    const rows = await res.json();
    const subs = Array.isArray(rows) ? rows : [];
    console.log(`Found ${subs.length} subscribers.`);

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
            body: JSON.stringify({
              to: subscription.endpoint,
              notification: {
                title: "Pesanan Baru!",
                body: `Order baru: RM${payload?.record?.total ?? ""}`,
              },
            }),
          });
        } else {
          console.log("(info) would send WebPush to:", subscription.endpoint ?? subscription);
        }
      } catch (e) {
        console.error("Failed to notify subscriber:", e);
      }
    }

    return new Response(JSON.stringify({ ok: true, delivered: subs.length }), { status: 200 });
  } catch (err) {
    console.error("❌ Error in notify-new-order:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
// Supabase Edge Function: notify-new-order
// Single clean implementation - no duplicates or stray characters.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req: Request) => {
  try {
    const payload = await req.json().catch(() => ({}));
    console.log("📦 New order received:", payload);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error("Missing SUPABASE_URL or SUPABASE_KEY environment variable(s)");
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
      const text = await res.text();
      console.error("Failed to fetch push_subscriptions:", res.status, text);
      return new Response(JSON.stringify({ error: "Failed to fetch subscriptions", detail: text }), { status: 500 });
    }

    const rows = await res.json();
    const subs = Array.isArray(rows) ? rows : [];
    console.log(`Found ${subs.length} subscribers.`);

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
            body: JSON.stringify({
              to: subscription.endpoint,
              notification: {
                title: "Pesanan Baru!",
                body: `Order baru: RM${payload?.record?.total ?? ""}`,
              },
            }),
          });
        } else {
          console.log("(info) would send WebPush to:", subscription.endpoint ?? subscription);
        }
      } catch (e) {
        console.error("Failed to notify subscriber:", e);
      }
    }

    return new Response(JSON.stringify({ ok: true, delivered: subs.length }), { status: 200 });
  } catch (err) {
    console.error("❌ Error in notify-new-order:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
// supabase/functions/notify-new-order/index.ts
// Simple Supabase Edge Function: fetch push_subscriptions from Supabase REST
// and attempt to notify subscribers. Configuration is read from environment:
// - SUPABASE_URL (required)
// - SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY (one required)
// - optional: FCM_SERVER_KEY
// Note: This function intentionally logs web-push intents instead of implementing
// the full Web Push VAPID flow. Add a proper web-push implementation if needed.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  try {
    const payload = await req.json().catch(() => ({}));
    console.log("📦 New order received:", payload);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error("Missing SUPABASE_URL or SUPABASE_KEY environment variable(s)");
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
      const text = await res.text();
      console.error("Failed to fetch push_subscriptions:", res.status, text);
      return new Response(JSON.stringify({ error: "Failed to fetch subscriptions", detail: text }), { status: 500 });
    }

    const rows = await res.json();
    const subs = Array.isArray(rows) ? rows : [];
    console.log(`Found ${subs.length} subscribers.`);

    // Notify subscribers (best-effort). The table stores a `subscription` object.
    for (const row of subs) {
      const subscription = row?.subscription ?? row;
      if (!subscription) continue;

      try {
        // If the project has an FCM key and the endpoint looks like FCM, attempt legacy FCM send
        const fcmKey = Deno.env.get("FCM_SERVER_KEY");
        if (fcmKey && typeof subscription.endpoint === "string" && subscription.endpoint.includes("fcm")) {
          await fetch("https://fcm.googleapis.com/fcm/send", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `key=${fcmKey}`,
            },
            body: JSON.stringify({
              to: subscription.endpoint,
              notification: {
                title: "Pesanan Baru!",
                body: `Order baru: RM${payload?.record?.total ?? ""}`,
              },
            }),
          });
        } else {
          // Web Push requires VAPID keys and a library implementation. For now log intent.
          console.log("(info) would send WebPush to:", subscription.endpoint ?? subscription);
        }
      } catch (e) {
        console.error("Failed to notify subscriber:", e);
      }
    }

    return new Response(JSON.stringify({ ok: true, delivered: subs.length }), { status: 200 });
  } catch (err) {
    console.error("❌ Error in notify-new-order:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
import { serve } from \ https://deno.land/std@0.168.0/http/server.ts\;

serve(async (req) => {
  const SUPABASE_URL = Deno.env.get(\SUPABASE_URL\) ?? null;
  const SUPABASE_KEY = Deno.env.get(\SUPABASE_SERVICE_ROLE_KEY\) ?? Deno.env.get(\SUPABASE_ANON_KEY\) ?? null;
  return new Response(JSON.stringify({ ok: true, SUPABASE_URL, hasKey: !!SUPABASE_KEY }), { status: 200, headers: { 'content-type': 'application/json' } });
});
