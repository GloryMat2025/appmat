# verify-fix-package.ps1
$ErrorActionPreference = "Stop"

Write-Host "🔍 Verifying environment..." -ForegroundColor Cyan

# Check Node
try {
  $nodeVersion = node -v
  Write-Host "✅ Node detected: $nodeVersion" -ForegroundColor Green
} catch {
  Write-Host "❌ Node.js not found. Please install Node and ensure it's in PATH." -ForegroundColor Red
  exit 1
}

# Check script path
$scriptPath = Join-Path (Get-Location) "scripts\fix-package.mjs"
if (!(Test-Path $scriptPath)) {
  Write-Host "❌ fix-package.mjs not found at $scriptPath" -ForegroundColor Red
  exit 1
} else {
  Write-Host "✅ Found $scriptPath" -ForegroundColor Green
}

# Run script
Write-Host "`n▶️ Running fix-package.mjs for verification..." -ForegroundColor Cyan
try {
  node $scriptPath
  Write-Host "`n✅ Script executed successfully." -ForegroundColor Green
} catch {
  Write-Host "`n❌ Script execution failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nVerification complete."
