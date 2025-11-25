# ==========================================
# APPMAT FIX + START DEV (Auto Edition)
# ==========================================
Write-Host "🚀 Starting Appmat Fix + Dev..." -ForegroundColor Cyan
$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$log = "fix-startdev-$timestamp.log"

function Log($m){$m | Tee-Object -FilePath $log -Append}

# 1️⃣ Stop Node.js processes
Log "[1/8] Stopping Node processes..."
try {
  Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
  Log "✅ All node processes stopped."
} catch { Log "⚠️ Skipped stopping processes." }

# 2️⃣ Check environment
Log "`n[2/8] Checking Node & pnpm..."
try { Log "Node: $(node -v)" } catch { throw "❌ Node.js not found" }
try { Log "pnpm: $(pnpm -v)" } catch { npm install -g pnpm@9 }

# 3️⃣ Clean caches
Log "`n[3/8] Cleaning cache..."
$dirs = @("node_modules",".turbo","dist","test-results")
foreach($d in $dirs){ if(Test-Path $d){ Remove-Item -Recurse -Force $d; Log "🧹 Removed $d" } }

# 4️⃣ Fix esbuild
Log "`n[4/8] Fixing esbuild..."
try {
  pnpm add -D esbuild@latest
  npx esbuild --version | Tee-Object -FilePath $log -Append
} catch {
  Log "⚠️ Using npm fallback..."
  npm install -D esbuild@latest
}

# 5️⃣ Reinstall dependencies
Log "`n[5/8] Installing dependencies..."
pnpm install --frozen-lockfile

# 6️⃣ Verify tools
Log "`n[6/8] Verifying build tools..."
try {
  npx playwright install --with-deps
  Log "✅ Playwright ready."
} catch { Log "⚠️ Playwright skipped." }

# 7️⃣ Build project
Log "`n[7/8] Running build..."
try { pnpm run build } catch { Log "⚠️ Build failed (see logs)." }

# 8️⃣ Start dev server
Log "`n[8/8] Launching dev server..."
try {
  Write-Host "`n💻 Starting pnpm run dev ..."
  Start-Process "powershell" -ArgumentList "-NoExit", "-Command", "pnpm run dev"
  Log "✅ Dev server started."
} catch { Log "❌ Failed to start dev server." }

Write-Host "`n✅ Fix + StartDev completed! Log: $log" -ForegroundColor Green
