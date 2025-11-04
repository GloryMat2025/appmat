# ==========================================
# APPMAT PROJECT REPAIR TOOLKIT (ADMIN MENU)
# ==========================================
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "     🧩 APPMAT PROJECT REPAIR TOOLKIT     " -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  Restore rebuild-esbuild.cjs"
Write-Host "2️⃣  Run Fix-All (clean & reinstall)"
Write-Host "3️⃣  Verify Project Health"
Write-Host "4️⃣  Auto Fix Chain (full repair)"
Write-Host "5️⃣  Exit"
Write-Host ""

function Run-Script($file) {
  $path = Join-Path $PSScriptRoot $file
  if (Test-Path $path) {
    Write-Host "🚀 Running $file ..." -ForegroundColor Cyan
    & $path
  } else {
    Write-Host "❌ $file not found in current folder!" -ForegroundColor Red
  }
}

while ($true) {
  $choice = Read-Host "👉 Enter your choice (1-5)"
  switch ($choice) {
    "1" { Run-Script "restore-rebuild-esbuild.ps1" }
    "2" { Run-Script "fix-all.ps1" }
    "3" { Run-Script "verify-all.ps1" }
    "4" { Run-Script "auto-fix-chain.ps1" }
    "5" {
      Write-Host "`n👋 Exiting Repair Toolkit. Goodbye!" -ForegroundColor Yellow
      break
    }
    Default {
      Write-Host "⚠️ Invalid choice. Try again." -ForegroundColor Red
    }
  }
  Write-Host "`n=========================================="
  Write-Host "Returning to main menu..."
  Write-Host "==========================================`n"
}
