const fs = require('fs');
const fetch = global.fetch || require('node-fetch');

function loadEnv() {
  const p = 'supabase/.env.local';
  if (!fs.existsSync(p)) throw new Error('supabase/.env.local not found');
  const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/);
  const map = {};
  for (const l of lines) {
    if (!l || l.trim().startsWith('#')) continue;
    const idx = l.indexOf('=');
    if (idx === -1) continue;
    const k = l.slice(0, idx).trim();
    const vraw = l.slice(idx + 1).trim();
    const v = vraw.split('#')[0].trim(); // strip inline comments
    map[k] = v;
  }
  return map;
}

(async () => {
  try {
    const env = loadEnv();
    const SUPABASE_URL = env.SUPABASE_URL;
    const KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !KEY) {
      console.error('Missing SUPABASE_URL or service role key in supabase/.env.local');
      process.exit(2);
    }

    console.log('Using SUPABASE_URL:', SUPABASE_URL);

    // 1) Insert subscription
    const testSub = {
      subscription: {
        endpoint: 'https://example.com/push/integration-test',
        keys: { p256dh: 'p256', auth: 'auth' },
      },
    };
    console.log('Inserting test subscription...');
    const insertRes = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/push_subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: KEY,
        Authorization: 'Bearer ' + KEY,
        Prefer: 'return=representation',
      },
      body: JSON.stringify(testSub),
    });

    const insertText = await insertRes.text();
    console.log('Insert status:', insertRes.status);
    if (!insertRes.ok) {
      console.error('Insert failed:', insertText);
      console.error(
        '\nIf this is a 401/Invalid API key, the local service key in supabase/.env.local may be stale or contain comments. You can either update it with a valid service role key or run the integration via the runtime helper.'
      );
      process.exit(1);
    }

    let inserted;
    try {
      inserted = JSON.parse(insertText)[0];
    } catch (e) {
      inserted = null;
    }
    if (!inserted || !inserted.id) {
      console.error('Unexpected insert response:', insertText);
      process.exit(1);
    }

    console.log('Inserted subscription id:', inserted.id);

    // 2) Trigger function
    const funcUrl =
      (env.SUPABASE_URL || SUPABASE_URL).replace('.supabase.co', '.functions.supabase.co') +
      '/notify-new-order-fixed';
    console.log('Triggering function at', funcUrl);
    const triggerRes = await fetch(funcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ record: { id: 9999, total: 12.34 } }),
    });
    const triggerText = await triggerRes.text();
    console.log('Function status:', triggerRes.status, 'body:', triggerText);

    // 3) Cleanup - delete inserted row
    console.log('Deleting inserted subscription id', inserted.id);
    const delRes = await fetch(
      `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/push_subscriptions?id=eq.${inserted.id}`,
      {
        method: 'DELETE',
        headers: { apikey: KEY, Authorization: 'Bearer ' + KEY },
      }
    );
    console.log('Delete status:', delRes.status);

    console.log('Integration test complete.');
  } catch (e) {
    console.error('Error running integration test:', e);
    process.exit(1);
  }
})();
