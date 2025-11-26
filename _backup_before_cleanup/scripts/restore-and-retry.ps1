# restore-and-retry.ps1
$ErrorActionPreference = "Stop"

Write-Host "🔁 Restoring previous package.json and retrying full pipeline..." -ForegroundColor Cyan

# === Step 1: Find latest backup ===
$backup = Get-ChildItem -Path . -Filter "package.json.bak.*.json" |
  Sort-Object LastWriteTime -Descending | Select-Object -First 1

if (-not $backup) {
  Write-Host "❌ No package.json.bak.*.json found. Nothing to restore." -ForegroundColor Red
  exit 1
}

Write-Host "📦 Restoring from backup: $($backup.Name)" -ForegroundColor Yellow
Copy-Item -Path $backup.FullName -Destination "package.json" -Force

# === Step 2: Commit & push rollback ===
git add package.json
git commit -m "revert: restore from backup $($backup.Name)" | Out-Null
git push

# === Step 3: Retry orchestrator ===
Write-Host "🚀 Running auto-fix-orchestrator.ps1 after rollback..." -ForegroundColor Cyan
& ./auto-fix-orchestrator.ps1
