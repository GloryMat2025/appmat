@echo off
setlocal enabledelayedexpansion

rem Clear KUBECONFIG in the current cmd.exe session and optionally remove
rem persistent user/machine environment variables.
rem Usage:
rem   clear_kubeconfig_env.cmd [--persist-user] [--persist-machine] [--all]

set "PERSIST_USER="
set "PERSIST_MACHINE="
set "ALL_FLAG="
for %%A in (%*) do (
  if /I "%%~A"=="--persist-user" set "PERSIST_USER=1"
  if /I "%%~A"=="--persist-machine" set "PERSIST_MACHINE=1"
  if /I "%%~A"=="--all" set "ALL_FLAG=1"
)

if defined ALL_FLAG (
  set "PERSIST_USER=1"
  set "PERSIST_MACHINE=1"
)

rem Session-only clear
set KUBECONFIG=
echo Cleared KUBECONFIG for current cmd.exe session.

rem Remove from user scope (HKCU) if requested
if defined PERSIST_USER (
  reg delete HKCU\Environment /F /V KUBECONFIG >nul 2>&1
  if errorlevel 1 (
    echo User-level KUBECONFIG not set or already removed.
  ) else (
    echo Removed user-level KUBECONFIG from HKCU\Environment.
  )
)

rem Remove from machine scope (HKLM) if requested
if defined PERSIST_MACHINE (
  >nul 2>&1 net session
  if errorlevel 1 (
    echo Admin rights required to remove machine-level variable. Re-run elevated.
    exit /b 1
  )
  reg delete "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /F /V KUBECONFIG >nul 2>&1
  if errorlevel 1 (
    echo Machine-level KUBECONFIG not set or already removed.
  ) else (
    echo Removed machine-level KUBECONFIG from HKLM system environment.
  )
)

echo Note: New terminal windows may be required to pick up changes.
echo Done.
exit /b 0
