# Supabase secret rotation and updater

This file documents how to rotate Supabase project secrets and update GitHub Actions secrets for this repository. Do NOT commit secret values; use the local template or environment variables.

Quick overview

- **Interactive (PowerShell)**: run `supabase/scripts/update_supabase_secrets.ps1` and paste secrets securely when prompted.
- **Non-interactive (Node/cmd or PowerShell)**: create a local `supabase/secrets.json` (from `secrets.json.template`) and run `node supabase/scripts/update_supabase_secrets.cjs --inputJson .\supabase\secrets.json`.

Pre-flight checklist

- **Rotate exposed keys immediately**: Visit the Supabase dashboard and revoke any exposed Service Role Key: https://app.supabase.com/project/qtoiurlefwodxjcichgz/settings/api
- **Authenticate CLIs**:
  - Supabase CLI: `npx supabase login` (browser flow)
  - GitHub CLI: `gh auth login` (if you will update repo secrets)
- **Run from repo root**: `C:\Users\DESIGNER 1\Desktop\appmat`

## Interactive (PowerShell)

1. Open PowerShell and run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\supabase\scripts\update_supabase_secrets.ps1
```

2. Follow prompts: provide project ref (example: `qtoiurlefwodxjcichgz`) and paste the new secret values when prompted (input is hidden). Choose whether to update GitHub Actions secrets.

## Non-interactive (Node) using `secrets.json`

1. Copy the template locally and edit (DO NOT commit):

```powershell
Copy-Item .\supabase\secrets.json.template .\supabase\secrets.json
code .\supabase\secrets.json    # paste your SERVICE_ROLE_KEY into the file
```

2. Run the Node updater (uses `npx supabase` and `gh`):

```powershell
node .\supabase\scripts\update_supabase_secrets.cjs --inputJson .\supabase\secrets.json
```

Or set environment variables (example, cmd.exe):

```cmd
set SUPABASE_PROJECT_REF=qtoiurlefwodxjcichgz
set SUPABASE_SERVICE_ROLE_KEY=<NEW_SERVICE_ROLE_KEY>
set VAPID_PUBLIC_KEY=<VAPID_PUB>
set VAPID_PRIVATE_KEY=<VAPID_PRIV>
set GITHUB_UPDATE_SECRETS=true
set GITHUB_REPO=GloryMat2025/appmat
node supabase\scripts\update_supabase_secrets.cjs
```

## VAPID keys

- The repo includes a generator at `supabase/scripts/generate_vapid.cjs` and generated keys are stored in `.temp/vapid.json` (git-ignored). Use these values or generate new ones.

## Verification & cleanup

- Confirm Supabase secrets: check Supabase dashboard or run any smoke tests that rely on the new keys.
- Confirm GitHub secrets (if pushed):

```bash
gh secret list --repo GloryMat2025/appmat
```

- Remove local secrets file after use:

PowerShell:

```powershell
Remove-Item .\supabase\secrets.json
```

cmd:

```cmd
del supabase\secrets.json
```

## Security notes

- Do NOT paste secrets into chat or commit them to git.
- Treat any previously exposed key as compromised until revoked in the Supabase dashboard.
- Use GitHub Actions secrets for CI access; avoid committing runtime secrets to the repository.

If you need help running the updater or interpreting errors, run the command locally and paste only the error messages (do NOT include secret values) here and I will help troubleshoot.
