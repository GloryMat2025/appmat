@echo off
setlocal ENABLEDELAYEDEXPANSION
REM Usage: apply_patch.cmd -n <namespace> -d <deployment> -p <patch_file> [-k <kubeconfig>]

set "NAMESPACE="
set "DEPLOYMENT="
set "PATCH_FILE="
set "KCFG=%KUBECONFIG%"

:parse
if "%~1"=="" goto done_parse
if /I "%~1"=="-n" ( set "NAMESPACE=%~2" & shift & shift & goto parse )
if /I "%~1"=="-d" ( set "DEPLOYMENT=%~2" & shift & shift & goto parse )
if /I "%~1"=="-p" ( set "PATCH_FILE=%~2" & shift & shift & goto parse )
if /I "%~1"=="-k" ( set "KCFG=%~2" & shift & shift & goto parse )
if /I "%~1"=="-h" ( goto usage )
echo Unknown option: %~1
goto usage

:usage
echo Usage: apply_patch.cmd -n ^<namespace^> -d ^<deployment^> -p ^<patch_file^> [-k ^<kubeconfig^>]
exit /b 2

:done_parse
if "%NAMESPACE%"=="" goto usage
if "%DEPLOYMENT%"=="" goto usage
if "%PATCH_FILE%"=="" goto usage

if not exist "%PATCH_FILE%" (
  echo ERROR: Patch file not found: %PATCH_FILE%
  exit /b 3
)

where kubectl >NUL 2>&1
if errorlevel 1 (
  echo ERROR: kubectl not found on PATH
  exit /b 4
)

set "KUBECONFIG=%KCFG%"
if "%KUBECONFIG%"=="" (
  echo Using default kubeconfig
) else (
  echo Using KUBECONFIG=%KUBECONFIG%
)

echo Verifying cluster connectivity...
kubectl version --request-timeout=10s 1>NUL 2>NUL
if errorlevel 1 (
  echo ERROR: Unable to contact cluster (check KUBECONFIG)
  exit /b 5
)

echo Applying patch to deployment/%DEPLOYMENT% in %NAMESPACE%...
kubectl patch deployment %DEPLOYMENT% -n %NAMESPACE% --type=json --patch-file="%PATCH_FILE%"
if errorlevel 1 exit /b %errorlevel%

echo Waiting for rollout...
kubectl rollout status deployment/%DEPLOYMENT% -n %NAMESPACE% --timeout=180s
if errorlevel 1 exit /b %errorlevel%

echo SUCCESS: Patch applied and rollout successful
exit /b 0
