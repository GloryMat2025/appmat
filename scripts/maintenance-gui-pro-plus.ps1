# maintenance-gui-pro-plus.ps1
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.IO.Compression.FileSystem

# --- CONFIG ---
$ConfigFile = Join-Path $env:APPDATA "AppMatMaintenanceConfig.json"
$LogDir = Join-Path (Get-Location) "logs"
$FontName = "Segoe UI"
$AutoRefreshMs = 5000

# --- STATE MGMT ---
function Load-Config {
  if (Test-Path $ConfigFile) {
    try { return (Get-Content $ConfigFile -Raw | ConvertFrom-Json) }
    catch { return @{ Theme="Light"; Width=850; Height=650 } }
  } else {
    return @{ Theme="Light"; Width=850; Height=650 }
  }
}

function Save-Config($cfg) {
  $cfg | ConvertTo-Json | Set-Content -Path $ConfigFile -Encoding UTF8
}

$Config = Load-Config

# --- THEME DEFINITIONS ---
$Themes = @{
  Light = @{
    Back = [System.Drawing.Color]::FromArgb(245,245,245)
    Fore = [System.Drawing.Color]::Black
    Accent = [System.Drawing.Color]::FromArgb(0,122,204)
  }
  Dark = @{
    Back = [System.Drawing.Color]::FromArgb(40,40,40)
    Fore = [System.Drawing.Color]::White
    Accent = [System.Drawing.Color]::FromArgb(80,170,255)
  }
}

function Apply-Theme($themeName) {
  $theme = $Themes[$themeName]
  $form.BackColor = $theme.Back
  foreach ($ctrl in $form.Controls) {
    if ($ctrl -is [System.Windows.Forms.Label] -or
        $ctrl -is [System.Windows.Forms.Button] -or
        $ctrl -is [System.Windows.Forms.TextBox]) {
      $ctrl.ForeColor = $theme.Fore
      if ($ctrl -is [System.Windows.Forms.Button]) {
        $ctrl.BackColor = $theme.Back
        $ctrl.FlatStyle = "Flat"
        $ctrl.FlatAppearance.BorderColor = $theme.Accent
      }
    }
  }
}

# --- UTILITIES ---
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

function Refresh-Status {
  $report = Get-LatestFile "package-fix-report.*.json"
  $backup = Get-LatestFile "package.json.bak.*.json"
  $ci = Get-CIStatus

  $lblReport.Text = if ($report) { "Last Report: " + $report.LastWriteTime.ToString("yyyy-MM-dd HH:mm") } else { "Last Report: none" }
  $lblBackup.Text = if ($backup) { "Last Backup: " + $backup.LastWriteTime.ToString("yyyy-MM-dd HH:mm") } else { "Last Backup: none" }

  switch ($ci) {
    "Success" { $lblCI.ForeColor = "Green"; $lblCI.Text = "🟢 CI: Success" }
    "Failed"  { $lblCI.ForeColor = "Red";   $lblCI.Text = "🔴 CI: Failed" }
    Default   { $lblCI.ForeColor = "Goldenrod"; $lblCI.Text = "🟡 CI: Pending" }
  }
}

function Refresh-LogView {
  $log = Get-LatestFile "ci-orchestrator-*.txt"
  if ($log) {
    $txtLog.Text = Get-Content $log.FullName -Raw
    $txtLog.SelectionStart = $txtLog.Text.Length
    $txtLog.ScrollToCaret()
  } else {
    $txtLog.Text = "(No logs yet)"
  }
}

