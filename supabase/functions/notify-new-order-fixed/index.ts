import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  try {
    const payload = await req.json().catch(() => ({}));
    console.log("New order received:", payload);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");

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
            // Prefer delegating WebPush delivery to a push relay (Node server) if configured.
            const pushRelay = Deno.env.get("PUSH_RELAY_URL");
            if (pushRelay) {
              try {
                await fetch(`${pushRelay.replace(/\/$/, "")}/api/notify`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ subscription, record: payload?.record || null }),
                });
              } catch (relayErr) {
                console.error("Failed to POST to push relay:", relayErr);
              }
            } else {
              console.log("(info) would send WebPush to:", subscription.endpoint ?? subscription);
            }
          }
        } catch (e) {
          console.error("Failed to notify subscriber:", e);
        }
      }
    
      return new Response(JSON.stringify({ ok: true, delivered: subs.length }), { status: 200 });
    } catch (err) {
      console.error("Error in notify-new-order:", err);
      return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
    }
});
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req: Request) => {
  try {
    // allow a quick debug probe: GET or POST with ?debug=env will return which
    // Supabase env variables are present and their lengths (does NOT return secrets)
    const url = new URL(req.url);
    if (url.searchParams.get("debug") === "env") {
      const keys = [
        "SERVICE_ROLE_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
        "SUPABASE_ANON_KEY",
        "SUPABASE_URL",
      ];
      const info: Record<string, number | null> = {};
      for (const k of keys) {
        const v = Deno.env.get(k);
        info[k] = v ? v.length : null;
      }
      return new Response(JSON.stringify({ env: info }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const payload = await req.json().catch(() => ({}));

    // Additional debug probe: ?debug=rest will try the PostgREST endpoint with
    // each candidate API key and return status + short body snippet (helps
    // determine which key, if any, is accepted). Warning: this will call your
    // database REST endpoint and may return data snippets.
    if (url.searchParams.get("debug") === "rest") {
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
      const candidates = [
        { name: "SERVICE_ROLE_KEY", v: Deno.env.get("SERVICE_ROLE_KEY") },
        { name: "SUPABASE_SERVICE_ROLE_KEY", v: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") },
        { name: "SUPABASE_ANON_KEY", v: Deno.env.get("SUPABASE_ANON_KEY") },
      ];
      const restUrl = `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/push_subscriptions?select=subscription`;
      const results: Array<{ name: string; status: number; body: string }> = [];
      for (const c of candidates) {
        if (!c.v) {
          results.push({ name: c.name, status: 0, body: "missing" });
          continue;
        }
        try {
          const r = await fetch(restUrl, {
            method: "GET",
            headers: {
              apikey: c.v,
              Authorization: `Bearer ${c.v}`,
              Accept: "application/json",
            },
          });
          try {
            const payload = await req.json().catch(() => ({}));
            console.log("≡ƒôª New order received:", payload);

            const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
            // Prefer the canonical SUPABASE_SERVICE_ROLE_KEY if present (works with
            // dashboard-managed secrets). Fall back to SERVICE_ROLE_KEY (non-prefixed)
            // and then to SUPABASE_ANON_KEY.
            const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");

    return new Response(JSON.stringify({ ok: true, delivered: subs.length }), { status: 200 });
  } catch (err) {
    console.error("❌ Error in notify-new-order:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
