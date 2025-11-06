// notify-new-order production function with optional admin-only debug actions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const payload = await req.json().catch(() => ({}));
    console.log("notify-new-order payload:", payload);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");
    const ADMIN_TOKEN = Deno.env.get("ADMIN_TEST_TOKEN");

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error("Missing SUPABASE_URL or SUPABASE_KEY");
      return new Response(JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_KEY" }), { status: 500, headers: { "content-type": "application/json" } });
    }

    // Admin-only debug actions guarded by ADMIN_TEST_TOKEN
    const adminHeader = req.headers.get("x-admin-token");
    if (ADMIN_TOKEN && adminHeader && adminHeader === ADMIN_TOKEN) {
      const action = url.searchParams.get("action") || url.searchParams.get("debug");
      const restBase = `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/push_subscriptions`;

      if (action === "list") {
        const listRes = await fetch(`${restBase}?select=subscription`, {
          method: "GET",
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Accept: "application/json" },
        });
        const rows = await listRes.json().catch(() => []);
        return new Response(JSON.stringify({ ok: true, rows }), { status: 200, headers: { "content-type": "application/json" } });
      }

      if (action === "insert_test") {
        const fakeSub = { endpoint: "https://example.com/fake-subscription", keys: { p256dh: "fake-p256dh", auth: "fake-auth" } };
        const ins = await fetch(restBase, {
          method: "POST",
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
          body: JSON.stringify([{ subscription: fakeSub }]),
        });
        const body = await ins.json().catch(() => null);
        return new Response(JSON.stringify({ ok: ins.ok, status: ins.status, body }), { status: ins.ok ? 201 : 500, headers: { "content-type": "application/json" } });
      }

      if (action === "delete_by_id") {
        const id = url.searchParams.get("id");
        if (!id) return new Response(JSON.stringify({ error: "missing id" }), { status: 400, headers: { "content-type": "application/json" } });
        const del = await fetch(`${restBase}?id=eq.${encodeURIComponent(id)}`, {
          method: "DELETE",
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        });
        return new Response(null, { status: del.status });
      }

      return new Response(JSON.stringify({ error: "unknown admin action" }), { status: 400, headers: { "content-type": "application/json" } });
    }

    // Normal runtime behavior: fetch subscriptions and attempt delivery
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
      return new Response(JSON.stringify({ error: "Failed to fetch subscriptions", detail: text }), { status: 500, headers: { "content-type": "application/json" } });
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
      serve(async (req: Request) => {
        try {
          const url = new URL(req.url);
          const payload = await req.json().catch(() => ({}));
          console.log("notify-new-order payload:", payload);

          const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
          const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");
          const ADMIN_TOKEN = Deno.env.get("ADMIN_TEST_TOKEN");

          if (!SUPABASE_URL || !SUPABASE_KEY) {
            console.error("Missing SUPABASE_URL or SUPABASE_KEY");
            return new Response(JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_KEY" }), { status: 500 });
          }

          // Admin-only debug actions guarded by ADMIN_TEST_TOKEN
          const adminHeader = req.headers.get("x-admin-token");
          if (ADMIN_TOKEN && adminHeader && adminHeader === ADMIN_TOKEN) {
            const action = url.searchParams.get("action") || url.searchParams.get("debug");
            const restBase = `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/push_subscriptions`;

            if (action === "list") {
              const listRes = await fetch(`${restBase}?select=subscription`, {
                method: "GET",
                headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Accept: "application/json" },
              });
              const rows = await listRes.json().catch(() => []);
              return new Response(JSON.stringify({ ok: true, rows }), { status: 200, headers: { "content-type": "application/json" } });
            }

            if (action === "insert_test") {
              const fakeSub = { endpoint: "https://example.com/fake-subscription", keys: { p256dh: "fake-p256dh", auth: "fake-auth" } };
              const ins = await fetch(restBase, {
                method: "POST",
                headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
                body: JSON.stringify([{ subscription: fakeSub }]),
              });
              const body = await ins.json().catch(() => null);
              return new Response(JSON.stringify({ ok: ins.ok, status: ins.status, body }), { status: ins.ok ? 201 : 500, headers: { "content-type": "application/json" } });
            }

            if (action === "delete_by_id") {
              const id = url.searchParams.get("id");
              if (!id) return new Response(JSON.stringify({ error: "missing id" }), { status: 400 });
              const del = await fetch(`${restBase}?id=eq.${encodeURIComponent(id)}`, {
                method: "DELETE",
                headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
              });
              return new Response(null, { status: del.status });
            }

            return new Response(JSON.stringify({ error: "unknown admin action" }), { status: 400 });
          }

          // Normal runtime behavior: fetch subscriptions and attempt delivery
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
