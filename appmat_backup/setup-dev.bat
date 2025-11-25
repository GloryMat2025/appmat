@echo off
echo ==========================================
echo   APPMAT DEV SETUP (Windows Batch)
echo ==========================================

:: Step 1 — Check pnpm availability
echo.
echo [1/2] Checking pnpm...
pnpm -v >NUL 2>&1
if %ERRORLEVEL% neq 0 (
    echo ⚠️ pnpm not found. Installing globally...
    npm install -g pnpm
) else (
    for /f "delims=" %%v in ('pnpm -v') do set PNPM_VERSION=%%v
    echo ✅ pnpm version %PNPM_VERSION% found.
)

:: Step 2 — Install dependencies
echo.
echo [2/2] Installing dependencies...
pnpm install --frozen-lockfile
if %ERRORLEVEL% neq 0 (
    echo ⚠️ Failed to install with frozen lockfile, retrying...
    pnpm install
)

echo.
echo ✅ Setup complete! You can now run: pnpm run dev
pause
