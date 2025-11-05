# ==========================================
# ONE-SHOT ESBUILD REBUILD FIX (PowerShell)
# ==========================================
Write-Host "🧩 Running Rebuild-Esbuild Auto-Fix..." -ForegroundColor Cyan
$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$log = "fix-rebuild-esbuild-$timestamp.log"

function Log($m){$m | Tee-Object -FilePath $log -Append}

# 1️⃣ Confirm script path
$scriptFile = Join-Path $PSScriptRoot "scripts\rebuild-esbuild.js"
$cjsFile = Join-Path $PSScriptRoot "scripts\rebuild-esbuild.cjs"

# 2️⃣ Convert rebuild-esbuild.js → rebuild-esbuild.cjs
if (Test-Path $scriptFile) {
  Write-Host "📝 Renaming rebuild-esbuild.js → rebuild-esbuild.cjs..."
  Rename-Item $scriptFile $cjsFile -Force
  Log "Renamed rebuild-esbuild.js → rebuild-esbuild.cjs"
} else {
  Write-Host "⚠️ rebuild-esbuild.js not found, creating new .cjs file..."
  New-Item -Force -Path $cjsFile -ItemType File | Out-Null
}

# 3️⃣ Write CommonJS code to the .cjs file
@'
const { execSync } = require("child_process");
const { existsSync } = require("fs");
const path = require("path");

console.log("🔧 Rebuilding esbuild binary...");
try {
  execSync("pnpm rebuild esbuild", { stdio: "inherit" });
} catch (err) {
  console.error("⚠️ Rebuild failed, trying npm fallback...");
  execSync("npm rebuild esbuild", { stdio: "inherit" });
}

const exe = path.join(__dirname, "../node_modules/esbuild/bin/esbuild.exe");
if (existsSync(exe)) {
  console.log("✅ esbuild binary rebuilt successfully!");
} else {
  console.error("❌ esbuild binary missing after rebuild.");
  process.exit(1);
}
'@ | Out-File -Encoding utf8 -FilePath $cjsFile -Force

# 4️⃣ Update package.json → postinstall command
$pkg = Join-Path $PSScriptRoot "package.json"
if (Test-Path $pkg) {
  Write-Host "🛠 Updating postinstall script in package.json..."
  (Get-Content $pkg -Raw) `
    -replace '"postinstall"\s*:\s*".*?"', '"postinstall": "node ./scripts/rebuild-esbuild.cjs"' |
    Set-Content -Encoding utf8 $pkg
  Log "Updated package.json postinstall command."
} else {
  Write-Host "❌ package.json not found!" -ForegroundColor Red
  exit 1
}

# 5️⃣ Run pnpm install to rebuild lockfile and binary
Write-Host "`n📦 Reinstalling dependencies and running postinstall..."
pnpm install | Tee-Object -FilePath $log -Append

# 6️⃣ Verify binary
$exePath = Join-Path $PSScriptRoot "node_modules\esbuild\bin\esbuild.exe"
if (Test-Path $exePath) {
  $ver = & $exePath --version
  Write-Host "✅ esbuild binary OK — version $ver" -ForegroundColor Green
  Log "esbuild OK ($ver)"
} else {
  Write-Host "❌ esbuild binary missing even after rebuild!" -ForegroundColor Red
  Log "Binary missing."
}

Write-Host "`n🎯 All done! Log saved to $log" -ForegroundColor Green
exit 0
