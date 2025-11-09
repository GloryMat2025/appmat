const fs = require('fs');
const path = require('path');

function loadEnvFile(envPath) {
  const out = {};
  try {
    const text = fs.readFileSync(envPath, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const idx = t.indexOf('=');
      if (idx === -1) continue;
      const k = t.slice(0, idx).trim();
      let v = t.slice(idx + 1).trim();
      // Unwrap quotes
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
        v = v.slice(1, -1);
      out[k] = v;
    }
  } catch (e) {
    console.error('Failed to read env file', envPath, e && (e.stack || e));
  }
  return out;
}

async function main() {
  const envPath = path.resolve(__dirname, '..', '..', '.env.local');
  const env = loadEnvFile(envPath);
  const SUPABASE_URL = env.SUPABASE_URL || process.env.SUPABASE_URL;
  const SRK = env.SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;
  const PUSH_RELAY_URL = env.PUSH_RELAY_URL || 'http://127.0.0.1:4001';
  const RELAY_TOKEN =
    (
      env.ALLOWED_RELAY_TOKENS ||
      env.PUSH_RELAY_TOKEN ||
      process.env.ALLOWED_RELAY_TOKENS ||
      ''
    ).split(',')[0] || '';

  if (!SUPABASE_URL || !SRK) {
    console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const restUrl = `${SUPABASE_URL.replace(
    /\/$/,
    ''
  )}/rest/v1/push_subscriptions?select=subscription`;
  console.log('Fetching subscriptions from', restUrl);
  const res = await fetch(restUrl, { headers: { apikey: SRK, Authorization: `Bearer ${SRK}` } });
  if (!res.ok) {
    console.error('Failed to fetch subscriptions', res.status, await res.text());
    process.exit(2);
  }
  const rows = await res.json();
  console.log('Got', rows.length, 'subscriptions');

  for (const row of rows) {
    const subscription = row && row.subscription ? row.subscription : row;
    if (!subscription) continue;
    try {
      const r = await fetch(`${PUSH_RELAY_URL.replace(/\/$/, '')}/api/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(RELAY_TOKEN ? { 'x-relay-token': RELAY_TOKEN } : {}),
        },
        body: JSON.stringify({ subscription, record: null }),
      });
      const body = await r.text();
      console.log('Relay response', r.status, body.substring(0, 400));
    } catch (e) {
      console.error(
        'Failed to POST to relay for endpoint',
        subscription && subscription.endpoint,
        e && (e.stack || e)
      );
    }
  }
}

main().catch((e) => {
  console.error(e && e.stack);
  process.exit(99);
});
