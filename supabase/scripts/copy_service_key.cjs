const fs = require('fs');
const p = 'supabase/.env.local';
if (!fs.existsSync(p)) { console.error('missing', p); process.exit(1); }
const s = fs.readFileSync(p,'utf8');
const m = s.match(/^SUPABASE_SERVICE_ROLE_KEY=(.*)$/m);
if (!m) { console.error('SUPABASE_SERVICE_ROLE_KEY not found'); process.exit(2); }
const val = m[1].trim();
// If SERVICE_ROLE_KEY already exists, replace it; otherwise add it after first line
let out = s;
if (/^SERVICE_ROLE_KEY=/m.test(s)) {
  out = s.replace(/^SERVICE_ROLE_KEY=.*$/m, 'SERVICE_ROLE_KEY=' + val);
} else {
  out = 'SERVICE_ROLE_KEY=' + val + '\n' + s;
}
fs.writeFileSync(p, out, 'utf8');
console.log('WROTE SERVICE_ROLE_KEY to', p);
