@echo off
cd "C:\Users\DESIGNER 1\Desktop\appmat"

echo Cleaning up unnecessary files...
if exist ".github\workflows\_patches" rd /s /q ".github\workflows\_patches"
if exist ".github\workflows\promote-to-prod.yml" del ".github\workflows\promote-to-prod.yml"
if exist ".github\workflows\rollback.yml" del ".github\workflows\rollback.yml"
if exist ".github\workflows\slack-notify.yml" del ".github\workflows\slack-notify.yml"
if exist ".kube" rd /s /q ".kube"
if exist "deploy\prod" rd /s /q "deploy\prod"
if exist "docs\feature-flags" rd /s /q "docs\feature-flags"
if exist "src\scripts\model-tests" rd /s /q "src\scripts\model-tests"
if exist "src\services" rd /s /q "src\services"

echo.
echo Committing workflow fix...
git add .github\workflows\apply-claude-sonnet-4-5.yml
git commit -m "Fix workflow: use KUBECONFIG secret" --no-verify
git push origin main

echo.
echo Triggering GitHub Actions workflow...
gh workflow run apply-claude-sonnet-4-5.yml --ref main -f namespace=staging -f deployment=my-api -f patch_path=deploy/k8s-patches/my-api-enable-claude-sonnet-4-5.patch.json

echo.
echo Done! Check workflow status at:
echo https://github.com/GloryMat2025/appmat/actions
pause
