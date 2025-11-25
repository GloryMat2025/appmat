#!/usr/bin/env node
// Simple smoke test script for the notify-new-order function.
// Usage (PowerShell/CMD):
//   set SERVICE_ROLE_KEY=... & set SUPABASE_URL=https://<project>.supabase.co & node supabase/scripts/notify_smoke.cjs
// Or in PowerShell:
//   $env:SERVICE_ROLE_KEY="..."; $env:SUPABASE_URL="https://..."; node .\supabase\scripts\notify_smoke.cjs

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const FUNCTION_URL = process.env.NOTIFY_FUNCTION_URL || 'https://qtoiurlefwodxjcichgz.functions.supabase.co/notify-new-order';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY environment variables.');
  console.error('Set SUPABASE_URL and SERVICE_ROLE_KEY (or SUPABASE_SERVICE_ROLE_KEY) before running this script.');
  process.exit(2);
}

(async function main() {
  try {
    console.log('Supabase URL:', SUPABASE_URL);
    console.log('Function URL:', FUNCTION_URL);

    // Create a fake subscription object. It doesn't need to be a valid push subscription for this smoke test
    // because we only verify the function runs and returns a delivered count. Delivery may be 0 if keys are missing.
    const fakeSubscription = {
      endpoint: 'https://example.com/fake-subscription',
      keys: { p256dh: 'fake-p256dh', auth: 'fake-auth' },
    };

    // Insert test subscription
    console.log('Inserting test subscription...');
    const insertResp = await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify([{ subscription: fakeSubscription }]),
    });

    if (!insertResp.ok) {
      const body = await insertResp.text();
      throw new Error(`Insert failed ${insertResp.status}: ${body}`);
    }
    const inserted = await insertResp.json();
    const id = inserted && inserted[0] && inserted[0].id;
    console.log('Inserted row id:', id);

    // Trigger the function
    console.log('Triggering function POST...');
    const triggerResp = await fetch(FUNCTION_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ test: true }) });
    const triggerBody = await triggerResp.text();
    console.log('Function response status:', triggerResp.status);
    console.log('Function response body:', triggerBody);

    // Delete the test row
    if (id) {
      console.log('Deleting test row...');
      const del = await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        },
      });
      console.log('Delete status:', del.status);
    } else {
      console.warn('No id returned from insert, skipping delete.');
    }

    console.log('Smoke test finished. Note: real delivery requires FCM/VAPID secrets in the project.');
  } catch (err) {
    console.error('Smoke test failed:', err);
    process.exit(1);
  }
})();
