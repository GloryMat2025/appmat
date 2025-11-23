// scripts/fix-unused.js
// Safe, idempotent edits to declare missing vars and normalize unused params.
// Run with: node scripts\fix-unused.js

const fs = require('fs');
const path = require('path');

function read(p) {
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
}
function write(p, s) {
  fs.writeFileSync(p, s, 'utf8');
  console.log('patched', p);
}

function applyReplacements(file, replacers) {
  const p = path.join(process.cwd(), file);
  const src = read(p);
  if (!src) {
    console.warn('missing', file);
    return;
  }
  let out = src;
  replacers.forEach((r) => {
    if (r.type === 'regex') out = out.replace(r.from, r.to);
    else out = out.split(r.from).join(r.to);
  });
  if (out !== src) write(p, out);
  else console.log('no-change', file);
}

// 1) Declare missing vars in scripts/rebuild-esbuild.js
const rebuild = 'scripts/rebuild-esbuild.js';
let s = read(rebuild);
if (s && !/\blet\s+serialized\b/.test(s)) {
  s = s.replace(/(try\s*\{)/, 'let serialized; let local;\n$1');
  write(rebuild, s);
} else {
  if (s) console.log('rebuild already fixed');
}

// Common catch replacers
const catchReplacers = [
  { type: 'regex', from: /catch\s*\(\s*err\s*\)\s*\{/g, to: 'catch (_err) { void _err;' },
  { type: 'regex', from: /catch\s*\(\s*error\s*\)\s*\{/g, to: 'catch (_error) { void _error;' },
  { type: 'regex', from: /catch\s*\(\s*e\s*\)\s*\{/g, to: 'catch (_e) { void _e;' },
];

// Apply to files that showed warnings/errors
[
  'src/context/CartContext.jsx',
  'supabase/scripts/integration_notify_test.js',
  'supabase/tools/push-relay/logger.js',
  'supabase/tools/push-relay/smoke-test.js',
].forEach((file) => applyReplacements(file, catchReplacers));

// Checkout component: mark unused prop as intentionally unused
const checkout = 'src/components/Checkout.jsx';
s = read(checkout);
if (s) {
  s = s.replace(/\{\s*removeFromCart\s*\}/g, '{ removeFromCart: _removeFromCart }');
  s = s.replace(/,\s*removeFromCart(?=(\s*[},]))/g, ', removeFromCart: _removeFromCart');
  write(checkout, s);
}

// push-relay index: prefix a few unused locals
const indexReal = 'supabase/tools/push-relay/index.real.js';
s = read(indexReal);
if (s) {
  s = s.replace(/\bRELAY_TOKENS\b/g, '_RELAY_TOKENS');
  s = s.replace(/\blet\s+ts\s*=/g, 'let _ts =');
  s = s.replace(/\blet\s+token\s*=/g, 'let _token =');
  write(indexReal, s);
}

console.log('fix-unused: done');
