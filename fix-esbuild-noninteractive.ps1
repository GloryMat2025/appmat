# ==========================================
# FIX-ESBUILD (Non-Interactive Version)
# ==========================================
$ErrorActionPreference = "SilentlyContinue"
Write-Host "🧰 Starting silent esbuild repair..." -ForegroundColor Cyan

# 1️⃣ Stop all Node.js processes (no prompt)
$nodes = Get-Process node -ErrorAction SilentlyContinue
if ($nodes) {
  $nodes | Stop-Process -Force
  Write-Host "⚠️  Stopped existing Node.js processes."
}

# 2️⃣ Check Node and pnpm
try { node -v | Out-Null } catch { Write-Host "❌ Node not found."; exit 1 }
try { pnpm -v | Out-Null } catch { npm install -g pnpm@9 }

# 3️⃣ Clean esbuild folders
$targets = @(
  "node_modules/.pnpm/esbuild*/node_modules/esbuild/bin",
  "node_modules/esbuild/bin",
  "node_modules/esbuild"
)
foreach ($t in $targets) {
  if (Test-Path $t) {
    Remove-Item -Recurse -Force $t -ErrorAction SilentlyContinue
    Write-Host "🧹 Removed $t"
  }
}

# 4️⃣ Reinstall esbuild cleanly
Write-Host "🔄 Reinstalling esbuild..."
pnpm add -D esbuild@latest --prefer-offline
if ($LASTEXITCODE -ne 0) {
  Write-Host "⚠️ pnpm failed, using npm fallback..."
  npm install -D esbuild@latest
}

# 5️⃣ Verify binary
try {
  $ver = npx esbuild --version
  Write-Host "✅ esbuild OK — version $ver"
} catch {
  Write-Host "❌ Verification failed, forcing rebuild..."
  npm rebuild esbuild
  npx esbuild --version
}

# 6️⃣ Optional clean + reinstall deps
Write-Host "📦 Rechecking lockfile..."
if (Test-Path "pnpm-lock.yaml") {
  Remove-Item pnpm-lock.yaml -Force
  pnpm install --frozen-lockfile
}

Write-Host "✅ Silent esbuild repair complete!" -ForegroundColor Green
exit 0
