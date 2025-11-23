// scripts/fix-unused.js
// Safe, idempotent edits: declare missing vars and normalize unused params to underscore-prefixed.
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

function replaceAll(s, from, to) {
  return s.split(from).join(to);
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
    else out = replaceAll(out, r.from, r.to);
  });

  if (out !== src) write(p, out);
  else console.log('no-change', file);
}

// 1) scripts/rebuild-esbuild.js: declare serialized/local above try
const rebuild = 'scripts/rebuild-esbuild.js';
let s = read(rebuild);
if (s) {
  // Only insert once
  if (!/let\s+serialized\b/.test(s)) {
    s = s.replace(/(\btry\s*\{)/, 'let serialized; let local;\n$1');
    write(rebuild, s);
  } else {
    console.log('rebuild already fixed');
  }
}

// Common catch replacers
const catchReplacers = [
  { type: 'regex', from: /catch\s*\(\s*err\s*\)\s*\{/g, to: 'catch (_err) { void _err;' },
  { type: 'regex', from: /catch\s*\(\s*error\s*\)\s*\{/g, to: 'catch (_error) { void _error;' },
  { type: 'regex', from: /catch\s*\(\s*e\s*\)\s*\{/g, to: 'catch (_e) { void _e;' },
];

// Files to normalize
[
  'src/context/CartContext.jsx',
  'supabase/scripts/integration_notify_test.js',
  'supabase/tools/push-relay/logger.js',
  'supabase/tools/push-relay/smoke-test.js',
].forEach((file) => {
  applyReplacements(file, catchReplacers);
});

// src/components/Checkout.jsx: rename unused prop
const checkout = 'src/components/Checkout.jsx';
s = read(checkout);
if (s) {
  // common patterns: function Checkout({ removeFromCart, ... }) or ({ cart, removeFromCart, ...
  // Replace simple "{ removeFromCart }" and "removeFromCart," with underscore variant
  s = s.replace(/\{\s*removeFromCart\s*\}/g, '{ removeFromCart: _removeFromCart }');
  s = s.replace(/,\s*removeFromCart(?=(\s*[},]))/g, ', removeFromCart: _removeFromCart');
  // replace destructured with default param left alone otherwise
  write(checkout, s);
}

// supabase/tools/push-relay/index.real.js: prefix unused vars if still present
const indexReal = 'supabase/tools/push-relay/index.real.js';
s = read(indexReal);
if (s) {
  s = s.replace(/\bRELAY_TOKENS\b/g, '_RELAY_TOKENS');
  s = s.replace(/\blet\s+ts\s*=/g, 'let _ts =');
  s = s.replace(/\blet\s+token\s*=/g, 'let _token =');
  write(indexReal, s);
}

console.log('done');
