// notify-new-order function (with temporary debug helpers)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const debugMode = url.searchParams.get("debug");

    // Safe debug endpoint: return presence and lengths of key env vars (no secret values)
    if (debugMode === "env") {
      const keys = [
        "SERVICE_ROLE_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
        "SUPABASE_ANON_KEY",
        "SUPABASE_URL",
        "FCM_SERVER_KEY",
        "VAPID_PUBLIC_KEY",
        "VAPID_PRIVATE_KEY",
      ];

      const env: Record<string, number | null> = {};
      for (const k of keys) {
        const v = Deno.env.get(k);
        env[k] = v ? v.length : null;
      }

      return new Response(JSON.stringify({ ok: true, env }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    const payload = await req.json().catch(() => ({}));
    console.log("notify-new-order payload:", payload);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_KEY =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error("Missing SUPABASE_URL or SUPABASE_KEY");
      return new Response(JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_KEY" }), { status: 500 });
    }

    const baseRest = `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/push_subscriptions`;
    const restUrl = `${baseRest}?select=subscription`;

    // Debug: list subscriptions
    if (debugMode === "list") {
      const listRes = await fetch(restUrl, {
        method: "GET",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Accept: "application/json",
        },
      });
      const data = await listRes.text().catch(() => "");
      return new Response(data, { status: listRes.status, headers: { "content-type": "application/json" } });
    }

    // Debug: insert a test subscription (returns created row)
    if (debugMode === "insert_test") {
      const testSub = {
        subscription: {
          endpoint: "https://fcm.googleapis.com/fcm/send/fake-token-123",
          keys: { p256dh: "fake", auth: "fake" },
        },
      };
      const insertRes = await fetch(baseRest, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(testSub),
      });
      const body = await insertRes.text().catch(() => "");
      return new Response(body, { status: insertRes.status, headers: { "content-type": "application/json" } });
    }

    // Debug: delete by endpoint
    if (debugMode === "delete_by_endpoint") {
      const endpoint = url.searchParams.get("endpoint") || "";
      if (!endpoint) return new Response(JSON.stringify({ error: "missing endpoint" }), { status: 400 });
      const encoded = encodeURIComponent(endpoint);
      const delRes = await fetch(`${baseRest}?endpoint=eq.${encoded}`, {
        method: "DELETE",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      });
      if (delRes.status === 204) return new Response(null, { status: 204 });
      const txt = await delRes.text().catch(() => "");
      return new Response(txt || JSON.stringify({ status: delRes.status }), { status: delRes.status });
    }
    // Debug: delete by id
    if (debugMode === "delete_by_id") {
      const id = url.searchParams.get("id") || "";
      if (!id) return new Response(JSON.stringify({ error: "missing id" }), { status: 400 });
      const delRes = await fetch(`${baseRest}?id=eq.${id}`, {
        method: "DELETE",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      });
      if (delRes.status === 204) return new Response(null, { status: 204 });
      const txt = await delRes.text().catch(() => "");
      return new Response(txt || JSON.stringify({ status: delRes.status }), { status: delRes.status });
    }

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
