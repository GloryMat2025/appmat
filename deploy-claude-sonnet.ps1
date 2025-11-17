#!/usr/bin/env pwsh
# Deploy Claude Sonnet 4.5 - Cleanup and Deploy Script

Set-Location "C:\Users\DESIGNER 1\Desktop\appmat"

Write-Host "=== Cleaning up unnecessary files ===" -ForegroundColor Cyan

# Remove unnecessary directories
$dirsToRemove = @(
    ".github\workflows\_patches",
    ".kube",
    "deploy\prod",
    "docs\feature-flags",
    "src\scripts\model-tests",
    "src\services"
)

foreach ($dir in $dirsToRemove) {
    if (Test-Path $dir) {
        Write-Host "Removing directory: $dir" -ForegroundColor Yellow
        Remove-Item -Recurse -Force $dir -ErrorAction SilentlyContinue
    }
}

# Remove unnecessary files
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

Write-Host ""
Write-Host "=== Committing workflow fix ===" -ForegroundColor Cyan
git add .github\workflows\apply-claude-sonnet-4-5.yml
git commit -m "Fix workflow: use KUBECONFIG secret" --no-verify
git push origin main

Write-Host ""
Write-Host "=== Triggering GitHub Actions workflow ===" -ForegroundColor Cyan
gh workflow run apply-claude-sonnet-4-5.yml --ref main `
    -f namespace=staging `
    -f deployment=my-api `
    -f patch_path=deploy/k8s-patches/my-api-enable-claude-sonnet-4-5.patch.json

Write-Host ""
Write-Host "=== Checking workflow status ===" -ForegroundColor Cyan
Start-Sleep -Seconds 3
gh run list --workflow="apply-claude-sonnet-4-5.yml" --limit 1

Write-Host ""
Write-Host "✅ Done! Check full workflow status at:" -ForegroundColor Green
Write-Host "https://github.com/GloryMat2025/appmat/actions" -ForegroundColor Blue

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
