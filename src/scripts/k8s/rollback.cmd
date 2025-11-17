@echo off
setlocal ENABLEDELAYEDEXPANSION
REM Usage: rollback.cmd -n <namespace> -d <deployment> [-k <kubeconfig>]

set "NAMESPACE="
set "DEPLOYMENT="
set "KCFG=%KUBECONFIG%"

:parse
if "%~1"=="" goto done_parse
if /I "%~1"=="-n" ( set "NAMESPACE=%~2" & shift & shift & goto parse )
if /I "%~1"=="-d" ( set "DEPLOYMENT=%~2" & shift & shift & goto parse )
if /I "%~1"=="-k" ( set "KCFG=%~2" & shift & shift & goto parse )
if /I "%~1"=="-h" ( goto usage )
echo Unknown option: %~1
goto usage

:usage
echo Usage: rollback.cmd -n ^<namespace^> -d ^<deployment^> [-k ^<kubeconfig^>]
exit /b 2

:done_parse
if "%NAMESPACE%"=="" goto usage
if "%DEPLOYMENT%"=="" goto usage

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

echo Rolling back deployment/%DEPLOYMENT% in %NAMESPACE%...
kubectl rollout undo deployment/%DEPLOYMENT% -n %NAMESPACE%
if errorlevel 1 exit /b %errorlevel%

echo Waiting for rollout...
kubectl rollout status deployment/%DEPLOYMENT% -n %NAMESPACE% --timeout=180s
if errorlevel 1 exit /b %errorlevel%

echo SUCCESS: Rollback completed
exit /b 0
