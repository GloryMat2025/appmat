#!/usr/bin/env node
/**
 * promote-to-branch.js
 * Updates a suite's `expected` from the latest saved report (merge or replace),
 * commits the change on a new branch.
 *
 * Env/args:
 *   SUITE=example            # suite name (without .json)
 *   MODE=merge|replace       # default: replace
 *   BRANCH=promote/example-YYYYmmdd-HHMMSS
 *   GIT_AUTHOR_NAME / GIT_AUTHOR_EMAIL (optional)
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

function sh(cmd){
  return execSync(cmd, { stdio: 'inherit' });
}

const SUITE = process.env.SUITE || process.argv[2];
if (!SUITE){ console.error('SUITE is required'); process.exit(2); }
const MODE = (process.env.MODE || process.argv[3] || 'replace').toLowerCase();
const now = new Date();
const stamp = now.toISOString().replace(/[:.]/g,'-').slice(0,19);
const BRANCH = process.env.BRANCH || `promote/${SUITE}-${MODE}-${stamp}`;

const suitesDir = path.resolve('public/config/suites');
const reportsDir = path.resolve('public/config/suites/reports');
const suitePath = path.join(suitesDir, SUITE.endsWith('.json')? SUITE : `${SUITE}.json`);
const lastPath = path.join(reportsDir, `${SUITE}-last.json`);

if (!fs.existsSync(suitePath)) { console.error('Suite not found:', suitePath); process.exit(2); }
if (!fs.existsSync(lastPath)) { console.error('No last report:', lastPath); process.exit(2); }

const suite = JSON.parse(fs.readFileSync(suitePath,'utf-8'));
const last = JSON.parse(fs.readFileSync(lastPath,'utf-8'));

const fromLast = {};
(last.rows||[]).forEach(r => {
  const key = `${r.outlet}|${r.mode}|${String(r.skus||'').split('|').sort().join('+')}`;
  fromLast[key] = !!r.ok;
});
const before = suite.expected || {};
let after = (MODE==='merge') ? { ...before } : {};

for (const [k,v] of Object.entries(fromLast)){
  if (!(k in after)) after[k] = v;
  else if (after[k] !== v) after[k] = v;
}
if (MODE!=='merge'){
  for (const k of Object.keys(before)){ if (!(k in fromLast)) delete after[k]; }
}

suite.expected = after;
fs.writeFileSync(suitePath, JSON.stringify(suite, null, 2));

// git branch + commit (no push here; workflow will push)
try { sh('git config user.name "${GIT_AUTHOR_NAME:-ci-bot}"'); } catch {}
try { sh('git config user.email "${GIT_AUTHOR_EMAIL:-ci-bot@example.com}"'); } catch {}
sh(`git checkout -b ${BRANCH}`);
sh(`git add ${suitePath}`);
sh(`git commit -m "Promote expected for ${SUITE} (${MODE}) from last report"`);

console.log('Branch prepared:', BRANCH);
console.log('Owners:', suite.owners || []);
console.log('Reviewers:', suite.reviewers || []);

// write reviewers metadata for workflow step
fs.mkdirSync('.tmp', { recursive: true });
fs.writeFileSync('.tmp/promote-meta.json', JSON.stringify({
  suite: SUITE, mode: MODE, branch: BRANCH,
  owners: suite.owners || [], reviewers: suite.reviewers || []
}, null, 2));
