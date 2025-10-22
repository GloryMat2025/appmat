#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {execSync} from 'child_process';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function usage() {
  console.log('Usage: node scripts/mock-shots.mjs --label=<label> --count=<n>');
}

const argv = Object.fromEntries(process.argv.slice(2).map(a => {
  const m = a.match(/^--([^=]+)=(.*)$/);
  return m ? [m[1], m[2]] : [a.replace(/^--/, ''), true];
}));

const label = argv.label || 'local';
const count = Math.max(1, parseInt(argv.count || '3', 10));

const ts = new Date().toISOString().replace(/[:.]/g, '-');
const runDir = path.join(process.cwd(), 'shots', `${label}-${ts}`);
fs.mkdirSync(runDir, {recursive: true});

console.log(`Creating mock shots in ${runDir} (count=${count})`);

// create placeholder images
for (let i = 0; i < count; i++) {
  const fname = path.join(runDir, `page-${i+1}.png`);
  // tiny 1x1 PNG binary (transparent)
  const png1x1 = Buffer.from(
    '89504e470d0a1a0a0000000d4948445200000001000000010806000000' +
    '1f15c4890000000a49444154789c6300000002000100' +
    '05fe02fea10000000049454e44ae426082', 'hex');
  fs.writeFileSync(fname, png1x1);
}

// create gallery entry (page.png fallback)
const fallback = path.join(runDir, 'page.png');
if (!fs.existsSync(fallback)) {
  fs.copyFileSync(path.join(runDir, 'page-1.png'), fallback);
}

// create a simple trace zip placeholder
const zipName = path.join(runDir, 'trace.zip');
const output = fs.createWriteStream(zipName);
const archive = archiver('zip');
output.on('close', () => {
  console.log(`Created ${zipName} (${archive.pointer()} bytes)`);
});
archive.pipe(output);
archive.append('mock trace', {name: 'trace.txt'});
archive.finalize();

// also create a top-level zip for the run for compatibility with zip-latest
const topZip = path.join(process.cwd(), 'shots', `shots-${label}-${ts}.zip`);
await new Promise((res, rej) => {
  const out = fs.createWriteStream(topZip);
  const a = archiver('zip');
  out.on('close', res);
  a.on('error', rej);
  a.pipe(out);
  a.directory(runDir, `${label}-${ts}`);
  a.finalize();
});

console.log('mock-shots: done');
