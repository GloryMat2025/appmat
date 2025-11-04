Write-Host "Running restore-rebuild-esbuild.ps1..."
$ErrorActionPreference = "Stop"

$scriptsDir = Join-Path $PSScriptRoot "scripts"
if (!(Test-Path $scriptsDir)) {
  Write-Host "Creating scripts directory..."
  New-Item -ItemType Directory -Force -Path $scriptsDir | Out-Null
}

$rebuildFile = Join-Path $scriptsDir "rebuild-esbuild.cjs"
Write-Host "Writing rebuild-esbuild.cjs..."
@'
const { execSync } = require("child_process");
const { existsSync } = require("fs");
const path = require("path");

console.log("Rebuilding esbuild binary...");
try {
  execSync("pnpm rebuild esbuild", { stdio: "inherit" });
} catch (err) {
  console.error("Rebuild failed, trying npm fallback...");
  execSync("npm rebuild esbuild", { stdio: "inherit" });
}

const exe = path.join(__dirname, "../node_modules/esbuild/bin/esbuild.exe");
if (existsSync(exe)) {
  console.log("esbuild binary rebuilt successfully!");
} else {
  console.error("esbuild binary missing after rebuild.");
  process.exit(1);
}
'@ | Out-File -Encoding utf8 -FilePath $rebuildFile -Force

$pkg = Join-Path $PSScriptRoot "package.json"
if (Test-Path $pkg) {
  Write-Host "Updating package.json postinstall..."
  (Get-Content $pkg -Raw) -replace '"postinstall"\s*:\s*".*?"',
    '"postinstall": "node ./scripts/rebuild-esbuild.cjs"' |
    Set-Content -Encoding utf8 $pkg
}

Write-Host "Installing dependencies..."
pnpm install

$exePath = Join-Path $PSScriptRoot "node_modules\esbuild\bin\esbuild.exe"
if (Test-Path $exePath) {
  $ver = & $exePath --version
  Write-Host "esbuild binary OK — version $ver"
} else {
  Write-Host "esbuild binary missing!"
}
