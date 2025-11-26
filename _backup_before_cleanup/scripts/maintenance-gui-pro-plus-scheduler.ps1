# maintenance-gui-pro-plus-scheduler.ps1
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Import-Module BurntToast -ErrorAction SilentlyContinue

# === CONFIG ===
$ConfigPath = Join-Path $env:APPDATA "AppMatMaintenanceConfig.json"
$LogDir = Join-Path (Get-Location) "logs"
$Font = New-Object System.Drawing.Font("Segoe UI", 10)
$RefreshMs = 5000
$TaskName = "AppMat Weekly Orchestrator"
$OrchestratorPath = Join-Path (Get-Location) "auto-fix-orchestrator.ps1"

# === UTILITIES ===
function Get-LatestFile($pattern) {
  Get-ChildItem -Filter $pattern -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
}

function Get-CIStatus {
  $log = Get-LatestFile "ci-orchestrator-*.txt"
  if (-not $log) { return "Unknown" }
  $content = Get-Content $log.FullName -Raw
  if ($content -match "✅ Workflow succeeded!") { return "Success" }
  elseif ($content -match "❌ Workflow failed") { return "Failed" }
  else { return "Pending" }
}

function Show-Toast($title, $msg, $type="info") {
  try {
    $icon = switch ($type) {
      "success" { "C:\Windows\System32\Shell32.dll,40" }
      "error"   { "C:\Windows\System32\Shell32.dll,109" }
      default   { "C:\Windows\System32\Shell32.dll,167" }
    }
    New-BurntToastNotification -AppLogo $icon -Text $title, $msg
  } catch {}
}

# === CONFIG LOAD/SAVE ===
function Load-Config {
  if (Test-Path $ConfigPath) {
    try { return (Get-Content $ConfigPath -Raw | ConvertFrom-Json) }
    catch { return @{ Theme="Light"; Width=880; Height=650 } }
  } else {
    return @{ Theme="Light"; Width=880; Height=650 }
  }
}
function Save-Config($cfg) { $cfg | ConvertTo-Json | Set-Content $ConfigPath }

$Config = Load-Config

# === THEMES ===
$Themes = @{
  Light = @{
    Back = [System.Drawing.Color]::FromArgb(245,245,245)
    Fore = [System.Drawing.Color]::Black
    Accent = [System.Drawing.Color]::FromArgb(0,122,204)
  }
  Dark = @{
    Back = [System.Drawing.Color]::FromArgb(36,36,36)
    Fore = [System.Drawing.Color]::White
    Accent = [System.Drawing.Color]::FromArgb(80,170,255)
  }
}
function Apply-Theme($name) {
  $theme = $Themes[$name]
  $form.BackColor = $theme.Back
  foreach ($ctrl in $form.Controls) {
    if ($ctrl -is [System.Windows.Forms.Label] -or $ctrl -is [System.Windows.Forms.TextBox] -or $ctrl -is [System.Windows.Forms.Button]) {
      $ctrl.ForeColor = $theme.Fore
      if ($ctrl -is [System.Windows.Forms.Button]) {
        $ctrl.BackColor = $theme.Back
        $ctrl.FlatStyle = "Flat"
        $ctrl.FlatAppearance.BorderColor = $theme.Accent
      }
    }
  }
}

# === CORE REFRESH ===
function Refresh-Status {
  $report = Get-LatestFile "package-fix-report.*.json"
  $backup = Get-LatestFile "package.json.bak.*.json"
  $ci = Get-CIStatus

  $lblReport.Text = if ($report) { "Last Report: " + $report.LastWriteTime.ToString("yyyy-MM-dd HH:mm") } else { "Last Report: none" }
  $lblBackup.Text = if ($backup) { "Last Backup: " + $backup.LastWriteTime.ToString("yyyy-MM-dd HH:mm") } else { "Last Backup: none" }

  switch ($ci) {
    "Success" { $lblCI.Text = "🟢 CI: Success"; $lblCI.ForeColor = "Green" }
    "Failed"  { $lblCI.Text = "🔴 CI: Failed";  $lblCI.ForeColor = "Red" }
    Default   { $lblCI.Text = "🟡 CI: Pending"; $lblCI.ForeColor = "Goldenrod" }
  }
}

function Refresh-Log {
  $log = Get-LatestFile "ci-orchestrator-*.txt"
  if ($log) {
    $txtLog.Text = Get-Content $log.FullName -Raw
    $txtLog.SelectionStart = $txtLog.Text.Length
    $txtLog.ScrollToCaret()
  } else { $txtLog.Text = "(No logs yet)" }
}

