const fs = require('fs');
const path = 'supabase/.env.local';
const bak = path + '.bak';
fs.copyFileSync(path, bak);
let s = fs.readFileSync(path, 'utf8');
const lines = s.split(/\r?\n/);
const out = [];
let curKey = null;
let curVal = '';
const isKeyLine = l => /^[A-Z0-9_]+=.*/.test(l);
for (const line of lines) {
  if (isKeyLine(line)) {
    if (curKey) out.push(curKey + '=' + curVal);
    const i = line.indexOf('=');
    curKey = line.slice(0, i);
    curVal = line.slice(i + 1);
  } else {
    if (line.trim() !== '') curVal += line.trim();
  }
}
if (curKey) out.push(curKey + '=' + curVal);
fs.writeFileSync(path, out.join('\n') + '\n');
console.log('Normalized', path, '-> backup at', bak);