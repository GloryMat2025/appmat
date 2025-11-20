#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');

function die(msg) { console.error(msg); process.exit(1); }

const args = process.argv.slice(2);
let inputJson;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--inputJson' || args[i] === '-i') inputJson = args[i+1];
}

let projRef = process.env.SUPABASE_PROJECT_REF;
let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let vapidPub = process.env.VAPID_PUBLIC_KEY;
let vapidPriv = process.env.VAPID_PRIVATE_KEY;
const githubUpdate = (process.env.GITHUB_UPDATE_SECRETS || '').toLowerCase() === 'true';
let repo = process.env.GITHUB_REPO;

if (inputJson) {
  if (!fs.existsSync(inputJson)) die(`Input JSON not found: ${inputJson}`);
  try {
    const json = JSON.parse(fs.readFileSync(inputJson, 'utf8'));
    projRef = projRef || json.project_ref;
    serviceKey = serviceKey || json.service_role_key;
    vapidPub = vapidPub || json.vapid_public_key;
    vapidPriv = vapidPriv || json.vapid_private_key;
    repo = repo || json.github_repo;
  } catch (e) { die('Failed to parse JSON: ' + e.message); }
}

if (!projRef || !serviceKey || !vapidPub || !vapidPriv) {
  die('Missing required values. Provide via environment variables or JSON file. Required: SUPABASE_PROJECT_REF, SUPABASE_SERVICE_ROLE_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY');
}

console.log(`Updating Supabase secrets for project ${projRef}...`);
try {
  const cmd = `npx supabase secrets set --project-ref ${projRef} SERVICE_ROLE_KEY=\"${serviceKey}\" VAPID_PUBLIC_KEY=\"${vapidPub}\" VAPID_PRIVATE_KEY=\"${vapidPriv}\"`;
  console.log(cmd);
  execSync(cmd, { stdio: 'inherit' });
} catch (e) {
  die('Failed to run supabase CLI. Ensure npx supabase is installed and authenticated. ' + e.message);
}

if (githubUpdate) {
  if (!repo) {
    // try to get repo from git
    try { repo = execSync('git rev-parse --abbrev-ref --symbolic-full-name @{u}', { encoding: 'utf8' }).trim(); } catch (e) {}
  }
  if (!repo) die('GitHub repo not provided. Set GITHUB_REPO env var (owner/repo) or include in JSON file.');

  console.log(`Updating GitHub secrets for ${repo}...`);
  try {
    execSync(`gh secret set SUPABASE_SERVICE_ROLE_KEY --repo ${repo} --body "${serviceKey}"`, { stdio: 'inherit' });
    execSync(`gh secret set VAPID_PUBLIC_KEY --repo ${repo} --body "${vapidPub}"`, { stdio: 'inherit' });
    execSync(`gh secret set VAPID_PRIVATE_KEY --repo ${repo} --body "${vapidPriv}"`, { stdio: 'inherit' });
  } catch (e) { die('Failed to update GitHub secrets. Ensure gh CLI is authenticated and available. ' + e.message); }
}

console.log('Done. Remember to revoke any exposed/old keys via the Supabase dashboard.');