# === RUNNER ===
function Run-Script($path) {
  if (!(Test-Path $path)) { [System.Windows.Forms.MessageBox]::Show("Script not found: $path"); return }
  $ProgressBar.Value = 30
  $proc = Start-Process -FilePath "powershell.exe" -ArgumentList "-NoProfile","-ExecutionPolicy Bypass","-File `"$path`"" -PassThru
  Wait-Process -InputObject $proc
  $ProgressBar.Value = 100
  Start-Sleep 1
  Refresh-Status
  Refresh-Log
  $ProgressBar.Value = 0

  $ci = Get-CIStatus
  if ($ci -eq "Success") { Show-Toast "AppMat CI ✅" "Workflow succeeded." "success" }
  elseif ($ci -eq "Failed") { Show-Toast "AppMat CI ❌" "Workflow failed. Check logs." "error" }
}

# === SCHEDULER ===
function Ensure-ScheduledTask {
  if (!(Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue)) {
    $Trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 9am
    $Action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -File `"$OrchestratorPath`""
    Register-ScheduledTask -Action $Action -Trigger $Trigger -TaskName $TaskName -Description "Weekly auto-maintenance for AppMat" -RunLevel Highest | Out-Null
    Show-Toast "AppMat Auto-Scheduler ⏰" "Created weekly task at 9AM Sunday."
  }
}

# === UI ===
$form = New-Object System.Windows.Forms.Form
$form.Text = "🧩 AppMat Maintenance Suite (Pro+ Scheduler)"
$form.Size = New-Object System.Drawing.Size($Config.Width, $Config.Height)
$form.StartPosition = "CenterScreen"
$form.Font = $Font
$form.Add_FormClosing({ $Config.Width=$form.Width; $Config.Height=$form.Height; Save-Config $Config })

$lblTitle = New-Object System.Windows.Forms.Label
$lblTitle.Text = "AppMat Maintenance Suite (Pro+ Scheduler)"
$lblTitle.Font = New-Object System.Drawing.Font("Segoe UI",14,[System.Drawing.FontStyle]::Bold)
$lblTitle.Location = New-Object System.Drawing.Point(210,15)
$lblTitle.AutoSize = $true
$form.Controls.Add($lblTitle)

$lblReport = New-Object System.Windows.Forms.Label
$lblReport.Location = New-Object System.Drawing.Point(40,60)
$lblReport.AutoSize = $true
$form.Controls.Add($lblReport)

$lblBackup = New-Object System.Windows.Forms.Label
$lblBackup.Location = New-Object System.Drawing.Point(40,85)
$lblBackup.AutoSize = $true
$form.Controls.Add($lblBackup)

$lblCI = New-Object System.Windows.Forms.Label
$lblCI.Location = New-Object System.Drawing.Point(40,110)
$lblCI.AutoSize = $true
$form.Controls.Add($lblCI)

# Buttons
$buttons = @(
  @{t="Verify Setup"; y=150; f="./verify-fix-package.ps1"},
  @{t="Run Orchestrator"; y=150; x=230; f="./auto-fix-orchestrator.ps1"},
  @{t="Rollback"; y=150; x=420; f="./rollback.ps1"},
  @{t="Restore & Retry"; y=150; x=610; f="./restore-and-retry.ps1"},
  @{t="List Backups"; y=200; f="./list-backups.ps1"},
  @{t="Open Logs"; y=200; x=230; f="logs"}
)
foreach ($b in $buttons) {
  $btn = New-Object System.Windows.Forms.Button
  $btn.Text = $b.t
  $btn.Size = New-Object System.Drawing.Size(160,35)
  $btn.Location = New-Object System.Drawing.Point(($b.x -as [int] -or 40),$b.y)
  if ($b.f -eq "logs") {
    $btn.Add_Click({ if (Test-Path $LogDir) { Start-Process $LogDir } else { [System.Windows.Forms.MessageBox]::Show("No logs folder found.") } })
  } else {
    $path = $b.f; $btn.Add_Click({ Run-Script $path })
  }
  $form.Controls.Add($btn)
}

# Progress + Logs
$ProgressBar = New-Object System.Windows.Forms.ProgressBar
$ProgressBar.Location = New-Object System.Drawing.Point(40,250)
$ProgressBar.Size = New-Object System.Drawing.Size(740,18)
$form.Controls.Add($ProgressBar)

$txtLog = New-Object System.Windows.Forms.TextBox
$txtLog.Multiline = $true
$txtLog.ScrollBars = "Vertical"
$txtLog.Font = New-Object System.Drawing.Font("Consolas",9)
$txtLog.Location = New-Object System.Drawing.Point(40,280)
$txtLog.Size = New-Object System.Drawing.Size(740,300)
$form.Controls.Add($txtLog)

# Dark mode toggle
$chkTheme = New-Object System.Windows.Forms.CheckBox
$chkTheme.Text = "🌙 Dark Mode"
$chkTheme.Location = New-Object System.Drawing.Point(700,20)
$chkTheme.AutoSize = $true
$chkTheme.Checked = ($Config.Theme -eq
