#!/usr/bin/env node
import fs from 'fs';
import crypto from 'crypto';
import path from 'path';

function usage() {
  console.log('Usage: node scripts/verify-artifact.mjs <file> --sha <expected-sha256> [--size <expected-bytes>]');
  process.exit(2);
}

const argv = process.argv.slice(2);
if (argv.length < 1) usage();

const file = argv[0];
let expectedSha = null;
let expectedSize = null;
for (let i = 1; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--sha' && argv[i+1]) {
    expectedSha = argv[++i].toLowerCase();
    continue;
  }
  if (a === '--size' && argv[i+1]) {
    expectedSize = Number(argv[++i]);
    continue;
  }
}

if (!expectedSha) {
  console.error('Error: --sha <expected-sha256> is required');
  usage();
}

const fp = path.resolve(file);
if (!fs.existsSync(fp)) {
  console.error(`File not found: ${fp}`);
  process.exit(3);
}

const data = fs.readFileSync(fp);
const size = data.length;
const hash = crypto.createHash('sha256').update(data).digest('hex');

console.log(`file=${fp}`);
console.log(`size=${size}`);
console.log(`sha256=${hash}`);

let ok = true;
if (expectedSize != null) {
  if (Number.isNaN(expectedSize)) {
    console.warn('Invalid expected size provided, skipping size check');
  } else if (expectedSize !== size) {
    console.error(`Size mismatch: expected=${expectedSize} actual=${size}`);
    ok = false;
  }
}

if (expectedSha !== hash) {
  console.error(`SHA256 mismatch: expected=${expectedSha} actual=${hash}`);
  ok = false;
}

if (ok) {
  console.log('VERIFICATION: OK');
  process.exit(0);
} else {
  console.error('VERIFICATION: FAILED');
  process.exit(4);
}
