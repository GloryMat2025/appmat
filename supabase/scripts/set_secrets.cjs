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
const fs = require('fs');
const cp = require('child_process');
const path = 'supabase/.env.local';
if (!fs.existsSync(path)) { console.error('env file missing'); process.exit(1); }
const s = fs.readFileSync(path, 'utf8');
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
const fs = require('fs');
const cp = require('child_process');
const path = 'supabase/.env.local';
if (!fs.existsSync(path)) { console.error('env file missing'); process.exit(1); }
const s = fs.readFileSync(path, 'utf8');
const compact = s.replace(/\s+/g, '');
function extract(key){
  const re = new RegExp(key + '=([^#]*)');
  const m = compact.match(re);
  return m ? m[1] : '';
}
const service = extract('SUPABASE_SERVICE_ROLE_KEY');
const fcm = extract('FCM_SERVER_KEY');
if (!service) { console.error('SUPABASE_SERVICE_ROLE_KEY not found'); process.exit(2); }
console.log('Setting Supabase secrets (SERVICE_ROLE_KEY and FCM_SERVER_KEY) for project ref qtoiurlefwodxjcichgz...');
try {
  cp.execSync(`npx supabase secrets set --project-ref qtoiurlefwodxjcichgz SUPABASE_SERVICE_ROLE_KEY="${service}" FCM_SERVER_KEY="${fcm}"`, { stdio: 'inherit' });
  console.log('Secrets set.');
} catch (err) {
  console.error('Failed to set secrets:', err.message);
  process.exit(3);
}
