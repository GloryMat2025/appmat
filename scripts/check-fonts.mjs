#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const fontRel = 'docs/fonts/Roboto-Regular.ttf';
const fontPath = path.resolve(fontRel);

console.log(`Checking for vendored font: ${fontRel}`);
if (fs.existsSync(fontPath)) {
  try {
    const { createHash } = await import('crypto');
    const buf = fs.readFileSync(fontPath);
    const sha = createHash('sha256').update(buf).digest('hex');
    console.log(`Found: ${fontPath}`);
    console.log(`Size: ${buf.length} bytes`);
    console.log(`SHA256: ${sha}`);
    process.exit(0);
  } catch (e) {
    console.error('Error reading font file:', e && e.message ? e.message : e);
    process.exit(3);
  }
} else {
  console.error(`Missing vendored font at ${fontRel}`);
  console.error('To reproduce deterministic exports, add Roboto-Regular.ttf to that path.');
  console.error('You can obtain Roboto from Google Fonts (ensure license compliance) or copy from a system installation.');
  console.error('Example (POSIX):');
  console.error('  mkdir -p docs/fonts && curl -L -o docs/fonts/Roboto-Regular.ttf <url-to-roboto-ttf>');
  console.error('Example (Windows PowerShell):');
  console.error('  mkdir docs\\fonts; Invoke-WebRequest -OutFile docs\\fonts\\Roboto-Regular.ttf -Uri <url-to-roboto-ttf>');
  process.exit(2);
}
