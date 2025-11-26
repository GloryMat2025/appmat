[CmdletBinding()]
param()

Write-Host "=== Kubeconfig Diagnostics (PowerShell) ==="

Write-Host "KUBECONFIG (env):" $env:KUBECONFIG
if ($env:KUBECONFIG) {
  $effective = $env:KUBECONFIG
  Write-Host "Using KUBECONFIG from env."
} else {
  $effective = Join-Path $HOME ".kube\config"
  Write-Host "KUBECONFIG not set; defaulting to $effective"
}

Write-Host ""
Write-Host "Effective kubeconfig path:" $effective
if (Test-Path $effective) {
  Write-Host "File exists."
} else {
  Write-Warning "File NOT found. Create it or set KUBECONFIG."
}

Write-Host ""
Write-Host "kubectl client version:"
try { kubectl version --client } catch { Write-Warning "kubectl not found or error running kubectl." }

Write-Host ""
Write-Host "Contexts (may fail if no config):"
try { kubectl config get-contexts } catch { Write-Warning $_ }

Write-Host ""
Write-Host "Current context:"
try { kubectl config current-context } catch { Write-Warning $_ }

Write-Host ""
Write-Host "Cluster info (may take time / fail if unreachable):"
try { kubectl cluster-info } catch { Write-Warning $_ }

Write-Host ""
Write-Host "Namespace access check (can-i get pods -A):"
try { kubectl auth can-i get pods -A } catch { Write-Warning $_ }

Write-Host "=== End Diagnostics ==="
Write-Host ""
Write-Host "Hint: If you see 'illegal base64' errors, your kubeconfig is malformed." -ForegroundColor Yellow
Write-Host "- Rebuild via build_kubeconfig.ps1 with real ServerUrl/Token/CA (see docs/k8s-validate.md)."
Write-Host "- Or on GKE: set USE_GKE_GCLOUD_AUTH_PLUGIN=True; gcloud container clusters get-credentials ..."
