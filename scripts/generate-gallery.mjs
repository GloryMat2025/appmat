#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const filterArg = args.find(a => a.startsWith('--filter='));
const filter = filterArg ? filterArg.split('=')[1] : null;

const shotsDir = path.resolve(process.cwd(), 'shots');
if (!fs.existsSync(shotsDir)) {
  console.error('No shots/ directory present.');
  process.exit(1);
}

const dirs = fs.readdirSync(shotsDir).filter(n => fs.statSync(path.join(shotsDir, n)).isDirectory());
dirs.sort((a,b) => b.localeCompare(a));

const rows = [];
for (const d of dirs) {
  if (filter && !d.includes(filter)) continue;
  const img = fs.existsSync(path.join(shotsDir, d, 'page.png')) ? `./${d}/page.png` : null;
  if (!img) continue;
  rows.push({ dir: d, img });
}

const out = path.join(shotsDir, 'gallery.html');
const html = `<!doctype html>
<html>
<head><meta charset="utf-8"><title>Shots gallery</title></head>
<body>
<h1>Shots gallery${filter ? ` (filter: ${filter})` : ''}</h1>
<div style="display:flex;flex-wrap:wrap">${rows.map(r=>`<figure style="margin:8px"><img src="${r.img}" style="max-width:320px"><figcaption>${r.dir}</figcaption></figure>`).join('\n')}</div>
</body></html>`;
fs.writeFileSync(out, html, 'utf8');
console.log('Wrote', out, 'with', rows.length, 'items');
