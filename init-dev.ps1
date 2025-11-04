# ==========================================
# APPMAT INIT-DEV SCRIPT (Windows)
# ==========================================
Write-Host "🚀 Starting Appmat environment setup..." -ForegroundColor Cyan
$ErrorActionPreference = "Stop"

# 1️⃣ Add Windows Defender exclusion (optional)
Write-Host "`n[1/6] Adding Defender exclusion for this folder..."
try {
  $folder = (Get-Location).Path
  Add-MpPreference -ExclusionPath $folder
  Write-Host "✅ Defender exclusion added for: $folder"
} catch {
  Write-Host "⚠️ Could not add exclusion (need admin or restricted policy). Skipping..."
}

# 2️⃣ Check Node.js installation
Write-Host "`n[2/6] Checking Node.js..."
try {
  node -v
} catch {
  Write-Host "❌ Node.js not found. Please install Node.js 20+ from https://nodejs.org/"
  exit 1
}

# 3️⃣ Check pnpm installation
Write-Host "`n[3/6] Checking pnpm..."
try {
  pnpm -v
} catch {
  Write-Host "⚙️ Installing pnpm globally..."
  npm install -g pnpm@9
}

# 4️⃣ Install project dependencies
Write-Host "`n[4/6] Installing project dependencies..."
try {
  pnpm install --frozen-lockfile
  Write-Host "✅ Dependencies installed."
} catch {
  Write-Host "⚠️ Installation failed, retrying with cleanup..."
  if (Test-Path "node_modules") { Remove-Item -Recurse -Force node_modules }
  pnpm install
}

# 5️⃣ Verify build tools
Write-Host "`n[5/6] Verifying build tools..."
try {
  npx esbuild --version
  npx playwright install --with-deps
  Write-Host "✅ esbuild & Playwright ready."
} catch {
  Write-Host "⚠️ Some tools missing, reinstalling..."
  pnpm add -D esbuild@latest
  npx playwright install --with-deps
}

# 6️⃣ Open VS Code (optional)
Write-Host "`n[6/6] Opening project in VS Code..."
try {
  code .
} catch {
  Write-Host "⚠️ VS Code CLI not found. Please open manually."
}

Write-Host "`n✅ Appmat setup complete! You can now run: pnpm run dev" -ForegroundColor Green
exit 0
