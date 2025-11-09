const fs = require('fs');
const cp = require('child_process');

const envPath = 'supabase/.env.local';
if (!fs.existsSync(envPath)) {
  console.error('env file missing:', envPath);
  process.exit(1);
}

const raw = fs.readFileSync(envPath, 'utf8');

// Parse as simple KEY=VALUE lines, ignoring comments and blank lines
const map = {};
for (const line of raw.split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const idx = t.indexOf('=');
  if (idx === -1) continue;
  const key = t.slice(0, idx).trim();
  const val = t.slice(idx + 1).trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
  map[key] = val;
}

const service = map['SUPABASE_SERVICE_ROLE_KEY'] || map['SERVICE_ROLE_KEY'] || '';
if (!service) {
  console.error('No SUPABASE_SERVICE_ROLE_KEY or SERVICE_ROLE_KEY found in', envPath);
  process.exit(2);
}

const fcm = map['FCM_SERVER_KEY'] || '';
const adminToken = map['ADMIN_TEST_TOKEN'] || '';
const vapidPub = map['VAPID_PUBLIC_KEY'] || '';
const vapidPriv = map['VAPID_PRIVATE_KEY'] || '';
const pushRelay = map['PUSH_RELAY_URL'] || '';

const args = [];
// Supabase CLI cannot set secrets that start with SUPABASE_, so set SERVICE_ROLE_KEY instead
args.push('SERVICE_ROLE_KEY=' + service);
if (fcm) args.push('FCM_SERVER_KEY=' + fcm);
if (adminToken) args.push('ADMIN_TEST_TOKEN=' + adminToken);
if (vapidPub) args.push('VAPID_PUBLIC_KEY=' + vapidPub);
if (vapidPriv) args.push('VAPID_PRIVATE_KEY=' + vapidPriv);
if (pushRelay) args.push('PUSH_RELAY_URL=' + pushRelay);

const cmd = 'npx supabase secrets set --project-ref qtoiurlefwodxjcichgz ' + args.map(a => {
  // wrap each arg in double quotes to be safe in the shell
  return '"' + a.replace(/"/g, '\\"') + '"';
}).join(' ');
console.log('Running:', cmd.replace(/SUPABASE_SERVICE_ROLE_KEY=\".*\"/, 'SUPABASE_SERVICE_ROLE_KEY="***"'));
try {
  cp.execSync(cmd, { stdio: 'inherit', shell: true });
  console.log('Secrets set.');
} catch (err) {
  console.error('Error running supabase CLI:', err && err.message ? err.message : String(err));
  process.exit(3);
}
