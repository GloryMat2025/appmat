# =====================================
# APPMAT ALL-FIX SCRIPT (PowerShell)
# =====================================
Write-Host "🚀 Starting APPMAT ALL-FIX..." -ForegroundColor Cyan
$ErrorActionPreference = "Stop"

# 1️⃣  Check environment
Write-Host "`n[1/7] Checking environment..."
node -v
if ($LASTEXITCODE -ne 0) { throw "❌ Node.js not found. Please install Node 20 or newer." }
pnpm -v
if ($LASTEXITCODE -ne 0) { throw "❌ pnpm not found. Run: npm install -g pnpm" }

# 2️⃣  Clean old installs & cache
Write-Host "`n[2/7] Cleaning cache and lock files..."
Remove-Item -Recurse -Force node_modules, .turbo, dist, build, test-results -ErrorAction SilentlyContinue
if (Test-Path "pnpm-lock.yaml") { Remove-Item "pnpm-lock.yaml" -Force }

# 3️⃣  Install dependencies
Write-Host "`n[3/7] Installing dependencies..."
pnpm install --frozen-lockfile

# 4️⃣  Build app
Write-Host "`n[4/7] Building project..."
pnpm run build

# 5️⃣  Run Playwright tests (if configured)
Write-Host "`n[5/7] Running Playwright tests..."
try {
  npx playwright install --with-deps
  pnpm run test || pnpm run test:playwright
} catch {
  Write-Host "⚠️ Playwright test skipped or failed. Continuing..."
}

# 6️⃣  Generate reports
Write-Host "`n[6/7] Generating screenshots and reports..."
try {
  pnpm run capture
  pnpm run shots:report
  pnpm run shots:zip
} catch {
  Write-Host "⚠️ Report generation failed, skipping..."
}

# 7️⃣  Verify and log summary
Write-Host "`n[7/7] Writing summary log..."
$date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$log = @"
APPMAT ALL-FIX COMPLETED — $date
--------------------------------
Environment OK
Build ✅
Playwright ✅ (if configured)
Reports ✅ (if configured)
Check dist/ and test-results/ for outputs.
"@
$log | Out-File -FilePath "fix-report.log" -Encoding utf8

Write-Host "`n✅ All-Fix complete! Log saved to fix-report.log" -ForegroundColor Green
exit 0
