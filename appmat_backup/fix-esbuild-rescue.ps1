# fix-esbuild-rescue.ps1
# Non-interactive rescue for esbuild binary issues on Windows.
param()
$ErrorActionPreference = 'Stop'
$root = (Get-Location).Path
$now = (Get-Date).ToString('yyyyMMdd-HHmmss')
$log = Join-Path $root "fix-esbuild-rescue.$now.log"

function Log([string]$m){
  $s = "$(Get-Date -Format 'HH:mm:ss') - $m"
  $s | Tee-Object -FilePath $log -Append
}

Log "=== START fix-esbuild-rescue ==="
Log "Working dir: $root"

# 1) Environment snapshot
Log "ENV: node/npm/pnpm info"
try {
  $nodev = node -v 2>&1
  $nodewhere = where.exe node 2>&1
  $npmv = npm -v 2>&1
  $npmprefix = npm prefix -g 2>&1
  $pnpmv = (pnpm -v 2>&1) -join "`n"
  Log "node -v: $nodev"
  Log "where node: $nodewhere"
  Log "npm -v: $npmv"
  Log "npm prefix -g: $npmprefix"
  Log "pnpm -v: $pnpmv"
} catch { Log "ENV check warning: $($_.Exception.Message)" }

# 2) Stop node processes
Log "Stopping node processes (if any)"
try {
  Get-Process -Name node -ErrorAction SilentlyContinue | ForEach-Object { Log "Stopping node pid $($_.Id)"; Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue }
  Start-Sleep -Milliseconds 500
} catch { Log "Stop node warning: $($_.Exception.Message)" }

# 3) Remove esbuild-related artefacts only (safe)
Log "Removing esbuild artifacts (only)"
try {
  Get-ChildItem -Path .\node_modules\.pnpm -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -like 'esbuild@*' } | ForEach-Object {
    Log "Removing $($_.FullName)"
    Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
  }
  Remove-Item -LiteralPath .\node_modules\esbuild -Recurse -Force -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath .\node_modules\@esbuild -Recurse -Force -ErrorAction SilentlyContinue
} catch { Log "Cleanup warning: $($_.Exception.Message)" }

# 4) Clean npm cache
Log "Cleaning npm cache"
try { npm cache clean --force 2>&1 | Tee-Object -FilePath $log -Append } catch { Log "npm cache clean warning: $($_.Exception.Message)" }

# 5) Canonical rebuild (npm) — preferred first
Log "Running: npm rebuild esbuild --update-binary"
$rebuildOk = $false
try {
  npm rebuild esbuild --update-binary 2>&1 | Tee-Object -FilePath $log -Append
  if ($LASTEXITCODE -eq 0) {
    Log "npm rebuild esbuild succeeded"
    $rebuildOk = $true
  } else {
    Log "npm rebuild esbuild returned exit code $LASTEXITCODE"
  }
} catch {
  Log "npm rebuild esbuild failed: $($_.Exception.Message)"
}

# 6) If rebuild failed, try direct npm install of esbuild and then retry pnpm install
if (-not $rebuildOk) {
  Log "Attempting npm install --save-dev esbuild@latest (fallback)"
  try {
    npm install --save-dev esbuild@latest --no-audit --no-fund 2>&1 | Tee-Object -FilePath $log -Append
    if ($LASTEXITCODE -eq 0) { Log "npm install esbuild succeeded" ; $rebuildOk = $true } else { Log "npm install esbuild exit code $LASTEXITCODE" }
  } catch { Log "npm install esbuild failed: $($_.Exception.Message)" }
}

# 7) Retry pnpm install (preferred) or npm install
$usePnpm = Test-Path 'pnpm-lock.yaml'
if ($usePnpm) {
  Log "Running pnpm install"
  try {
    pnpm install 2>&1 | Tee-Object -FilePath $log -Append
    if ($LASTEXITCODE -eq 0) { Log "pnpm install completed" } else { Log "pnpm install exit code $LASTEXITCODE" }
  } catch { Log "pnpm install failed: $($_.Exception.Message)" }
} else {
  Log "Running npm install"
  try {
    npm install 2>&1 | Tee-Object -FilePath $log -Append
    if ($LASTEXITCODE -eq 0) { Log "npm install completed" } else { Log "npm install exit code $LASTEXITCODE" }
  } catch { Log "npm install failed: $($_.Exception.Message)" }
}

# final verify esbuild binary
Log "Verifying esbuild via npx esbuild --version (if available)"
try {
  npx esbuild --version 2>&1 | Tee-Object -FilePath $log -Append
  Log "npx esbuild check done"
} catch { Log "npx esbuild check failed: $($_.Exception.Message)" }

Log "=== END fix-esbuild-rescue ==="
Write-Host "Log file: $log"
