$ErrorActionPreference = "Stop"

Write-Host "🧩 Cleaning package.json..." -ForegroundColor Cyan
node scripts/fix-package.mjs

# find latest report
$report = Get-ChildItem -Path . -Filter "package-fix-report.*.json" |
  Sort-Object LastWriteTime -Descending | Select-Object -First 1

if (-not $report) {
  Write-Host "❌ No package-fix-report.*.json found." -ForegroundColor Red
  exit 1
}

Write-Host "📄 Using report: $($report.Name)" -ForegroundColor Yellow
$json = Get-Content $report.FullName | ConvertFrom-Json
$pkgs = @()
foreach ($k in $json.suggestions.PSObject.Properties.Name) {
  $v = $json.suggestions.$k
  if ($v) { $pkgs += "$k@$v" }
}

if ($pkgs.Count -gt 0) {
  Write-Host "📦 Installing suggested dependencies..." -ForegroundColor Cyan
  npm install $pkgs
} else {
  Write-Host "No suggested packages to reinstall." -ForegroundColor Yellow
}

# commit & push
Write-Host "💾 Committing cleaned package.json..." -ForegroundColor Cyan
git add package.json
git commit -m "chore: auto-fix and reinstall dependencies" | Out-Null
git push

# dispatch workflow
Write-Host "🚀 Dispatching CI workflow..." -ForegroundColor Cyan
$run = gh workflow run "Playwright parity matrix (manual)" -f branch=main --json | ConvertFrom-Json
Start-Sleep -Seconds 10

# monitor until finished
$runId = $run.id
Write-Host "🔍 Monitoring workflow run ID: $runId" -ForegroundColor Cyan

do {
  $status = gh run view $runId --json status,conclusion | ConvertFrom-Json
  Write-Host ("  • Status: {0}  (Conclusion: {1})" -f $status.status, $status.conclusion)
  Start-Sleep -Seconds 15
} while ($status.status -ne "completed")

if ($status.conclusion -eq "success") {
  Write-Host "✅ Workflow succeeded!" -ForegroundColor Green
} else {
  Write-Host "⚠️ CI failed — running rollback.ps1 automatically..." -ForegroundColor Red
  & ./rollback.ps1
}
