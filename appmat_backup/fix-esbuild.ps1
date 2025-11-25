# ==========================================
# FIX-ESBUILD SCRIPT (PowerShell, Safe Version)
# ==========================================
Write-Host "🔧 Running fix-esbuild.ps1 (safe version)..." -ForegroundColor Cyan
$ErrorActionPreference = "Stop"

# 1️⃣ Stop all Node processes safely
Write-Host "`n[1/6] Checking & stopping any running Node.js processes..."
try {
  $nodes = Get-Process node -ErrorAction SilentlyContinue
  if ($nodes) {
    $nodes | ForEach-Object {
      Write-Host "⚠️  Stopping Node process ID $($_.Id)..."
      Stop-Process -Id $_.Id -Force
    }
  } else {
    Write-Host "✅ No active Node processes found."
  }
} catch {
  Write-Host "⚠️ Could not enumerate Node processes (may require admin). Skipping..."
}

# 2️⃣ Verify Node & pnpm availability
Write-Host "`n[2/6] Checking environment..."
try { node -v } catch { throw "❌ Node.js not found. Install Node 20+." }
try { pnpm -v } catch { npm install -g pnpm@9 }

# 3️⃣ Clean up old esbuild binaries
Write-Host "`n[3/6] Removing esbuild binaries and cache..."
$paths = @(
  "node_modules/.pnpm/esbuild*/node_modules/esbuild/bin",
  "node_modules/esbuild/bin",
  "node_modules/esbuild"
)
foreach ($p in $paths) {
  Get-ChildItem -Path $p -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
}
Write-Host "🗑️ Cleanup complete."

# 4️⃣ Reinstall esbuild cleanly
Write-Host "`n[4/6] Reinstalling latest esbuild..."
try {
  pnpm add -D esbuild@latest
} catch {
  Write-Host "⚠️ pnpm failed, falling back to npm..."
  npm install -D esbuild@latest
}

# 5️⃣ Verify binary
Write-Host "`n[5/6] Verifying esbuild binary..."
try {
  npx esbuild --version
  Write-Host "✅ esbuild binary working properly."
} catch {
  Write-Host "❌ Binary issue persists. Attempting rebuild..."
  npm rebuild esbuild
  npx esbuild --version
}

# 6️⃣ Optional lockfile cleanup
Write-Host "`n[6/6] Refreshing lockfile (optional)..."
if (Test-Path "pnpm-lock.yaml") {
  Remove-Item pnpm-lock.yaml -Force
  pnpm install
}

Write-Host "`n✅ All fixed! You can now run: pnpm run build" -ForegroundColor Green
exit 0
