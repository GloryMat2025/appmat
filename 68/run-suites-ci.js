#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const AUTH_COOKIE = process.env.AUTH_COOKIE || '';
const TENANT_OVERRIDE = process.env.TENANT || ''; // optional forced tenant

const suitesDir = path.resolve('public/config/suites');
const files = fs.readdirSync(suitesDir).filter(f => f.endsWith('.json'));
if (files.length === 0){
  console.log('No suites found at', suitesDir);
  process.exit(0);
}

fs.mkdirSync('artifacts', { recursive: true });

for (const f of files){
  const suite = JSON.parse(fs.readFileSync(path.join(suitesDir, f),'utf-8'));
  const OUTLETS = (suite.outlets||[]).join(',');
  const MODES = (suite.modes||[]).join(',');
  const SKUSETS = (suite.skuSets||[]).map(g => g.join(',')).join(';');
  const EXPECT = suite.expected ? JSON.stringify(suite.expected) : '';
  const START_ISO = suite.startISO;
  const DURATION = String(suite.duration || 30);
  const TENANT = TENANT_OVERRIDE || (suite.tenant || '');
  const baseEnv = {
    BASE_URL: BASE,
    START_ISO,
    OUTLETS,
    MODES,
    SKUSETS,
    DURATION,
    JUNIT_OUT: `artifacts/${suite.name || f.replace(/\.json$/,'')}-junit.xml`,
  };
  if (EXPECT) baseEnv.EXPECT = EXPECT;
  if (TENANT) baseEnv.TENANT = TENANT;
  if (AUTH_COOKIE) baseEnv.AUTH_COOKIE = AUTH_COOKIE;

  console.log('Running suite', f, 'with env:', baseEnv);
  const res = spawnSync('node', ['server/tools/synthetic-validate.js'], {
    stdio: 'inherit',
    env: { ...process.env, ...baseEnv }
  });
  if (res.status !== 0){
    console.error('Suite failed:', f);
    process.exit(res.status || 1);
  }
  // move CSV to artifacts
  const csvSrc = path.resolve('synthetic-slot-tests.csv');
  const csvDst = path.resolve('artifacts', `${suite.name || f.replace(/\.json$/,'')}-results.csv`);
  if (fs.existsSync(csvSrc)) fs.renameSync(csvSrc, csvDst);
}

console.log('All suites completed. Artifacts in ./artifacts');
