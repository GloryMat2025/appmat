# ==========================================
# AUTO NODE CHECK & FIX FOR ESBUILD
# ==========================================
Write-Host "🧠 Checking Node.js compatibility..." -ForegroundColor Cyan
$ErrorActionPreference = "Stop"

# 1️⃣ Get Node version
try {
  $nodeVersion = node -v
  Write-Host "Current Node version: $nodeVersion"
} catch {
  Write-Host "❌ Node.js not detected! Please install Node 20+."
  exit 1
}

# 2️⃣ Extract major version
$major = [int]($nodeVersion -replace '[^0-9].*','')

# 3️⃣ Check compatibility
if ($major -ge 22) {
  Write-Host "`n⚠️ Node $nodeVersion may be too new for current esbuild." -ForegroundColor Yellow
  Write-Host "Switching temporarily to Node 20 using nvm..."
  try {
    nvm use 20
    Write-Host "✅ Switched to Node 20 for compatibility."
  } catch {
    Write-Host "⚠️ NVM not found — please install NVM for Windows from:"
    Write-Host "https://github.com/coreybutler/nvm-windows/releases"
    Write-Host "Then run: nvm install 20 && nvm use 20"
    exit 1
  }
} else {
  Write-Host "✅ Node $nodeVersion is compatible with esbuild."
}

# 4️⃣ Run esbuild verification
Write-Host "`n🔍 Verifying esbuild..."
try {
  npx esbuild --version
  Write-Host "✅ esbuild is working correctly."
} catch {
  Write-Host "❌ esbuild not found or broken. Running emergency fix..."
  powershell -ExecutionPolicy Bypass -File .\esbuild-emergency-fix.ps1
}

Write-Host "`n🎯 Node check completed. You can now run: pnpm run dev" -ForegroundColor Green
exit 0
