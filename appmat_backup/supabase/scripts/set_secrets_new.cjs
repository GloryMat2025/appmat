const fs = require('fs');
const cp = require('child_process');
const p = 'supabase/.env.local';
if (!fs.existsSync(p)) { console.error('env file missing'); process.exit(1); }
const s = fs.readFileSync(p, 'utf8');
function extract(key) {
  const m = s.match(new RegExp('^' + key + '=(.*)$', 'm'));
  return m ? m[1].trim() : '';
}
const service = extract('SERVICE_ROLE_KEY');
const fcm = extract('FCM_SERVER_KEY');
if (!service) { console.error('SERVICE_ROLE_KEY not found in supabase/.env.local'); process.exit(2); }
console.log('Setting Supabase secrets (SERVICE_ROLE_KEY and FCM_SERVER_KEY) for project ref qtoiurlefwodxjcichgz...');
try {
  cp.execSync(`npx supabase secrets set --project-ref qtoiurlefwodxjcichgz SERVICE_ROLE_KEY="${service}" FCM_SERVER_KEY="${fcm}"`, { stdio: 'inherit' });
  console.log('Secrets set.');
} catch (err) {
  console.error('Failed to set secrets:', err.message);
  process.exit(3);
}
