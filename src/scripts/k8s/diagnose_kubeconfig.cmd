@echo off
setlocal enabledelayedexpansion

echo === Kubeconfig Diagnostics (cmd.exe) ===

echo KUBECONFIG (env): %KUBECONFIG%
if defined KUBECONFIG (
  set "EFFECTIVE=%KUBECONFIG%"
  echo Using KUBECONFIG from env.
) else (
  set "EFFECTIVE=%USERPROFILE%\.kube\config"
  echo KUBECONFIG not set; defaulting to %USERPROFILE%\.kube\config
)

echo.
echo Effective kubeconfig path: "%EFFECTIVE%"
if exist "%EFFECTIVE%" (
  echo File exists.
) else (
  echo File NOT found. Create it or set KUBECONFIG.
)

echo.
where kubectl 2>nul
if errorlevel 1 (
  echo kubectl not found on PATH.
) else (
  echo kubectl client version:
  kubectl version --client
)

echo.
echo Contexts (may fail if no config):
kubectl config get-contexts

echo.
echo Current context:
kubectl config current-context

echo.
echo Cluster info (may take time / fail if unreachable):
kubectl cluster-info

echo.
echo Namespace access check (can-i get pods -A):
kubectl auth can-i get pods -A

echo === End Diagnostics ===
echo.
echo Hint: If you see 'illegal base64' errors, your kubeconfig is malformed.
echo - Rebuild via: powershell -NoProfile -ExecutionPolicy Bypass -File .\src\scripts\k8s\build_kubeconfig.ps1 ^
echo   -ServerUrl https://<api-server-url> -Token <bearer-token> -ClusterName <name> -ContextName <name> ^
echo   -Namespace <ns> -OutFile .\.kube\kubeconfig.yaml -CaCertPath C:\path\to\ca.crt
echo - Or on GKE: set USE_GKE_GCLOUD_AUTH_PLUGIN=True ^&^& gcloud container clusters get-credentials <cluster> --zone <zone> --project <project>
exit /b 0
