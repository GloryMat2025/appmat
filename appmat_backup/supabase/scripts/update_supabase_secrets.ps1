<#
PowerShell helper to update Supabase project secrets and GitHub Actions secrets.

USAGE (interactive):
  Open PowerShell, cd to repo root, then run:
    powershell -NoProfile -ExecutionPolicy Bypass -File .\supabase\scripts\update_supabase_secrets.ps1

This script will:
 - Prompt you for the Supabase project ref (or you can paste it),
 - Prompt for new SERVICE_ROLE_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY (secure input),
 - Optionally update Supabase secrets via `npx supabase secrets set` (requires Supabase CLI auth),
 - Optionally update GitHub repository secrets via `gh secret set` (requires GitHub CLI auth).

Important: This script does not store secrets in the repository.
#>

param(
  [string]$InputJson
)

function Read-Secret([string]$prompt) {
  $secure = Read-Host -AsSecureString -Prompt $prompt
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

Write-Host "Supabase Secrets Updater" -ForegroundColor Cyan

# Support non-interactive mode via environment variables or an optional JSON file.
# Environment variables checked: SUPABASE_PROJECT_REF, SUPABASE_SERVICE_ROLE_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY

$envProjRef = $env:SUPABASE_PROJECT_REF
$envServiceKey = $env:SUPABASE_SERVICE_ROLE_KEY
$envVapidPub = $env:VAPID_PUBLIC_KEY
$envVapidPriv = $env:VAPID_PRIVATE_KEY

if ($InputJson) {
  if (-Not (Test-Path $InputJson)) { Write-Host "Input JSON file not found: $InputJson"; exit 1 }
  $json = Get-Content $InputJson -Raw | ConvertFrom-Json
  $envProjRef = $json.project_ref
  $envServiceKey = $json.service_role_key
  $envVapidPub = $json.vapid_public_key
  $envVapidPriv = $json.vapid_private_key
}

if ($envProjRef -and $envServiceKey -and $envVapidPub -and $envVapidPriv) {
  Write-Host "Non-interactive mode: using environment variables or provided JSON file." -ForegroundColor Yellow
  $projRef = $envProjRef
  $serviceKey = $envServiceKey
  $vapidPub = $envVapidPub
  $vapidPriv = $envVapidPriv
  $interactive = $false
} else {
  # Interactive fallback
  $projRef = Read-Host "Enter Supabase project ref (e.g. qtoiur...)"
  if (-not $projRef) { Write-Host "No project ref provided, aborting."; exit 1 }

  $serviceKey = Read-Secret "Enter new SERVICE_ROLE_KEY (input hidden)"
  $vapidPub = Read-Secret "Enter new VAPID_PUBLIC_KEY (input hidden)"
  $vapidPriv = Read-Secret "Enter new VAPID_PRIVATE_KEY (input hidden)"

  Write-Host "\nYou entered values for project ref and keys. About to update Supabase project secrets and GitHub secrets. Proceed? (y/n)" -NoNewline
  $ok = Read-Host
  if ($ok -ne 'y') { Write-Host 'Aborted by user.'; exit 0 }
  $interactive = $true
}

# Update Supabase project secrets using supabase CLI (npx supabase)
Write-Host "Updating Supabase project secrets..." -ForegroundColor Yellow
$cmd = "npx supabase secrets set --project-ref $projRef SERVICE_ROLE_KEY=\"$serviceKey\" VAPID_PUBLIC_KEY=\"$vapidPub\" VAPID_PRIVATE_KEY=\"$vapidPriv\""
Write-Host "Running: $cmd"
try {
  Invoke-Expression $cmd
} catch {
  Write-Host "Failed to run supabase CLI: $_" -ForegroundColor Red
  if (-not $interactive) { exit 1 }
}

# Update GitHub secrets (optional) — in non-interactive mode we'll skip unless GH env var is present
if ($interactive) {
  $pushGh = Read-Host "Update GitHub Actions secrets for this repo? (y/n)"
} else {
  $pushGh = $env:GITHUB_UPDATE_SECRETS
}

if ($pushGh -eq 'y' -or $pushGh -eq 'true') {
  Write-Host "Updating GitHub secrets (requires 'gh' CLI authenticated)..." -ForegroundColor Yellow
  # Determine repo based on git config
  $repo = git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>$null
  if (-not $repo) {
  Write-Host "Could not determine upstream repo. Please enter owner/repo (e.g. me/appmat):"
  $repo = Read-Host
  }
  if (-not $repo) { Write-Host "No repo provided, skipping GitHub secret updates."; exit 0 }

  gh secret set SUPABASE_SERVICE_ROLE_KEY --repo $repo --body $serviceKey
  gh secret set VAPID_PUBLIC_KEY --repo $repo --body $vapidPub
  gh secret set VAPID_PRIVATE_KEY --repo $repo --body $vapidPriv
  Write-Host "GitHub secrets updated for $repo" -ForegroundColor Green
}

Write-Host "Done. Remember to rotate any other credentials and verify services." -ForegroundColor Green
