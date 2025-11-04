# maintenance-dashboard.ps1
$ErrorActionPreference = "Stop"
Clear-Host

# === CONFIG ===
$logDir = Join-Path (Get-Location) "logs"
$notifEnabled = $true   # set to $false to disable toast notifications

# === UTILITIES ===
function Show-Notification($title, $message) {
  if (-not $notifEnabled) { return }
  try {
    Add-Type -AssemblyName PresentationFramework
    [System.Windows.MessageBox]::Show($message, $title)
  } catch {
    Write-Host "⚠️ Notification failed: $($_.Exception.Message)" -ForegroundColor Yellow
  }
}

function Get-LatestFile($pattern) {
  $file = Get-ChildItem -Filter $pattern -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  return $file
}

function Get-Status {
  $lastReport = Get-LatestFile "package-fix-report.*.json"
  $lastBackup = Get-LatestFile "package.json.bak.*.json"
  $lastLog = Get-LatestFile "ci-orchestrator-*.txt"

  Write-Host "`n🧾 STATUS SUMMARY" -ForegroundColor Cyan
  if ($lastReport) { Write-Host ("  • Last report: {0}" -f $lastReport.LastWriteTime.ToString("yyyy-MM-dd HH:mm")) -ForegroundColor Green } else { Write-Host "  • No reports found." -ForegroundColor Yellow }
  if ($lastBackup) { Write-Host ("  • Last backup: {0}" -f $lastBackup.LastWriteTime.ToString("yyyy-MM-dd HH:mm")) -ForegroundColor Green } else { Write-Host "  • No backups found." -ForegroundColor Yellow }
  if ($lastLog) {
    Write-Host ("  • Last log: {0}" -f $lastLog.LastWriteTime.ToString("yyyy-MM-dd HH:mm")) -ForegroundColor Green
    $content = Get-Content $lastLog.FullName -Raw
    if ($content -match "✅ Workflow succeeded!") {
      Write-Host "  • CI Status: ✅ Success" -ForegroundColor Green
    } elseif ($content -match "❌ Workflow failed") {
      Write-Host "  • CI Status: ❌ Failed" -ForegroundColor Red
    } else {
      Write-Host "  • CI Status: ⚙️ Pending / Unknown" -ForegroundColor Yellow
    }
  } else {
    Write-Host "  • No log files found." -ForegroundColor Yellow
  }
}

function Pause-Continue { Read-Host "`nPress Enter to continue..." | Out-Null }

function Run-Script($scriptPath, $desc) {
  if (!(Test-Path $scriptPath)) {
    Write-Host "❌ $desc script not found: $scriptPath" -ForegroundColor Red
    Pause-Continue
    return
  }
  Write-Host "▶️  Running $desc..." -ForegroundColor Cyan
  & $scriptPath
  Pause-Continue
}

# === MAIN MENU LOOP ===
while ($true) {
  Clear-Host
  Write-Host "=========================================" -ForegroundColor DarkCyan
  Write-Host "   🧩 APPMAT MAINTENANCE DASHBOARD (v2)" -ForegroundColor Cyan
  Write-Host "=========================================" -ForegroundColor DarkCyan
  Get-Status
  Write-Host ""
  Write-Host " [1] Verify setup (Node + fix-package)"
  Write-Host " [2] Run orchestrator (clean + commit + CI)"
  Write-Host " [3] Rollback to latest backup"
  Write-Host " [4] Restore backup & retry orchestrator"
  Write-Host " [5] List and restore backups"
  Write-Host " [6] Open logs folder"
  Write-Host " [0] Exit"
  Write-Host ""

  $choice = Read-Host "Choose an option"

  switch ($choice) {
    "1" { Run-Script "./verify-fix-package.ps1" "Verification" }
    "2" { 
      Run-Script "./auto-fix-orchestrator.ps1" "Auto-Fix Orchestrator"
      $lastLog = Get-LatestFile "ci-orchestrator-*.txt"
      if ($lastLog) {
        $log = Get-Content $lastLog.FullName -Raw
        if ($log -match "✅ Workflow succeeded!") {
          Show-Notification "CI Success ✅" "Workflow completed successfully."
        } elseif ($log -match "❌ Workflow failed") {
          Show-Notification "CI Failed ❌" "Workflow failed. Check logs for details."
        }
      }
    }
    "3" { Run-Script "./rollback.ps1" "Rollback" }
    "4" { Run-Script "./restore-and-retry.ps1" "Restore & Retry" }
    "5" { Run-Script "./list-backups.ps1" "Backup Manager" }
    "6" {
      if (!(Test-Path $logDir)) { Write-Host "⚠️ No logs folder found." -ForegroundColor Yellow }
      else { Start-Process $logDir }
      Pause-Continue
    }
    "0" {
      Write-Host "👋 Exiting dashboard..." -ForegroundColor Cyan
      break
    }
    default {
      Write-Host "❌ Invalid option. Please try again." -ForegroundColor Red
      Pause-Continue
    }
  }
}
