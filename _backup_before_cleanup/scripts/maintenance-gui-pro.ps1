# maintenance-gui-pro.ps1
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# --- Config ---
$logDir = Join-Path (Get-Location) "logs"
$font = New-Object System.Drawing.Font("Segoe UI", 10)
$pollInterval = 5000  # 5 seconds auto-refresh interval

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
    "Success" { $lblCI.ForeColor = "Green"; $lblCI.Text = "🟢 CI: Success" }
    "Failed"  { $lblCI.ForeColor = "Red";   $lblCI.Text = "🔴 CI: Failed" }
    Default   { $lblCI.ForeColor = "Goldenrod"; $lblCI.Text = "🟡 CI: Pending" }
  }
}

function Run-Script($path) {
  if (!(Test-Path $path)) {
    [System.Windows.Forms.MessageBox]::Show("Script not found: $path")
    return
  }

  $logFile = Join-Path $logDir ("gui-run-" + (Get-Date -Format "yyyyMMdd_HHmmss") + ".txt")
  $proc = Start-Process -FilePath "powershell.exe" -ArgumentList "-NoProfile","-ExecutionPolicy Bypass","-File `"$path`"" -RedirectStandardOutput $logFile -RedirectStandardError $logFile -PassThru
  $progressBar.Value = 30
  Start-Sleep 2
  Wait-Process -InputObject $proc
  $progressBar.Value = 100
  Start-Sleep 1
  Refresh-LogView
  Refresh-Status
  $progressBar.Value = 0
}

function Refresh-LogView {
  $latestLog = Get-LatestFile "ci-orchestrator-*.txt"
  if ($latestLog) {
    $logBox.Text = Get-Content $latestLog.FullName -Raw
    $logBox.SelectionStart = $logBox.Text.Length
    $logBox.ScrollToCaret()
  } else {
    $logBox.Text = "(No logs yet)"
  }
}

# --- UI Setup ---
$form = New-Object System.Windows.Forms.Form
$form.Text = "🧩 AppMat Maintenance Panel (Pro)"
$form.Size = New-Object System.Drawing.Size(850,650)
$form.StartPosition = "CenterScreen"
$form.BackColor = [System.Drawing.Color]::FromArgb(245,245,245)
$form.Font = $font

$lblHeader = New-Object System.Windows.Forms.Label
$lblHeader.Text = "AppMat Maintenance Suite"
$lblHeader.Font = New-Object System.Drawing.Font("Segoe UI",14,[System.Drawing.FontStyle]::Bold)
$lblHeader.AutoSize = $true
$lblHeader.Location = New-Object System.Drawing.Point(270,15)
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
$btns = @(
  @{text="Verify Setup"; x=40;  y=150; script="./verify-fix-package.ps1"},
  @{text="Run Orchestrator"; x=230; y=150; script="./auto-fix-orchestrator.ps1"},
  @{text="Rollback"; x=420; y=150; script="./rollback.ps1"},
  @{text="Restore & Retry"; x=610; y=150; script="./restore-and-retry.ps1"},
  @{text="List Backups"; x=40; y=200; script="./list-backups.ps1"},
  @{text="Open Logs"; x=230; y=200; script="openlogs"}
)
foreach ($b in $btns) {
  $btn = New-Object System.Windows.Forms.Button
  $btn.Text = $b.text
  $btn.Location = New-Object System.Drawing.Point($b.x, $b.y)
  $btn.Size = New-Object System.Drawing.Size(160,35)
  if ($b.script -eq "openlogs") {
    $btn.Add_Click({
      if (Test-Path $logDir) { Start-Process $logDir } else { [System.Windows.Forms.MessageBox]::Show("No logs folder found.") }
    })
  } else {
    $path = $b.script
    $btn.Add_Click({ Run-Script $path })
  }
  $form.Controls.Add($btn)
}

# Progress bar
$progressBar = New-Object System.Windows.Forms.ProgressBar
$progressBar.Location = New-Object System.Drawing.Point(40,260)
$progressBar.Size = New-Object System.Drawing.Size(740,20)
$form.Controls.Add($progressBar)

# Log box
$logBox = New-Object System.Windows.Forms.TextBox
$logBox.Multiline = $true
$logBox.ScrollBars = "Vertical"
$logBox.Font = New-Object System.Drawing.Font("Consolas",9)
$logBox.Location = New-Object System.Drawing.Point(40,290)
$logBox.Size = New-Object System.Drawing.Size(740,300)
$form.Controls.Add($logBox)

# Auto-refresh timer
$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = $pollInterval
$timer.Add_Tick({ Refresh-Status; Refresh-LogView })
$timer.Start()

# Initial refresh
Refresh-Status
Refresh-LogView

[void]$form.ShowDialog()
