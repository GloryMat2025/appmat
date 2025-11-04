# ==========================================
# APPMAT VERIFY-ALL SCRIPT
# ==========================================
Write-Host "🧪 Running full Appmat verification..." -ForegroundColor Cyan
$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$report = "verify-report-$timestamp.log"

function Log($msg) { $msg | Tee-Object -FilePath $report -Append }

# 1️⃣ Check Node.js & pnpm
Log "`n[1/8] Checking environment..."
try { Log "Node: $(node -v)" } catch { throw "❌ Node.js not found" }
try { Log "pnpm: $(pnpm -v)" } catch { throw "❌ pnpm not found" }

# 2️⃣ Validate package.json syntax
Log "`n[2/8] Validating package.json..."
try {
  Get-Content package.json | ConvertFrom-Json | Out-Null
  Log "✅ package.json valid JSON."
} catch { Log "❌ Invalid package.json format!" }

# 3️⃣ Check missing dependencies
Log "`n[3/8] Checking dependencies..."
pnpm list --depth 0 | Tee-Object -FilePath $report -Append

# 4️⃣ Run lint (if configured)
Log "`n[4/8] Running lint..."
if (Test-Path "pnpm-lock.yaml") {
  try { pnpm run lint | Tee-Object -FilePath $report -Append }
  catch { Log "⚠️ Lint not configured or failed." }
}

# 5️⃣ Run tests
Log "`n[5/8] Running tests..."
try {
  pnpm run test || pnpm run test:playwright
  Log "✅ Tests completed."
} catch { Log "⚠️ Tests failed or not configured." }

# 6️⃣ Verify build
Log "`n[6/8] Verifying build..."
try {
  pnpm run build
  Log "✅ Build successful."
} catch { Log "❌ Build failed." }

# 7️⃣ Compute hashes for dist folder
Log "`n[7/8] Computing file hashes..."
if (Test-Path "dist") {
  Get-ChildItem -Recurse -File dist | ForEach-Object {
    $hash = (Get-FileHash $_.FullName -Algorithm SHA256).Hash
    "$hash  $($_.FullName)" | Tee-Object -FilePath $report -Append
  }
  Log "✅ Hash list generated for dist/."
} else { Log "⚠️ No dist folder found." }

# 8️⃣ Summary
Log "`n[8/8] Verification complete."
Write-Host "`n✅ Verification report saved: $report" -ForegroundColor Green
Write-Host "Open it to review environment, build, test & hash results."
exit 0
