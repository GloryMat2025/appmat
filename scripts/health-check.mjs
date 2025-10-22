import fs from 'fs';
import path from 'path';

const repoRoot = new URL('../', import.meta.url);
const pkgPath = new URL('../package.json', import.meta.url);
const lockPath = new URL('../pnpm-lock.yaml', import.meta.url);

function exists(url) {
  try {
    fs.accessSync(url);
    return true;
  } catch (e) {
    return false;
  }
}

console.log('health-check: starting');
console.log('node:', process.version);

if (!exists(pkgPath)) {
  console.error('ERROR: package.json not found');
  process.exit(2);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
console.log('package name:', pkg.name || '(unknown)');
console.log('scripts count:', Object.keys(pkg.scripts || {}).length);

if (!exists(lockPath)) {
  console.warn('WARNING: pnpm-lock.yaml not found — install may not be reproducible');
} else {
  console.log('pnpm-lock.yaml: present');
}

// Quick sanity checks (non-fatal warnings)
if (!pkg.devDependencies || Object.keys(pkg.devDependencies).length === 0) {
  console.warn('WARNING: no devDependencies declared');
}

// Ensure Vite is available as a developer dependency (common for local dev flows)
if (!pkg.devDependencies || !pkg.devDependencies.vite) {
  console.warn('WARNING: `vite` not found in devDependencies — `pnpm dev` may fail');
}

console.log('health-check: OK');
process.exit(0);
