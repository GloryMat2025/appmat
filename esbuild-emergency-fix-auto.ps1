# ==========================================
# ESBUILD EMERGENCY FIX (AUTO NODE SWITCH)
# ==========================================
Write-Host "🚑 Running ESBUILD AUTO EMERGENCY FIX..." -ForegroundColor Cyan
$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$log = "esbuild-auto-fix-$timestamp.log"

function Log($msg){$msg | Tee-Object -FilePath $log -Append}

# 1️⃣ Check Node.js version
Log "[1/7] Checking Node.js version..."
try {
  $nodeVer = node -v
  Write-Host "🧠 Current Node version: $nodeVer"
  Log "Node: $nodeVer"
} catch {
  Write-Host "❌ Node.js not found! Please install Node 20+ first."
  exit 1
}

$major = [int]($nodeVer -replace '[^0-9].*','')
$switched = $false

# 2️⃣ Auto switch if Node too new (>=22)
if ($major -ge 22) {
  Write-Host "⚠️ Node $nodeVer may be too new for esbuild. Switching temporarily to Node 20..."
  try {
    $oldNode = $nodeVer
    nvm install 20 | Out-Null
    nvm use 20
    $switched = $true
    Log "Switched to Node 20 for compatibility."
  } catch {
    Write-Host "⚠️ Could not switch Node (NVM not found). Proceeding anyway..." -ForegroundColor Yellow
  }
} else {
  Write-Host "✅ Node $nodeVer is compatible."
}

# 3️⃣ Stop Node processes
Log "`n[2/7] Stopping Node processes..."
try {
  Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
  Log "✅ Node processes stopped."
} catch { Log "⚠️ Could not stop Node processes." }

# 4️⃣ Clean old esbuild folders
Log "`n[3/7] Removing old esbuild modules..."
$paths = @("node_modules/.pnpm/esbuild*", "node_modules/esbuild*")
foreach ($p in $paths) {
  Get-ChildItem -Path $p -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
}
Log "🧹 Old esbuild removed."

# 5️⃣ Reinstall esbuild (latest)
Log "`n[4/7] Installing esbuild@latest..."
try {
  pnpm add -D esbuild@latest --force | Tee-Object -FilePath $log -Append
} catch {
  Write-Host "⚠️ pnpm failed, retrying with npm..."
  npm install -D esbuild@latest --force | Tee-Object -FilePath $log -Append
}

# 6️⃣ Rebuild binary
Log "`n[5/7] Rebuilding esbuild binary..."
try {
  pnpm rebuild esbuild | Tee-Object -FilePath $log -Append
} catch {
  npm rebuild esbuild | Tee-Object -FilePath $log -Append
}

# 7️⃣ Verify binary
Log "`n[6/7] Verifying esbuild..."
if (Test-Path "node_modules\esbuild\bin\esbuild.exe") {
  $ver = & "node_modules\esbuild\bin\esbuild.exe" --version
  Write-Host "✅ esbuild OK — version $ver"
  Log "esbuild verified: $ver"
} else {
  Write-Host "❌ esbuild binary missing!" -ForegroundColor Red
  Log "❌ esbuild binary missing!"
}

# 8️⃣ Restore Node version if switched
if ($switched -and $oldNode) {
  Write-Host "`n🔁 Switching back to Node $oldNode..."
  try {
    nvm use $oldNode
    Log "Restored Node to $oldNode"
  } catch {
    Write-Host "⚠️ Could not restore Node version automatically."
  }
}

Log "`n[7/7] Done. Log saved to $log"
Write-Host "`n🎯 Auto emergency fix complete! Log: $log" -ForegroundColor Green
exit 0
