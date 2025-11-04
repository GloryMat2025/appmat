# ==========================================
# APPMAT AUTO FIX CHAIN (ONE-CLICK REPAIR ALL)
# ==========================================
Write-Host "⚙️  Running APPMAT AUTO-FIX-CHAIN..." -ForegroundColor Cyan
$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$log = "auto-fix-$timestamp.log"

function Log($msg){$msg | Tee-Object -FilePath $log -Append}

# 1️⃣ NODE VERSION CHECK
Log "[1/5] Checking Node.js version..."
try {
  $nodeVer = node -v
  Write-Host "🧠 Node version: $nodeVer"
  Log "Node: $nodeVer"
} catch {
  Write-Host "❌ Node.js not found! Install Node 20+ first." -ForegroundColor Red
  exit 1
}

$major = [int]($nodeVer -replace '[^0-9].*','')
if ($major -ge 22) {
  Write-Host "⚠️ Node $nodeVer may cause esbuild issues. Switching to Node 20..."
  try {
    nvm use 20
    Log "Switched to Node 20."
  } catch {
    Write-Host "⚠️ NVM not found. Please install NVM for Windows (https://github.com/coreybutler/nvm-windows/releases)" -ForegroundColor Yellow
  }
}

# 2️⃣ ESBUILD REPAIR
Log "`n[2/5] Running esbuild repair..."
if (Test-Path "$PSScriptRoot\esbuild-emergency-fix.ps1") {
  Write-Host "🛠️  Running esbuild emergency fix..."
  & "$PSScriptRoot\esbuild-emergency-fix.ps1" | Tee-Object -FilePath $log -Append
} else {
  Write-Host "⚠️ esbuild-emergency-fix.ps1 not found, skipping..."
  Log "Skipped esbuild repair."
}

# 3️⃣ FULL ENVIRONMENT FIX
Log "`n[3/5] Running fix-all.ps1..."
if (Test-Path "$PSScriptRoot\fix-all.ps1") {
  & "$PSScriptRoot\fix-all.ps1" | Tee-Object -FilePath $log -Append
} else {
  Write-Host "⚠️ fix-all.ps1 not found, skipping..."
  Log "Skipped fix-all."
}

# 4️⃣ VERIFY PROJECT HEALTH
Log "`n[4/5] Running verify-all.ps1..."
if (Test-Path "$PSScriptRoot\verify-all.ps1") {
  & "$PSScriptRoot\verify-all.ps1" | Tee-Object -FilePath $log -Append
} else {
  Write-Host "⚠️ verify-all.ps1 not found, skipping..."
  Log "Skipped verify-all."
}

# 5️⃣ FINAL CHECK
Log "`n[5/5] Verifying esbuild binary..."
if (Test-Path "node_modules\esbuild\bin\esbuild.exe") {
  $ver = & "node_modules\esbuild\bin\esbuild.exe" --version
  Write-Host "✅ esbuild OK (version $ver)"
  Log "esbuild verified: $ver"
} else {
  Write-Host "❌ esbuild binary still missing!"
  Log "esbuild binary missing!"
}

Write-Host "`n🎯 AUTO FIX COMPLETE — see log: $log" -ForegroundColor Green
Write-Host "You can now run: pnpm run dev"
exit 0
