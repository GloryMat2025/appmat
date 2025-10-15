#!/usr/bin/env node
// rev-assets.mjs
// Content-hash CSS/JS (EXCLUDING service workers) and rewrite HTML references into ./dist
// Usage: node rev-assets.mjs ./public ./dist
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const srcDir = path.resolve(process.argv[2] || './public');
const outDir = path.resolve(process.argv[3] || './dist');

const HASH_EXTS = new Set(['.css', '.js']);
const HASH_LEN = 8;

// Exclude service workers and any explicitly ignored files from hashing
const EXCLUDE_HASH = [
  /^sw\.js$/i,
  /^service-worker\.js$/i,
  /^workbox.*\.js$/i
];

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function digest(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex').slice(0, HASH_LEN);
}

function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else if (ent.isFile()) out.push(p);
  }
  return out;
}

function relFrom(base, p) {
  return p.replace(base + path.sep, '').split(path.sep).join('/');
}

function shouldHash(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!HASH_EXTS.has(ext)) return false;
  const base = path.basename(filePath);
  return !EXCLUDE_HASH.some(rx => rx.test(base));
}

function rewriteHtml(html, mapping) {
  // Replace href/src for css/js only; keep other assets untouched
  return html.replace(/(href|src)=["']([^"']+\.(?:css|js))["']/g, (m, attr, url) => {
    // normalize, strip query/hash
    const clean = url.split('?')[0].split('#')[0];
    const newUrl = mapping.get(clean) || mapping.get(clean.replace(/^\//, '')) || url;
    return `${attr}="${newUrl}"`;
  });
}

function main() {
  console.log(`Reving assets from ${srcDir} -> ${outDir}`);
  if (!fs.existsSync(srcDir)) {
    console.error('Source dir not found:', srcDir);
    process.exit(1);
  }
  ensureDir(outDir);

  // 1) Copy everything to dist as-is
  for (const p of walk(srcDir)) {
    const rel = relFrom(srcDir, p);
    const dest = path.join(outDir, rel);
    ensureDir(path.dirname(dest));
    fs.copyFileSync(p, dest);
  }

  // 2) Hash selected files and build mapping
  const mapping = new Map();
  for (const p of walk(outDir)) {
    if (!shouldHash(p)) continue;
    const buf = fs.readFileSync(p);
    const h = digest(buf);
    const dir = path.dirname(p);
    const ext = path.extname(p);
    const base = path.basename(p, ext);
    const hashedName = `${base}.${h}${ext}`;
    const newPath = path.join(dir, hashedName);
    fs.renameSync(p, newPath);

    const relOld = relFrom(outDir, p);
    const relNew = relFrom(outDir, newPath);
    // Support absolute or relative references
    mapping.set('/' + relOld, '/' + relNew);
    mapping.set(relOld, '/' + relNew);
  }

  // 3) Rewrite HTML in dist
  for (const p of walk(outDir)) {
    if (!p.endsWith('.html')) continue;
    const html = fs.readFileSync(p, 'utf-8');
    const out = rewriteHtml(html, mapping);
    fs.writeFileSync(p, out);
  }

  // 4) Write manifest
  fs.writeFileSync(path.join(outDir, 'rev-manifest.json'), JSON.stringify(Object.fromEntries(mapping), null, 2));
  console.log('✅ Done. Wrote rev-manifest.json');
}

main();
