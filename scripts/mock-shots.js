#!/usr/bin/env node
const cp = require('child_process');
const path = require('path');
const script = path.join(__dirname, 'mock-shots.mjs');
const args = process.argv.slice(2);
const node = process.execPath;
const res = cp.spawnSync(node, [script, ...args], { stdio: 'inherit' });
process.exit(res.status);
