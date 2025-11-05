const fs = require('fs');
const path = require('path');

const root = process.cwd();
const pkgPath = path.join(root, 'package.json');
if (!fs.existsSync(pkgPath)) { console.error('package.json not found'); process.exit(2); }

const raw = fs.readFileSync(pkgPath, 'utf8');
const pkg = JSON.parse(raw);
const removed = { dependencies: {}, devDependencies: {} };

function markAndRemove(section) {
  if (!pkg[section] || typeof pkg[section] !== 'object') return;
  for (const name of Object.keys(pkg[section])) {
    const spec = pkg[section][name];
    const invalid = (typeof spec !== 'string') || spec.trim().length === 0 || /[\[\]<>]/.test(spec);
    if (invalid) {
      removed[section][name] = spec;
      delete pkg[section][name];
    }
  }
  if (pkg[section] && Object.keys(pkg[section]).length === 0) delete pkg[section];
}

markAndRemove('dependencies');
markAndRemove('devDependencies');

if (Object.keys(removed.dependencies).length === 0 && Object.keys(removed.devDependencies).length === 0) {
  console.log('No invalid dependency entries found. Nothing changed.');
  process.exit(0);
}

const ts = new Date().toISOString().replace(/[:.]/g,'-');
const backup = path.join(root, `package.json.bak.${ts}.json`);
const report = path.join(root, `package-clean-report.${ts}.json`);

fs.writeFileSync(backup, raw, 'utf8');
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
fs.writeFileSync(report, JSON.stringify({ timestamp: new Date().toISOString(), backup: path.basename(backup), removed }, null, 2), 'utf8');

console.log('Backup created:', backup);
console.log('Cleaned package.json written.');
console.log('Report:', report);
console.log('Removed entries:');
Object.keys(removed).forEach(sec => {
  if (Object.keys(removed[sec]).length) {
    console.log(' ', sec + ':');
    Object.entries(removed[sec]).forEach(([k,v]) => console.log('   -', k, '=>', JSON.stringify(v)));
  }
});