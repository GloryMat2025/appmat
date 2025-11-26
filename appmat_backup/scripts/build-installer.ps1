# build-installer.ps1
<#
  Builds and packages the AppMat Maintenance Suite into a standalone installer ZIP.
  - Compiles the GUI PowerShell script into an .exe
  - Bundles all dependent scripts
  - Creates versioned ZIP on Desktop
#>

$ErrorActionPreference = "Stop"

# === SETTINGS ===
$version = "1.0.0"
$appName = "AppMatMaintenance"
$srcFolder = Get-Location
$buildDir = Join-Path $srcFolder "build"
$desktop = [Environment]::GetFolderPath("Desktop")
$outZip = Join-Path $desktop "$appName_v$version.zip"

# === CLEAN BUILD ===
if (Test-Path $buildDir) { Remove-Item $buildDir -Recurse -Force }
New-Item -ItemType Directory -Path $buildDir | Out-Null

Write-Host "🔧 Building $appName v$version..." -ForegroundColor Cyan

# === STEP 1: Compile to EXE ===
$ps1Input = Join-Path $srcFolder "maintenance-gui-pro-plus-scheduler.ps1"
$exeOutput = Join-Path $buildDir "$appName.exe"

if (!(Get-Command Invoke-ps2exe -ErrorAction SilentlyContinue)) {
  Write-Host "📦 Installing ps2exe module..." -ForegroundColor Yellow
  Install-Module ps2exe -Force -Scope CurrentUser
}

Invoke-ps2exe `
  -inputFile $ps1Input `
  -outputFile $exeOutput `
  -iconFile "C:\Windows\System32\shell32.dll,300" `
  -title "$appName" `
  -description "Automated Dependency Fix, CI & Scheduler Control Panel" `
  -version $version `
  -requireAdmin `
  -noConsole

Write-Host "✅ Compiled GUI -> $exeOutput"

# === STEP 2: Copy Dependencies ===
$deps = @(
  "auto-fix-orchestrator.ps1",
  "verify-fix-package.ps1",
  "rollback.ps1",
  "restore-and-retry.ps1",
  "list-backups.ps1",
  "scripts\fix-package.mjs",
  "scripts\reinstall-suggested.mjs"
)

foreach ($f in $deps) {
  if (Test-Path $f) {
    $dest = Join-Path $buildDir $f
    $destDir = Split-Path $dest
    if (!(Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir | Out-Null }
    Copy-Item $f $dest -Force
  } else {
    Write-Host "⚠️ Missing dependency: $f" -ForegroundColor Yellow
  }
}

# === STEP 3: Create ZIP ===
if (Test-Path $outZip) { Remove-Item $outZip -Force }
Compress-Archive -Path "$buildDir\*" -DestinationPath $outZip -Force
Write-Host "📦 Packaged build -> $outZip" -ForegroundColor Green

# === STEP 4: Summary ===
Write-Host "`n✅ Build Complete!"
Write-Host "Output: $outZip"
Write-Host "Location: $desktop"
Write-Host "Double-click $appName.exe to launch the control panel."
