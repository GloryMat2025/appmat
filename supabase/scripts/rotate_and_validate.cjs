#!/usr/bin/env node
// rotate_and_validate.cjs
// Read a local secrets JSON (untracked), set GitHub & Supabase secrets via CLI,
// run the relay smoke-test, and report validation results.

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd, args, opts={}){
  const r = spawnSync(cmd, args, Object.assign({ stdio: 'pipe', encoding: 'utf8' }, opts));
  return { status: r.status, stdout: r.stdout && r.stdout.toString(), stderr: r.stderr && r.stderr.toString() };
}

function safeLog(msg){ console.log(msg); }

const argv = require('minimist')(process.argv.slice(2));
const input = argv.input || argv.i || 'supabase/secrets.json';
const repo = argv.repo || process.env.GH_REPO || 'GloryMat2025/appmat';
const projectRef = argv.projectRef || argv.project || argv.p || process.env.SUPABASE_PROJECT_REF || '';

if (!fs.existsSync(input)){
  console.error('Input file not found:', input);
  process.exit(2);
}

const data = JSON.parse(fs.readFileSync(input, 'utf8'));

// Set GitHub secrets
safeLog(`Setting ${Object.keys(data).length} GitHub secret(s) to repo ${repo} (values not echoed).`);
for (const [k,v] of Object.entries(data)){
  try{
    const r = run('gh', ['secret','set',k,'--repo',repo,'--body',v]);
    if (r.status !== 0){
      console.error(`gh secret set ${k} failed:`, r.stderr || r.stdout || r.status);
    } else {
      safeLog(`gh secret set ${k} ✓`);
    }
  }catch(e){ console.error('gh command failed (is gh CLI installed and authenticated?):', e.message || e); }
}

// Set Supabase secrets (if CLI available and projectRef provided)
if (projectRef){
  safeLog(`Setting Supabase secrets for project-ref ${projectRef}`);
  for (const [k,v] of Object.entries(data)){
    try{
      // npx supabase secrets set KEY="value" --project-ref <ref>
      const arg = `${k}=${v}`;
      // Put --project-ref before the arg to avoid CLI parsing surprises
      const r = run('npx', ['-y','supabase','secrets','set','--project-ref',projectRef,arg]);
      if (r.status !== 0){
        console.error(`supabase secrets set ${k} failed (exit ${r.status}):`);
        if (r.stdout) console.error('stdout:', r.stdout.trim());
        if (r.stderr) console.error('stderr:', r.stderr.trim());
      } else {
        safeLog(`supabase secrets set ${k} ✓`);
        if (r.stdout) safeLog((r.stdout || '').trim());
      }
    }catch(e){ console.error('supabase CLI call failed (is supabase CLI installed and authenticated?):', e.message || e); }
  }
} else {
  safeLog('No Supabase project-ref provided; skipping supabase secrets set. Pass --projectRef <ref> to enable.');
}

// Run smoke-test (Node) for the relay if present
// `rotate_and_validate.cjs` is in `supabase/scripts`, so the relay is at `../tools/push-relay`
const smokePath = path.join(__dirname,'..','tools','push-relay','smoke-test.js');
if (fs.existsSync(smokePath)){
  safeLog('Running relay smoke-test (Node) ...');
  const r = run('node',[smokePath],{ cwd: path.dirname(smokePath) });
  process.stdout.write(r.stdout || '');
  process.stderr.write(r.stderr || '');
  if (r.status === 0) safeLog('Smoke-test completed ✓'); else safeLog('Smoke-test exited with status ' + r.status);
} else {
  safeLog('smoke-test.js not found; skipping smoke-test.');
}

// List GitHub secrets as validation (names only)
safeLog('Listing GitHub secrets for repo ' + repo + ' ...');
try{
  const r = run('gh',['secret','list','--repo',repo]);
  if (r.status === 0){
    safeLog('GitHub secrets:');
    process.stdout.write(r.stdout || '');
  } else {
    console.error('gh secret list failed:', r.stderr || r.stdout || r.status);
  }
}catch(e){ console.error('gh CLI unavailable for listing secrets:', e.message || e); }

// Optionally list Supabase secrets
if (projectRef){
  safeLog('Listing Supabase secrets (names/digests) for project-ref ' + projectRef + ' ...');
  try{
    const r = run('npx',['-y','supabase','secrets','list','--project-ref',projectRef]);
    if (r.status === 0){ process.stdout.write(r.stdout || ''); }
    else console.error('supabase secrets list failed:', r.stderr || r.stdout || r.status);
  }catch(e){ console.error('supabase CLI unavailable for listing secrets:', e.message || e); }
}

safeLog('rotate_and_validate finished. If you rotated the exposed Service Role Key in the Supabase UI, verify that old key is revoked in the dashboard now.');

// Diagnostic guard: detect problematic secret values that can break CLI parsing
for (const [k,v] of Object.entries(data)){
  if (/\r|\n/.test(String(v))) {
    console.error(`DEBUG: secret ${k} contains ${String(v).split(/\r?\n/).length - 1} newline(s) — may break supabase CLI when passed inline.`);
    console.error('DEBUG sample:', String(v).slice(0, 120).replace(/\r?\n/g, '\\n'), '... (truncated)');
  }
}
