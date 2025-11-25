const fs = require('fs');
const cp = require('child_process');
const projectRef = 'qtoiurlefwodxjcichgz';
const env = fs.readFileSync('supabase/.env.local', 'utf8');
const m = env.match(/^SERVICE_ROLE_KEY=(.*)$/m);
if (!m) {
  console.error('SERVICE_ROLE_KEY not found in supabase/.env.local');
  process.exit(1);
}
const value = m[1];
console.log('Setting SERVICE_ROLE_KEY secret for project', projectRef, ' (value length', value.length, ')');
const args = ['supabase','secrets','set','--project-ref', projectRef, `SERVICE_ROLE_KEY=${value}`];
// On Windows, using shell:true helps resolve npx/.cmd shims in PATH
const p = cp.spawn('npx', args, { stdio: 'inherit', shell: true });
p.on('exit', code => process.exit(code));