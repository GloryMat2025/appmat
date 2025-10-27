<# repro-windows.ps1 — PowerShell variant for reproducing exports. #>

param(
    [switch]$UseDocker = $false,
    [int]$DPR = 1,
    [bool]$EmbedFont = $true,
    [string]$ChromiumArgs = ''
)

Set-StrictMode -Version Latest

$root = (Get-Location).Path
New-Item -ItemType Directory -Force -Path (Join-Path $root 'out') | Out-Null

if ($UseDocker) {
    Write-Host "Building docker image 'appmat-export-ci'..."
    docker build -t appmat-export-ci -f docker/Dockerfile.export-ci .
    if ($LASTEXITCODE -ne 0) { throw "Docker build failed with exit code $LASTEXITCODE" }

    Write-Host "Running container experiments (mounting repository)..."
    docker run --rm -v "${root}:/workspace" appmat-export-ci /bin/sh -c "mkdir -p /workspace/out && /workspace/scripts/run-experiments.sh"
    if ($LASTEXITCODE -ne 0) { throw "Docker run failed with exit code $LASTEXITCODE" }

    Write-Host "Container run completed. Inspect $root\out"
    return
}

Write-Host "Running Playwright exporter (DPR=$DPR, EmbedFont=$EmbedFont)"
$env:SVG_PW_DPR = $DPR.ToString()
if ($ChromiumArgs) { $env:SVG_PW_CHROMIUM_ARGS = $ChromiumArgs }

$outPath = Join-Path $root 'out\pw-embed-roboto-committed.png'
$cmd = "node scripts/svg-to-png-pw.mjs docs/architecture-refined.svg `"$outPath`""
if ($EmbedFont) { $cmd += ' --embed-font docs/fonts/Roboto-Regular.ttf' }

Write-Host "-> $cmd"
Invoke-Expression $cmd
if ($LASTEXITCODE -ne 0) { throw "Exporter failed with exit code $LASTEXITCODE" }

Write-Host "SHA256:";
certutil -hashfile $outPath SHA256

Write-Host "Size (bytes):";
(Get-Item -Path $outPath).Length

Write-Host "Done."
