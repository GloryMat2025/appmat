# Kubernetes Access & Patch Validation (Windows cmd.exe)

This cheatsheet helps validate kubeconfig access, confirm target deployment, apply the Claude Sonnet 4.5 patch, and verify the env flag.

## 1) Prerequisites

```cmd
where kubectl
kubectl version --client
```

- If using GKE, ensure the auth plugin is enabled in the shell:

```cmd
set USE_GKE_GCLOUD_AUTH_PLUGIN=True
```

## 2) Pick your kubeconfig

- Use default at `%USERPROFILE%\.kube\config` (no action), or use a project one:

```cmd
set KUBECONFIG=%CD%\.kube\kubeconfig.yaml
```

### 2a) Reset KUBECONFIG (remove and use default)

- Current cmd.exe session only:

```cmd
set KUBECONFIG=
set KUBECONFIG
```

- The second command should print nothing if cleared.
- PowerShell session only:

```powershell
Remove-Item Env:KUBECONFIG -ErrorAction SilentlyContinue
$env:KUBECONFIG
```

- Should return blank if cleared.
- Persistently remove (User scope, PowerShell):

```powershell
[Environment]::SetEnvironmentVariable("KUBECONFIG", $null, "User")
```

- Persistently remove (Machine scope, requires admin):

```powershell
Start-Process powershell -Verb RunAs -ArgumentList "-NoProfile -Command [Environment]::SetEnvironmentVariable('KUBECONFIG',$null,'Machine')"
```

- Alternative (cmd.exe, persistent via registry — user scope):

```cmd
reg delete HKCU\Environment /F /V KUBECONFIG
```

After clearing, kubectl falls back to `%USERPROFILE%\.kube\config`.

Quick scripts in repo:

- cmd.exe (session + user, or use `--all` to include machine):

```cmd
src\scripts\k8s\clear_kubeconfig_env.cmd --persist-user
src\scripts\k8s\clear_kubeconfig_env.cmd --all   ^  rem run elevated for machine removal
```

- PowerShell (supports `-All`; run elevated to remove machine scope):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\src\scripts\k8s\clear_kubeconfig_env.ps1 -PersistUser
powershell -NoProfile -ExecutionPolicy Bypass -File .\src\scripts\k8s\clear_kubeconfig_env.ps1 -All    # elevated for machine removal
```

Note: New terminal windows may be required. The PowerShell script broadcasts an environment change when persistent updates are made, but existing processes keep their current environment.

## 3) Connectivity + context

```cmd
kubectl cluster-info
kubectl get ns
kubectl config get-contexts
kubectl config current-context
kubectl auth can-i get pods -A
```

Or use the built-in helper:

```cmd
src\scripts\k8s\diagnose_kubeconfig.cmd
```

If you see base64 decode errors (e.g., `illegal base64 data at input byte N`), run the repair script on a copy inside the workspace:

```powershell
copy %USERPROFILE%\.kube\config .\.kube\kubeconfig.yaml
powershell -NoProfile -ExecutionPolicy Bypass -File .\src\scripts\k8s\repair_kubeconfig.ps1 -InputFile .\.kube\kubeconfig.yaml -VerboseReport
```

To export decoded certs/keys and write a fixed file that uses file references:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\src\scripts\k8s\repair_kubeconfig.ps1 -InputFile .\.kube\kubeconfig.yaml -ExportFiles -FixOutputFile .\.kube\kubeconfig.fixed.yaml
set KUBECONFIG=%CD%\.kube\kubeconfig.fixed.yaml
src\scripts\k8s\diagnose_kubeconfig.cmd
```

## 4) Target selection

```cmd
set NS=<your-namespace>
set DEPLOY=<your-deployment-name>
```

Check deployment exists and is healthy:

```cmd
kubectl -n %NS% get deploy %DEPLOY%
kubectl -n %NS% rollout status deploy/%DEPLOY%
```

## 5) Check the env flag

- Quick list (preferred):

```cmd
kubectl -n %NS% set env deploy/%DEPLOY% --list | findstr ENABLE_CLAUDE_SONNET_4_5
```

- YAML fallback (no assumptions on container names):

```cmd
kubectl -n %NS% get deploy %DEPLOY% -o yaml | findstr ENABLE_CLAUDE_SONNET
```

## 6) Apply the JSON patch

Option A — via repo script (recommended):

```cmd
src\scripts\k8s\apply_patch.cmd -k "%CD%\.kube\kubeconfig.yaml" -n %NS% -d %DEPLOY% -p "deploy\k8s-patches\my-api-enable-claude-sonnet-4-5.patch.json"
```

Option B — direct kubectl (PowerShell to read file):

```powershell
powershell -NoProfile -Command "kubectl -n $env:NS patch deployment $env:DEPLOY --type=json -p (Get-Content -Raw 'deploy\k8s-patches\my-api-enable-claude-sonnet-4-5.patch.json')"
```

Verify rollout and the flag:

```cmd
kubectl -n %NS% rollout status deploy/%DEPLOY%
kubectl -n %NS% set env deploy/%DEPLOY% --list | findstr ENABLE_CLAUDE_SONNET_4_5
```

## 7) Rollback if needed

```cmd
src\scripts\k8s\rollback.cmd -k "%CD%\.kube\kubeconfig.yaml" -n %NS% -d %DEPLOY%
```

Or plain kubectl:

```cmd
kubectl -n %NS% rollout undo deploy/%DEPLOY%
```

## 8) Build kubeconfig (if you don’t use gcloud)

Use the project script with real values (no placeholders):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\src\scripts\k8s\build_kubeconfig.ps1 ^
  -ServerUrl "https://<api-server-url>" ^
  -Token "<bearer-token>" ^
  -ClusterName "<cluster-name>" ^
  -ContextName "<context-name>" ^
  -Namespace "%NS%" ^
  -OutFile ".\.kube\kubeconfig.yaml" ^
  -CaCertPath "C:\path\to\ca.crt"
```

If you must skip TLS temporarily while testing (not for prod):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\src\scripts\k8s\build_kubeconfig.ps1 ^
  -ServerUrl "https://<api-server-url>" ^
  -Token "<bearer-token>" ^
  -ClusterName "<cluster-name>" ^
  -ContextName "<context-name>" ^
  -Namespace "%NS%" ^
  -OutFile ".\.kube\kubeconfig.yaml" ^
  -InsecureSkipTls:$true
```

## 9) Provider-specific quick paths

This cheatsheet is intentionally provider-agnostic. If you use a managed Kubernetes service (for example, AKS, EKS, or another hosted control plane), populate your local kubeconfig using your provider's CLI or control-plane tools, then copy or point to that file from the workspace.

Example (general pattern):

```cmd
copy "%USERPROFILE%\.kube\config" ".\.kube\kubeconfig.yaml"
set KUBECONFIG=%CD%\.kube\kubeconfig.yaml
kubectl get ns
```

If you need provider-specific commands, consult your provider's documentation for the recommended CLI workflow (for example: `az aks get-credentials`, `aws eks update-kubeconfig`, or your cloud provider's equivalent).
