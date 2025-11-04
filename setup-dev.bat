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

:: Ensure pnpm is available via Corepack (idempotent)
where corepack >nul 2>&1
if %ERRORLEVEL%==0 (
  echo Enabling Corepack and preparing pnpm@8.10.0...
  corepack enable
  corepack prepare pnpm@8.10.0 --activate
) else (
  echo Corepack not found. Please install pnpm or Node >=16.10 which includes corepack.
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
