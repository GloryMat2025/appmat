# list-backups.ps1
$ErrorActionPreference = "Stop"

Write-Host "🗂 Listing all package.json backups..." -ForegroundColor Cyan
$backups = Get-ChildItem -Filter "package.json.bak.*.json" | Sort-Object LastWriteTime -Descending

if ($backups.Count -eq 0) {
  Write-Host "❌ No backups found." -ForegroundColor Red
  exit 1
}

# Display list
$index = 1
foreach ($b in $backups) {
  $date = $b.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")
  $size = [math]::Round($b.Length / 1024, 1)
  Write-Host ("[{0}] {1,-50} {2,6} KB  {3}" -f $index, $b.Name, $size, $date)
  $index++
}

# Select backup
$choice = Read-Host "`nEnter the number of the backup to restore (Enter = cancel)"
if (-not $choice) {
  Write-Host "⚠️ Cancelled. No restore performed." -ForegroundColor Yellow
  exit 0
}
if ($choice -lt 1 -or $choice -gt $backups.Count) {
  Write-Host "❌ Invalid selection." -ForegroundColor Red
  exit 1
}

$selected = $backups[$choice - 1]
Write-Host ("📦 Restoring from backup: {0}" -f $selected.Name) -ForegroundColor Yellow
Copy-Item -Path $selected.FullName -Destination "package.json" -Force
Write-Host "✅ Restored package.json from $($selected.Name)" -ForegroundColor Green

# Install deps
Write-Host "`n📥 Running npm install..." -ForegroundColor Cyan
try {
  npm install
  Write-Host "✅ npm install completed successfully." -ForegroundColor Green
} catch {
  Write-Host "❌ npm install failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Option to open VS Code
$openVSCode = Read-Host "`nOpen VS Code in current project? (y/n)"
if ($openVSCode -eq "y") {
  if (Get-Command code -ErrorAction SilentlyContinue) {
    Write-Host "🪄 Launching VS Code..." -ForegroundColor Cyan
    code .
  } else {
    Write-Host "⚠️ VS Code command-line tool not found (install via 'Shell Command: Install 'code' command' in VS Code)." -ForegroundColor Yellow
  }
}

Write-Host "`n✅ Backup restored, dependencies installed, and environment ready." -ForegroundColor Green
