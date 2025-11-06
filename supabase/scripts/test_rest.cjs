const https = require('https');
const fs = require('fs');
const env = fs.readFileSync('supabase/.env.local','utf8');
const mUrl = env.match(/^SUPABASE_URL=(.*)$/m);
const mKey = env.match(/^SERVICE_ROLE_KEY=(.*)$/m) || env.match(/^SUPABASE_SERVICE_ROLE_KEY=(.*)$/m) || env.match(/^SUPABASE_ANON_KEY=(.*)$/m);
if(!mUrl||!mKey){ console.error('Missing SUPABASE_URL or key in supabase/.env.local'); process.exit(1); }
const url = mUrl[1].replace(/\/$/,'') + '/rest/v1/push_subscriptions?select=subscription';
const key = mKey[1];
console.log('GET', url);
const options = new URL(url);
const headers = { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' };
options.method = 'GET';
options.headers = headers;
const req = https.request(options, res => {
  console.log('status', res.statusCode);
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    console.log('body', body);
  });
});
req.on('error', e => console.error('request error', e));
req.end();
