# ==========================================
# APPMAT DEPENDENCY HEALTH CHECK SCRIPT
# ==========================================
Write-Host "🔍 Checking Appmat dependency health..." -ForegroundColor Cyan
$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$report = "deps-report-$timestamp.log"

function Log($m){$m | Tee-Object -FilePath $report -Append}

# 1️⃣ Check environment
Log "[1/5] Checking environment..."
try {
  Log "Node: $(node -v)"
  Log "pnpm: $(pnpm -v)"
} catch {
  Write-Host "❌ Node.js or pnpm not found." -ForegroundColor Red
  exit 1
}

# 2️⃣ List outdated dependencies
Log "`n[2/5] Checking outdated packages..."
try {
  pnpm outdated | Tee-Object -FilePath $report -Append
  Write-Host "✅ Outdated check complete."
} catch { Log "⚠️ Could not run pnpm outdated." }

# 3️⃣ Check deprecated subdependencies
Log "`n[3/5] Checking deprecated packages..."
try {
  pnpm ls --depth 10 | findstr /i "deprecated" | Tee-Object -FilePath $report -Append
  Write-Host "✅ Deprecated package scan done."
} catch { Log "⚠️ No deprecated packages found or pnpm ls failed." }

# 4️⃣ Run audit (security check)
Log "`n[4/5] Running pnpm audit..."
try {
  pnpm audit --prod | Tee-Object -FilePath $report -Append
  Write-Host "✅ Audit check complete."
} catch { Log "⚠️ pnpm audit not available." }

# 5️⃣ Summary
Log "`n[5/5] Dependency health check complete."
Write-Host "`n✅ Dependency report saved: $report" -ForegroundColor Green
Write-Host "Open it to review outdated, deprecated, and vulnerable packages."
exit 0
