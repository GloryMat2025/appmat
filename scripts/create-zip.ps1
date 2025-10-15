<#
Create a zip archive of the repo (excluding .git, node_modules, .github, dist) for manual upload.
Usage: Run from repository root (PowerShell):
  Set-ExecutionPolicy Bypass -Scope Process -Force
  .\scripts\create-zip.ps1
#>
param(
  [string]$OutName = "appmat-changes.zip",
  [string[]]$ExcludeFolders = @('.git','node_modules','.github','dist'),
  [switch]$VerboseOutput
)

$ErrorActionPreference = 'Stop'
$root = Get-Location
$zipPath = Join-Path -Path $root -ChildPath $OutName

Write-Host "Creating ZIP archive: $zipPath"

# Build list of files to include (exclude patterns and anything under .git)
$files = Get-ChildItem -Path $root -Recurse -File | Where-Object {
  $full = $_.FullName
  # exclude if any segment matches exclude list
  foreach ($ex in $ExcludeFolders) { if ($full -match [regex]::Escape("\\$ex\\")) { return $false } }
  return $true
}

if ($VerboseOutput) { Write-Host "Files to include: $($files.Count)" }

# Remove existing zip if present
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

# Compress
Compress-Archive -Path ($files | ForEach-Object { $_.FullName }) -DestinationPath $zipPath -Force

Write-Host "Created: $zipPath`nSize: $((Get-Item $zipPath).Length) bytes"
Write-Host "Next: upload this ZIP to a PR or issue, and paste the URL here for review."
