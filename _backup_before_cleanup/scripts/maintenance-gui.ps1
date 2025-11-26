# maintenance-gui.ps1
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# --- CONFIG ---
$logDir = Join-Path (Get-Location) "logs"
$font = New-Object System.Drawing.Font("Segoe UI", 10)
Import-Module BurntToast -ErrorAction SilentlyContinue


function Show-Toast($title, $body, $type="info") {
  try {
    $icon = switch ($type) {
      "success" { "C:\Windows\System32\Shell32.dll,40" }
      "error"   { "C:\Windows\System32\Shell32.dll,109" }
      default   { "C:\Windows\System32\Shell32.dll,167" }
    }
    New-BurntToastNotification -AppLogo $icon -Text $title, $body
  } catch {
    Write-Host "⚠️ Toast notification failed: $($_.Exception.Message)" -ForegroundColor Yellow
  }
}


function Get-LatestFile($pattern) {
  $file = Get-ChildItem -Filter $pattern -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
  return $file
}

function Get-CIStatus {
  $log = Get-LatestFile "ci-orchestrator-*.txt"
  if (-not $log) { return "Unknown" }
  $content = Get-Content $log.FullName -Raw
  if ($content -match "✅ Workflow succeeded!") { return "Success" }
  elseif ($content -match "❌ Workflow failed") { return "Failed" }
  else { return "Pending" }
}

function Refresh-Status {
  $report = Get-LatestFile "package-fix-report.*.json"
  $backup = Get-LatestFile "package.json.bak.*.json"
  $ci = Get-CIStatus

  $lblReport.Text = if ($report) { "Last Report: " + $report.LastWriteTime.ToString("yyyy-MM-dd HH:mm") } else { "Last Report: none" }
  $lblBackup.Text = if ($backup) { "Last Backup: " + $backup.LastWriteTime.ToString("yyyy-MM-dd HH:mm") } else { "Last Backup: none" }

  switch ($ci) {
    "Success" { $ciColor = "Green"; $ciText = "🟢 CI: Success" }
    "Failed"  { $ciColor = "Red";   $ciText = "🔴 CI: Failed"  }
    Default   { $ciColor = "Goldenrod"; $ciText = "🟡 CI: Pending" }
  }
  $lblCI.ForeColor = [System.Drawing.Color]::$ciColor
  $lblCI.Text = $ciText
}
$ci = Get-CIStatus
switch ($ci) {
  "Success" { Show-Toast "AppMat CI ✅" "Workflow succeeded." "success" }
  "Failed"  { Show-Toast "AppMat CI ❌" "Workflow failed. Check logs." "error" }
}
function Run-Script($path) {
  if (Test-Path $path) {
    Start-Process powershell -ArgumentList "-NoExit","-ExecutionPolicy Bypass","-File `"$path`""
  } else {
    [System.Windows.Forms.MessageBox]::Show("Script not found: $path")
  }
}

# --- UI LAYOUT ---
$form = New-Object System.Windows.Forms.Form
$form.Text = "🧩 AppMat Maintenance Control Panel"
$form.Size = New-Object System.Drawing.Size(520,420)
$form.StartPosition = "CenterScreen"
$form.BackColor = [System.Drawing.Color]::FromArgb(240,240,240)
$form.Font = $font

$lblHeader = New-Object System.Windows.Forms.Label
$lblHeader.Text = "AppMat Project Maintenance"
$lblHeader.Font = New-Object System.Drawing.Font("Segoe UI",14,[System.Drawing.FontStyle]::Bold)
$lblHeader.AutoSize = $true
$lblHeader.Location = New-Object System.Drawing.Point(110,20)
$form.Controls.Add($lblHeader)

# Status labels
$lblReport = New-Object System.Windows.Forms.Label
$lblReport.Location = New-Object System.Drawing.Point(40,70)
$lblReport.AutoSize = $true
$form.Controls.Add($lblReport)

$lblBackup = New-Object System.Windows.Forms.Label
$lblBackup.Location = New-Object System.Drawing.Point(40,95)
$lblBackup.AutoSize = $true
$form.Controls.Add($lblBackup)

$lblCI = New-Object System.Windows.Forms.Label
$lblCI.Location = New-Object System.Drawing.Point(40,120)
$lblCI.AutoSize = $true
$form.Controls.Add($lblCI)

# Buttons
$btnVerify = New-Object System.Windows.Forms.Button
$btnVerify.Text = "Verify Setup"
$btnVerify.Location = New-Object System.Drawing.Point(50,160)
$btnVerify.Size = New-Object System.Drawing.Size(180,40)
$btnVerify.Add_Click({ Run-Script "./verify-fix-package.ps1" })
$form.Controls.Add($btnVerify)

$btnRun = New-Object System.Windows.Forms.Button
$btnRun.Text = "Run Orchestrator"
$btnRun.Location = New-Object System.Drawing.Point(270,160)
$btnRun.Size = New-Object System.Drawing.Size(180,40)
$btnRun.Add_Click({ Run-Script "./auto-fix-orchestrator.ps1"; Start-Sleep 3; Refresh-Status })
$form.Controls.Add($btnRun)

$btnRollback = New-Object System.Windows.Forms.Button
$btnRollback.Text = "Rollback"
$btnRollback.Location = New-Object System.Drawing.Point(50,220)
$btnRollback.Size = New-Object System.Drawing.Size(180,40)
$btnRollback.Add_Click({ Run-Script "./rollback.ps1"; Start-Sleep 3; Refresh-Status })
$form.Controls.Add($btnRollback)

$btnRestore = New-Object System.Windows.Forms.Button
$btnRestore.Text = "Restore & Retry"
$btnRestore.Location = New-Object System.Drawing.Point(270,220)
$btnRestore.Size = New-Object System.Drawing.Size(180,40)
$btnRestore.Add_Click({ Run-Script "./restore-and-retry.ps1"; Start-Sleep 3; Refresh-Status })
$form.Controls.Add($btnRestore)

$btnBackups = New-Object System.Windows.Forms.Button
$btnBackups.Text = "List Backups"
$btnBackups.Location = New-Object System.Drawing.Point(50,280)
$btnBackups.Size = New-Object System.Drawing.Size(180,40)
$btnBackups.Add_Click({ Run-Script "./list-backups.ps1"; Start-Sleep 2; Refresh-Status })
$form.Controls.Add($btnBackups)

$btnLogs = New-Object System.Windows.Forms.Button
$btnLogs.Text = "Open Logs Folder"
$btnLogs.Location = New-Object System.Drawing.Point(270,280)
$btnLogs.Size = New-Object System.Drawing.Size(180,40)
$btnLogs.Add_Click({
  if (Test-Path $logDir) { Start-Process $logDir } else { [System.Windows.Forms.MessageBox]::Show("No logs folder found.") }
})
$form.Controls.Add($btnLogs)

$btnRefresh = New-Object System.Windows.Forms.Button
$btnRefresh.Text = "🔄 Refresh Status"
$btnRefresh.Location = New-Object System.Drawing.Point(180,340)
$btnRefresh.Size = New-Object System.Drawing.Size(150,35)
$btnRefresh.Add_Click({ Refresh-Status })
$form.Controls.Add($btnRefresh)

# Initialize
Refresh-Status
[void]$form.ShowDialog()


