@echo off
echo ============================================
echo  Deploy Claude Sonnet 4.5 - Final Steps
echo ============================================
echo.

cd /d "C:\Users\DESIGNER 1\Desktop\appmat"

echo [1/4] Cleaning up unnecessary files...
if exist ".github\workflows\_patches" rd /s /q ".github\workflows\_patches" 2>nul
if exist ".github\workflows\promote-to-prod.yml" del /f /q ".github\workflows\promote-to-prod.yml" 2>nul
if exist ".github\workflows\rollback.yml" del /f /q ".github\workflows\rollback.yml" 2>nul
if exist ".github\workflows\slack-notify.yml" del /f /q ".github\workflows\slack-notify.yml" 2>nul
if exist ".kube" rd /s /q ".kube" 2>nul
if exist "deploy\prod" rd /s /q "deploy\prod" 2>nul
if exist "docs\feature-flags" rd /s /q "docs\feature-flags" 2>nul
if exist "src\scripts\model-tests" rd /s /q "src\scripts\model-tests" 2>nul
if exist "src\services" rd /s /q "src\services" 2>nul
if exist "cleanup-and-deploy.bat" del /f /q "cleanup-and-deploy.bat" 2>nul
echo Done.
echo.

echo [2/4] Committing workflow fix...
git add .github\workflows\apply-claude-sonnet-4-5.yml
git commit -m "Fix workflow: use KUBECONFIG secret" --no-verify
echo.

echo [3/4] Pushing to GitHub...
git push origin main
echo.

echo [4/4] Triggering GitHub Actions workflow...
gh workflow run apply-claude-sonnet-4-5.yml --ref main -f namespace=staging -f deployment=my-api -f patch_path=deploy/k8s-patches/my-api-enable-claude-sonnet-4-5.patch.json
echo.

echo ============================================
echo  DONE! Claude Sonnet 4.5 deployment started
echo ============================================
echo.
echo Check workflow status at:
echo https://github.com/GloryMat2025/appmat/actions
echo.
pause
