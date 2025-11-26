# rollback.ps1
$ErrorActionPreference = "Stop"
Write-Host "🔁 Starting rollback..." -ForegroundColor Cyan

# Find latest backup
$backup = Get-ChildItem -Path . -Filter "package.json.bak.*.json" |
  Sort-Object LastWriteTime -Descending | Select-Object -First 1

if (-not $backup) {
  Write-Host "❌ No backup package.json.bak.*.json found." -ForegroundColor Red
  exit 1
}

Write-Host "📦 Restoring from backup: $($backup.Name)" -ForegroundColor Yellow

Copy-Item -Path $backup.FullName -Destination "package.json" -Force
git add package.json
git commit -m "revert: restore package.json from backup ($($backup.Name))" | Out-Null
git push

Write-Host "✅ Rollback complete — restored $($backup.Name) and pushed commit." -ForegroundColor Green
