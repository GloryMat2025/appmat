#!/usr/bin/env pwsh
# Deploy/Toggle Claude Sonnet 4.5 (Kubernetes patch or GitHub Actions)

param(
    [string]$Namespace = "staging",
    [string]$Deployment = "my-api",
    [string]$PatchPath = "deploy/k8s-patches/my-api-enable-claude-sonnet-4-5.patch.json",
    [string]$Kubeconfig,
    [switch]$UseActions,
    [switch]$Clean
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Set-Location -Path "C:\Users\DESIGNER 1\Desktop\appmat"

if ($Clean) {
    Write-Host "=== Optional cleanup of stray files ===" -ForegroundColor Cyan
    $dirsToRemove = @(
        ".github\workflows\_patches",
        "deploy\prod",
        "docs\feature-flags",
        "src\scripts\model-tests"
    )
    foreach ($dir in $dirsToRemove) {
        if (Test-Path $dir) {
            Write-Host "Removing directory: $dir" -ForegroundColor Yellow
            Remove-Item -Recurse -Force $dir -ErrorAction SilentlyContinue
        }
    }
    $filesToRemove = @(
        ".github\workflows\promote-to-prod.yml",
        ".github\workflows\rollback.yml",
        ".github\workflows\slack-notify.yml",
        "cleanup-and-deploy.bat"
    )
    foreach ($file in $filesToRemove) {
        if (Test-Path $file) {
            Write-Host "Removing file: $file" -ForegroundColor Yellow
            Remove-Item -Force $file -ErrorAction SilentlyContinue
        }
    }
}

if ($UseActions) {
    Write-Host "=== Triggering GitHub Actions workflow ===" -ForegroundColor Cyan
    $gh = Get-Command gh -ErrorAction SilentlyContinue
    if (-not $gh) { throw "GitHub CLI (gh) not found. Install from https://cli.github.com/ or run via Actions UI." }

    # Ensure workflow file exists
    if (-not (Test-Path ".github\workflows\apply-claude-sonnet-4-5.yml")) {
        throw "Workflow .github/workflows/apply-claude-sonnet-4-5.yml not found."
    }

    & gh workflow run apply-claude-sonnet-4-5.yml --repo "GloryMat2025/appmat" --ref main `
        -f namespace=$Namespace `
        -f deployment=$Deployment `
        -f patch_path=$PatchPath

    Write-Host "Opened workflow run. View status:" -ForegroundColor Green
    Write-Host "https://github.com/GloryMat2025/appmat/actions/workflows/apply-claude-sonnet-4-5.yml" -ForegroundColor Blue
    exit 0
}

# Local apply via kubectl wrapper (Windows CMD script)
Write-Host "=== Applying patch locally (kubectl) ===" -ForegroundColor Cyan

if (-not (Test-Path $PatchPath)) { throw "Patch file not found: $PatchPath" }

$applyCmd = Join-Path -Path "src\scripts\k8s" -ChildPath "apply_patch.cmd"
if (-not (Test-Path $applyCmd)) { throw "Missing script: $applyCmd" }

$argsList = @('-n', $Namespace, '-d', $Deployment, '-p', $PatchPath)
if ($Kubeconfig) {
    if (-not (Test-Path $Kubeconfig)) { throw "Kubeconfig not found: $Kubeconfig" }
    $argsList += @('-k', $Kubeconfig)
}

Write-Host "Running: $applyCmd $($argsList -join ' ')" -ForegroundColor DarkGray
& $applyCmd @argsList
exit $LASTEXITCODE
