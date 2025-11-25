# ==========================================
# ESBUILD EMERGENCY FIX SCRIPT (Windows)
# ==========================================
Write-Host "🚑 Running ESBUILD EMERGENCY FIX..." -ForegroundColor Cyan
$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$log = "esbuild-fix-$timestamp.log"

function Log($msg){$msg | Tee-Object -FilePath $log -Append}

# 1️⃣ Stop running Node processes
Log "[1/6] Stopping Node processes..."
try {
  Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
  Log "✅ Node processes stopped."
} catch { Log "⚠️ Could not stop Node processes." }

# 2️⃣ Clean old esbuild folders
Log "`n[2/6] Removing old esbuild modules..."
$paths = @(
  "node_modules/.pnpm/esbuild*",
  "node_modules/esbuild*"
)
foreach ($p in $paths) {
  Get-ChildItem -Path $p -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
}
Log "🧹 Old esbuild removed."

# 3️⃣ Reinstall esbuild (force latest version)
Log "`n[3/6] Installing latest esbuild version..."
try {
  pnpm add -D esbuild@latest --force | Tee-Object -FilePath $log -Append
} catch {
  Write-Host "⚠️ pnpm failed, retrying with npm..."
  npm install -D esbuild@latest --force | Tee-Object -FilePath $log -Append
}

# 4️⃣ Force rebuild binary (postinstall)
Log "`n[4/6] Rebuilding esbuild binary..."
try {
  pnpm rebuild esbuild | Tee-Object -FilePath $log -Append
} catch {
  npm rebuild esbuild | Tee-Object -FilePath $log -Append
}

# 5️⃣ Verify binary presence
Log "`n[5/6] Verifying esbuild binary..."
if (Test-Path "node_modules\esbuild\bin\esbuild.exe") {
  $version = & "node_modules\esbuild\bin\esbuild.exe" --version
  Log "✅ esbuild binary verified: $version"
  Write-Host "✅ esbuild OK — version $version" -ForegroundColor Green
} else {
  Write-Host "❌ esbuild binary missing! Rebuild failed." -ForegroundColor Red
  Log "❌ esbuild binary missing after rebuild."
}

# 6️⃣ Cleanup + summary
Log "`n[6/6] Done. See $log for details."
Write-Host "`n✅ Emergency fix completed! Check log: $log" -ForegroundColor Green
exit 0
