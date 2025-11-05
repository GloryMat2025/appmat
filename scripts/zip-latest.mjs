#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

function ts() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

const shotsDir = path.resolve(process.cwd(), 'shots');
if (!fs.existsSync(shotsDir)) {
  console.error('No shots/ directory present. Nothing to zip.');
  process.exit(1);
}

// find newest shots subdir by creation time
const children = fs
  .readdirSync(shotsDir)
  .map((name) => ({
    name,
    stat: fs.statSync(path.join(shotsDir, name)),
  }))
  .filter((x) => x.stat.isDirectory());

if (children.length === 0) {
  console.error('No shot directories found under shots/.');
  process.exit(1);
}

children.sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);
const newest = children[0].name;
const src = path.join(shotsDir, newest);

const outName = `shots-${newest}.zip`;
const outPath = path.join(shotsDir, outName);

console.log('Zipping', src, '->', outPath);
const output = fs.createWriteStream(outPath);
const archive = archiver('zip', { zlib: { level: 9 } });
output.on('close', () => console.log('Created', outPath, archive.pointer(), 'bytes'));
archive.on('error', (err) => {
  throw err;
});
archive.pipe(output);
archive.directory(src, false);
archive.finalize();
