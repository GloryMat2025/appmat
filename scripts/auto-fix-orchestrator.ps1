# auto-fix-orchestrator.ps1
$ErrorActionPreference = "Stop"

# === Setup log file ===
$logDir = Join-Path (Get-Location) "logs"
if (!(Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$logFile = Join-Path $logDir "ci-orchestrator-$timestamp.txt"
Start-Transcript -Path $logFile -Append | Out-Null

function Rollback-LatestBackup {
  Write-Host "⚠️ Running rollback due to CI failure..." -ForegroundColor Red
  $backup = Get-ChildItem -Path . -Filter "package.json.bak.*.json" |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if (-not $backup) {
    Write-Host "❌ No package.json.bak.*.json found — cannot rollback." -ForegroundColor Red
    return
  }
  Copy-Item -Path $backup.FullName -Destination "package.json" -Force
  git add package.json
  git commit -m "revert: restore from $($backup.Name)" | Out-Null
  git push
  Write-Host "✅ Rollback complete — restored $($backup.Name)" -ForegroundColor Green
}

# === Step 1: Cleanup ===
Write-Host "🧩 Cleaning package.json..." -ForegroundColor Cyan
node scripts/fix-package.mjs

# === Step 2: Find report ===
$report = Get-ChildItem -Path . -Filter "package-fix-report.*.json" |
  Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $report) {
  Write-Host "❌ No package-fix-report.*.json found." -ForegroundColor Red
  Stop-Transcript
  exit 1
}

$json = Get-Content $report.FullName | ConvertFrom-Json
$pkgs = @()
foreach ($k in $json.suggestions.PSObject.Properties.Name) {
  $v = $json.suggestions.$k
  if ($v) { $pkgs += "$k@$v" }
}

# === Step 3: Install dependencies ===
if ($pkgs.Count -gt 0) {
  Write-Host "📦 Installing suggested dependencies..." -ForegroundColor Cyan
  npm install $pkgs
} else {
  Write-Host "No suggested packages to reinstall." -ForegroundColor Yellow
}

# === Step 4: Commit & push ===
$commitMsg = "chore: auto-fix deps + CI dispatch"
Write-Host "💾 Committing cleaned package.json..." -ForegroundColor Cyan
git add package.json
git commit -m $commitMsg | Out-Null
git push

# === Step 5: Dispatch workflow ===
Write-Host "🚀 Dispatching CI workflow..." -ForegroundColor Cyan
$run = gh workflow run "Playwright parity matrix (manual)" -f branch=main --json | ConvertFrom-Json
Start-Sleep -Seconds 10

# === Step 6: Monitor CI ===
$runId = $run.id
Write-Host "🔍 Monitoring workflow run ID: $runId" -ForegroundColor Cyan
do {
  $status = gh run view $runId --json status,conclusion | ConvertFrom-Json
  Write-Host ("  • Status: {0} (Conclusion: {1})" -f $status.status, $status.conclusion)
  Start-Sleep -Seconds 15
} while ($status.status -ne "completed")

# === Step 7: Handle result ===
if ($status.conclusion -eq "success") {
  Write-Host "✅ Workflow succeeded!" -ForegroundColor Green
} else {
  Write-Host "❌ Workflow failed: $($status.conclusion)" -ForegroundColor Red
  Rollback-LatestBackup
}
Write-Host "🔍 Running preflight verification..." -ForegroundColor Cyan

# Check Node
try {
  $nodeVersion = node -v
  Write-Host "✅ Node detected: $nodeVersion" -ForegroundColor Green
} catch {
  Write-Host "❌ Node.js not found. Please install Node and ensure it's in PATH." -ForegroundColor Red
  exit 1
}

# Check fix-package.mjs path
$scriptPath = Join-Path (Get-Location) "scripts\fix-package.mjs"
if (!(Test-Path $scriptPath)) {
  Write-Host "❌ fix-package.mjs not found at $scriptPath" -ForegroundColor Red
  exit 1
} else {
  Write-Host "✅ Found fix-package.mjs at $scriptPath" -ForegroundColor Green
}

Stop-Transcript
Write-Host "`n📁 Log saved to: $logFile" -ForegroundColor Yellow
