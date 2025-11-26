import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

function safeExec(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  } catch (e) {
    return null;
  }
}

const repoRoot = process.cwd();
const pkgPath = path.join(repoRoot, 'package.json');
if (!fs.existsSync(pkgPath)) {
  console.error('package.json not found at', pkgPath);
  process.exit(2);
}

const original = fs.readFileSync(pkgPath, 'utf8');
let pkg;
try {
  pkg = JSON.parse(original);
} catch (e) {
  console.error('package.json invalid JSON:', e.message);
  process.exit(2);
}

const removed = { dependencies: {}, devDependencies: {} };
const suggestions = {};

function isPlaceholderString(s) {
  return typeof s === 'string' && /[\[\]<>]/.test(s);
}
function shouldRemoveSpec(spec) {
  return typeof spec !== 'string' || spec.trim().length === 0 || isPlaceholderString(spec);
}

function sanitize(sectionName) {
  const sec = pkg[sectionName];
  if (!sec || typeof sec !== 'object') return;
  for (const [name, spec] of Object.entries(sec)) {
    if (shouldRemoveSpec(spec)) {
      removed[sectionName][name] = spec;
      delete sec[name];
      if (!/[\[\]<>]/.test(name)) {
        const v = safeExec(`npm view ${name} version`);
        suggestions[name] = v ? `^${v}` : null;
      } else {
        suggestions[name] = null;
      }
    }
  }
  if (sec && Object.keys(sec).length === 0) delete pkg[sectionName];
}

sanitize('dependencies');
sanitize('devDependencies');

const ts = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(repoRoot, `package.json.bak.${ts}.json`);
const reportPath = path.join(repoRoot, `package-fix-report.${ts}.json`);

if (
  Object.keys(removed.dependencies).length === 0 &&
  Object.keys(removed.devDependencies).length === 0
) {
  console.log('No invalid dependency entries found. package.json unchanged.');
  process.exit(0);
}

fs.writeFileSync(backupPath, original, 'utf8');
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

const report = {
  timestamp: new Date().toISOString(),
  backup: path.basename(backupPath),
  removed,
  suggestions,
};
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

console.log('Backed up original package.json ->', backupPath);
console.log('Wrote cleaned package.json ->', pkgPath);
console.log('Wrote fix report ->', reportPath);
console.log('Removed entries:');
for (const sec of ['dependencies', 'devDependencies']) {
  const items = removed[sec];
  if (Object.keys(items).length) {
    console.log(` ${sec}:`);
    for (const k of Object.keys(items)) {
      console.log(
        `  - ${k} => ${JSON.stringify(items[k])} (suggested: ${JSON.stringify(suggestions[k])})`
      );
    }
  }
}

console.log('\nNext steps:');
console.log(' 1) Inspect the report file:', reportPath);
console.log(
  ' 2) Re-add needed packages with valid version strings (use suggestions in report if helpful).'
);
console.log(' 3) Run `npm install`.');
console.log('\nTo restore original package.json if needed: copy', backupPath, 'over package.json');
