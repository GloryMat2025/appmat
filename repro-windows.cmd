@echo off
REM repro-windows.cmd — small cmd.exe wrapper to reproduce exports quickly
SETLOCAL ENABLEDELAYEDEXPANSION

REM Usage:
REM   repro-windows.cmd           -> runs Playwright exporter (embed Roboto) and shows SHA/size
REM   repro-windows.cmd docker    -> builds docker image and runs the container experiments

if "%1"=="docker" goto DOCKER

REM Ensure out exists
if not exist out mkdir out

echo Running Playwright exporter (embed vendored Roboto)...
node scripts/svg-to-png-pw.mjs docs/architecture-refined.svg out\pw-embed-roboto-committed.png --embed-font docs/fonts/Roboto-Regular.ttf

if errorlevel 1 (
  echo Playwright exporter exited with error code %ERRORLEVEL%.
  ENDLOCAL
  exit /b %ERRORLEVEL%
)

echo.
echo SHA256 of produced PNG:
certutil -hashfile out\pw-embed-roboto-committed.png SHA256

echo.
echo File size (bytes):
powershell -Command "(Get-Item -Path 'out\\pw-embed-roboto-committed.png').Length"

echo.
echo To run native Docker reproduction: repro-windows.cmd docker

ENDLOCAL
exit /b 0

:DOCKER
echo Building docker image 'appmat-export-ci' using docker/Dockerfile.export-ci ...
docker build -t appmat-export-ci -f docker/Dockerfile.export-ci .
if errorlevel 1 (
  echo Docker build failed with %ERRORLEVEL%.
  exit /b %ERRORLEVEL%
)

echo Running container experiments (mounting current directory)...
docker run --rm -v "%cd%:/workspace" appmat-export-ci /bin/sh -c "mkdir -p /workspace/out && /workspace/scripts/run-experiments.sh"
if errorlevel 1 (
  echo Docker run failed with %ERRORLEVEL%.
  exit /b %ERRORLEVEL%
)

echo Docker run finished. Inspect files under %cd%\out
exit /b 0
