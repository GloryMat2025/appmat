param(
  [Parameter(Mandatory=$true)][string]$ServerUrl,
  [Parameter(Mandatory=$false)][string]$Token,
  [Parameter(Mandatory=$false)][string]$CaFile,
  [Parameter(Mandatory=$false)][switch]$InsecureSkipTls,
  [Parameter(Mandatory=$false)][string]$Namespace = 'staging',
  [Parameter(Mandatory=$false)][string]$ClusterName = 'appmat-cluster',
  [Parameter(Mandatory=$false)][string]$UserName = 'appmat-user',
  [Parameter(Mandatory=$false)][string]$ContextName = 'appmat-staging',
  [Parameter(Mandatory=$false)][string]$Output = '.\.kube\kubeconfig.yaml',
  [Parameter(Mandatory=$false)][switch]$AutoTest
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Basic validation and environment checks
$kubectl = Get-Command kubectl -ErrorAction SilentlyContinue
if (-not $kubectl) { throw "kubectl not found on PATH. Install kubectl and try again." }

if ([string]::IsNullOrWhiteSpace($ServerUrl) -or $ServerUrl -match 'YOUR-API-SERVER') {
  throw "ServerUrl is a placeholder. Provide your real Kubernetes API server URL."
}

if ($Token -and ($Token -match 'PASTE_YOUR_BEARER_TOKEN' -or [string]::IsNullOrWhiteSpace($Token))) {
  throw "Token is a placeholder/empty. Provide a real bearer token or omit -Token and configure client certs later."
}

if (-not $InsecureSkipTls -and -not $CaFile) {
  Write-Host 'TLS: either provide -CaFile or set -InsecureSkipTls to bypass temporarily.' -ForegroundColor Yellow
}

# Prepare output path without resolving before creation
$outDir = Split-Path -Parent $Output
if ($outDir -and -not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }
Remove-Item -LiteralPath $Output -Force -ErrorAction SilentlyContinue
$kubeconfigFull = [System.IO.Path]::GetFullPath($Output)
$env:KUBECONFIG = $kubeconfigFull

Write-Host "Using KUBECONFIG=$env:KUBECONFIG" -ForegroundColor Cyan

# Configure cluster
if ($CaFile) {
  if (-not (Test-Path $CaFile)) { throw "CA file not found: $CaFile" }
  kubectl config set-cluster $ClusterName --server=$ServerUrl --certificate-authority=(Resolve-Path $CaFile).Path --embed-certs=true | Out-Null
} elseif ($InsecureSkipTls) {
  kubectl config set-cluster $ClusterName --server=$ServerUrl --insecure-skip-tls-verify=true | Out-Null
} else {
  Write-Warning 'Proceeding without CA or insecure flag may fail TLS verification.'
  kubectl config set-cluster $ClusterName --server=$ServerUrl | Out-Null
}

# Configure credentials
if ($Token) {
  kubectl config set-credentials $UserName --token=$Token | Out-Null
} else {
  Write-Warning 'No credentials configured (no token provided). You can run:` kubectl config set-credentials '+$UserName+' --client-certificate=client.crt --client-key=client.key --embed-certs=true'
}

# Context
kubectl config set-context $ContextName --cluster=$ClusterName --user=$UserName --namespace=$Namespace | Out-Null
kubectl config use-context $ContextName | Out-Null

Write-Host 'kubeconfig created. Summary:' -ForegroundColor Green
kubectl config view

if ($AutoTest) {
  Write-Host 'Testing cluster connectivity...' -ForegroundColor Yellow
  kubectl cluster-info || Write-Warning 'cluster-info failed'
  kubectl get ns || Write-Warning 'get ns failed'
}

Write-Host 'Next:' -ForegroundColor Cyan
Write-Host '  - Verify: kubectl cluster-info' -ForegroundColor Cyan
Write-Host '  - List:   kubectl get ns' -ForegroundColor Cyan
Write-Host "  - Use with scripts: src\scripts\k8s\apply_patch.cmd -n $Namespace -d my-api -p deploy\k8s-patches\my-api-enable-claude-sonnet-4-5.patch.json -k `"$($env:KUBECONFIG)`"" -ForegroundColor Cyan
