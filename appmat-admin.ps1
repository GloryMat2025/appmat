# ==========================================
# APPMAT ADMIN MENU (Universal Compatible)
# ==========================================
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "         🌟 APPMAT ADMIN CONSOLE 🌟" -ForegroundColor Yellow
Write-Host "=========================================="
Write-Host ""
Write-Host "1️⃣  Setup Dev (init-dev.ps1)"
Write-Host "2️⃣  Fix All (fix-all.ps1)"
Write-Host "3️⃣  Verify All (verify-all.ps1)"
Write-Host "4️⃣  Auto Fix Chain (auto-fix-chain.ps1)"
Write-Host "5️⃣  Exit"
Write-Host ""

$choice = Read-Host "👉 Enter your choice (1-5)"

switch ($choice) {
    "1" {
        if (Test-Path "$PSScriptRoot\init-dev.ps1") {
            Write-Host "🚀 Running Setup Dev..." -ForegroundColor Cyan
            & "$PSScriptRoot\init-dev.ps1"
        } else {
            Write-Host "❌ init-dev.ps1 not found!" -ForegroundColor Red
        }
    }
    "2" {
        if (Test-Path "$PSScriptRoot\fix-all.ps1") {
            Write-Host "🧩 Running Fix All..." -ForegroundColor Cyan
            & "$PSScriptRoot\fix-all.ps1"
        } else {
            Write-Host "❌ fix-all.ps1 not found!" -ForegroundColor Red
        }
    }
    "3" {
        if (Test-Path "$PSScriptRoot\verify-all.ps1") {
            Write-Host "🔍 Running Verify All..." -ForegroundColor Cyan
            & "$PSScriptRoot\verify-all.ps1"
        } else {
            Write-Host "❌ verify-all.ps1 not found!" -ForegroundColor Red
        }
    }
    "4" {
        if (Test-Path "$PSScriptRoot\auto-fix-chain.ps1") {
            Write-Host "⚙️  Running Auto Fix Chain..." -ForegroundColor Cyan
            & "$PSScriptRoot\auto-fix-chain.ps1"
        } else {
            Write-Host "❌ auto-fix-chain.ps1 not found!" -ForegroundColor Red
        }
    }
    "5" {
        Write-Host "👋 Exiting Appmat Admin Console. Goodbye!" -ForegroundColor Yellow
        exit 0
    }
    Default {
        Write-Host "⚠️ Invalid choice. Please run again." -ForegroundColor Red
    }
}

Write-Host "`n✅ Done!"
