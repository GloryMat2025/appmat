// Safe cleaner: backs up package.json and removes invalid dependency specs
const fs = require('fs');
const path = require('path');

function backup(file) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const dest = file + `.bak.${ts}`;
  fs.copyFileSync(file, dest);
  console.log(`Backed up ${file} => ${dest}`);
  return dest;
}

function isInvalidSpec(v) {
  if (typeof v !== 'string') return true;
  const s = v.trim();
  if (!s) return true;
  if (/^[\[\<\{]/.test(s)) return true; // starts with [, <, { (placeholders)
  if (s === 'latest' || s === '*' || s === 'stable') return false; // allow common tokens
  return false;
}

function clean(file) {
  if (!fs.existsSync(file)) return;
  let raw = fs.readFileSync(file, 'utf8');
  let pkg;
  try {
    pkg = JSON.parse(raw);
  } catch (e) {
    console.error(`ERROR: Can't parse ${file}: ${e.message}`);
    process.exit(1);
  }
  backup(file);
  const sections = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];
  const removed = [];
  sections.forEach((sec) => {
    if (!pkg[sec] || typeof pkg[sec] !== 'object') return;
    Object.entries(pkg[sec]).forEach(([name, spec]) => {
      if (isInvalidSpec(spec)) {
        removed.push({ file, section: sec, name, spec });
        delete pkg[sec][name];
      }
    });
    if (Object.keys(pkg[sec]).length === 0) delete pkg[sec];
  });
  if (removed.length === 0) {
    console.log(`${file}: No invalid dependency specs found.`);
  } else {
    fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    console.log(`${file}: Removed ${removed.length} invalid entries:`);
    removed.forEach((r) => console.log(` - ${r.section} ${r.name} => ${JSON.stringify(r.spec)}`));
    console.log(
      '\nYou can re-add valid versions (e.g. "react": "^18.2.0") or run `npm install <pkg>@latest` as needed.'
    );
  }
}

['package.json', 'appmat/package.json'].forEach(clean);
