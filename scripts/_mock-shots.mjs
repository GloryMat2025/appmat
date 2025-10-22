#!/usr/bin/env node
import {spawnSync} from 'child_process';
import path from 'path';
const script = path.join(process.cwd(), 'scripts', 'mock-shots.mjs');
const res = spawnSync(process.execPath, [script, ...process.argv.slice(2)], {stdio: 'inherit'});
process.exit(res.status);