function Run-Script($path) {
  if (!(Test-Path $path)) {
    [System.Windows.Forms.MessageBox]::Show("Script not found: $path")
    return
  }
  $ProgressBar.Value = 25
  $proc = Start-Process -FilePath "powershell.exe" -ArgumentList "-NoProfile","-ExecutionPolicy Bypass","-File `"$path`"" -PassThru
  Wait-Process -InputObject $proc
  $ProgressBar.Value = 100
  Start-Sleep 1
  Refresh-Status
  Refresh-LogView
  $ProgressBar.Value = 0
}

# --- UI SETUP ---
$form = New-Object System.Windows.Forms.Form
$form.Text = "🧩 AppMat Maintenance Panel (Pro+)"
$form.Size = New-Object System.Drawing.Size($Config.Width,$Config.Height)
$form.StartPosition = "CenterScreen"
$form.Font = New-Object System.Drawing.Font($FontName,10)
$form.add_FormClosing({ 
  $Config.Width = $form.Width
  $Config.Height = $form.Height
  Save-Config $Config
})

$lblHeader = New-Object System.Windows.Forms.Label
$lblHeader.Text = "AppMat Maintenance Suite (Pro+)"
$lblHeader.Font = New-Object System.Drawing.Font($FontName,14,[System.Drawing.FontStyle]::Bold)
$lblHeader.Location = New-Object System.Drawing.Point(250,15)
$lblHeader.AutoSize = $true
$form.Controls.Add($lblHeader)

# Status section
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
$btnData = @(
  @{text="Verify Setup"; x=40;  y=150; script="./verify-fix-package.ps1"},
  @{text="Run Orchestrator"; x=230; y=150; script="./auto-fix-orchestrator.ps1"},
  @{text="Rollback"; x=420; y=150; script="./rollback.ps1"},
  @{text="Restore & Retry"; x=610; y=150; script="./restore-and-retry.ps1"},
  @{text="List Backups"; x=40; y=200; script="./list-backups.ps1"},
  @{text="Open Logs"; x=230; y=200; script="openlogs"}
)
foreach ($b in $btnData) {
  $btn = New-Object System.Windows.Forms.Button
  $btn.Text = $b.text
  $btn.Location = New-Object System.Drawing.Point($b.x, $b.y)
  $btn.Size = New-Object System.Drawing.Size(160,35)
  if ($b.script -eq "openlogs") {
    $btn.Add_Click({
      if (Test-Path $LogDir) { Start-Process $LogDir } else { [System.Windows.Forms.MessageBox]::Show("No logs folder found.") }
    })
  } else {
    $path = $b.script
    $btn.Add_Click({ Run-Script $path })
  }
  $form.Controls.Add($btn)
}

# Progress bar
$ProgressBar = New-Object System.Windows.Forms.ProgressBar
$ProgressBar.Location = New-Object System.Drawing.Point(40,250)
$ProgressBar.Size = New-Object System.Drawing.Size(740,18)
$form.Controls.Add($ProgressBar)

# Log box
$txtLog = New-Object System.Windows.Forms.TextBox
$txtLog.Multiline = $true
$txtLog.ScrollBars = "Vertical"
$txtLog.Font = New-Object System.Drawing.Font("Consolas",9)
$txtLog.Location = New-Object System.Drawing.Point(40,280)
$txtLog.Size = New-Object System.Drawing.Size(740,300)
$form.Controls.Add($txtLog)

# Theme toggle
$chkTheme = New-Object System.Windows.Forms.CheckBox
$chkTheme.Text = "🌙 Dark Mode"
$chkTheme.Location = New-Object System.Drawing.Point(640,20)
$chkTheme.AutoSize = $true
$chkTheme.Checked = ($Config.Theme -eq "Dark")
$chkTheme.Add_CheckedChanged({
  $Config.Theme = if ($chkTheme.Checked) { "Dark" } else { "Light" }
  Apply-Theme $Config.Theme
  Save-Config $Config
})
$form.Controls.Add($chkTheme)

# Timer for auto refresh
$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = $AutoRefreshMs
$timer.Add_Tick({ Refresh-Status; Refresh-LogView })
$timer.Start()

# Initial setup
Apply-Theme $Config.Theme
Refresh-Status
Refresh-LogView
[void]$form.ShowDialog()
