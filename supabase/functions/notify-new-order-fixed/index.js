import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  try {
    const payload = await req.json().catch(() => ({}));
    const urlObj = new URL(req.url);
    const debug = urlObj.searchParams.get("debug");
    console.log("New order received:", payload);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error("Missing SUPABASE_URL or SUPABASE_KEY environment variable(s)");
      return new Response(JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_KEY" }), { status: 500 });
    }

      const restUrlBase = `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/push_subscriptions`;
      const restUrl = `${restUrlBase}?select=id,subscription`;

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

    // Debug mode: return the raw subscriptions list for inspection
    if (debug === "list") {
      return new Response(JSON.stringify({ ok: true, rows: subs }), { status: 200 });
    }
    
      // Debug delete mode: accept { endpoint } in body or query and delete matching rows
      if (debug === "delete") {
        const endpointToDelete = payload && (payload.endpoint || payload.subscriptionEndpoint) || new URL(req.url).searchParams.get("endpoint");
        if (!endpointToDelete) {
          return new Response(JSON.stringify({ error: 'missing endpoint' }), { status: 400 });
        }

        const matches = subs.filter(r => r && r.subscription && r.subscription.endpoint === endpointToDelete);
        let deleted = 0;
        for (const m of matches) {
          const id = m.id;
          try {
            const delRes = await fetch(`${restUrlBase}?id=eq.${id}`, {
              method: 'DELETE',
              headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`,
              },
            });
            if (delRes.ok) deleted++;
          } catch (e) {
            console.error('delete error', e);
          }
        }

        return new Response(JSON.stringify({ ok: true, deleted }), { status: 200 });
      }
    console.log(`Found ${subs.length} subscribers.`);

    for (const row of subs) {
      const subscription = row && row.subscription ? row.subscription : row;
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
                body: `Order baru: RM${(payload && payload.record && payload.record.total) || ""}`,
              },
            }),
          });
        } else {
          const pushRelay = Deno.env.get("PUSH_RELAY_URL");
          if (pushRelay) {
            try {
              await fetch(`${pushRelay.replace(/\/$/, "")}/api/notify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subscription, record: (payload && payload.record) || null }),
              });
            } catch (relayErr) {
              console.error("Failed to POST to push relay:", relayErr);
            }
          } else {
            console.log("(info) would send WebPush to:", subscription.endpoint || subscription);
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
