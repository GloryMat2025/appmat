#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const keepDays = parseInt(process.env.KEEP_DAYS || '7', 10);
const cutoff = Date.now() - keepDays * 24 * 60 * 60 * 1000;

const targets = ['patches', 'backups', 'dist'];
const shotsDir = path.resolve(process.cwd(), 'shots');

function rmDirIfOld(p) {
  try {
    const stat = fs.statSync(p);
    if (stat.mtimeMs < cutoff) {
      // remove recursively
      fs.rmSync(p, { recursive: true, force: true });
      console.log('Removed', p);
    }
  } catch (e) { /* ignore */ }
}

for (const t of targets) {
  const p = path.resolve(process.cwd(), t);
  if (fs.existsSync(p)) rmDirIfOld(p);
}

if (fs.existsSync(shotsDir)) {
  for (const d of fs.readdirSync(shotsDir)) {
    if (!d.startsWith('local-')) continue;
    const p = path.join(shotsDir, d);
    rmDirIfOld(p);
  }
}

console.log('clean-temp: done');
