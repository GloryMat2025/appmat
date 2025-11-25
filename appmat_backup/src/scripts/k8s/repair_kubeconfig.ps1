[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)][string]$InputFile,
  [string]$FixOutputFile,
  [string]$ExportDir,
  [switch]$ExportFiles,
  [switch]$VerboseReport
)

if (!(Test-Path $InputFile)) { Write-Error "Input file not found: $InputFile"; exit 1 }
$raw = Get-Content -Raw -ErrorAction Stop $InputFile
$lines = $raw -split "`r?`n"

$fields = @('certificate-authority-data','client-certificate-data','client-key-data')
$invalid = @()
$decoded = @{}

foreach ($f in $fields) { $decoded[$f] = $null }

function Test-Base64([string]$s) {
  try {
    $bytes = [Convert]::FromBase64String($s)
    return $bytes
  } catch { return $null }
}

foreach ($line in $lines) {
  foreach ($f in $fields) {
    if ($line -match "^\s*${f}:\s*(.+)$") {
      $val = $Matches[1].Trim()
      $bytes = Test-Base64 $val
      if ($bytes -eq $null) {
        $invalid += [pscustomobject]@{ Field=$f; Value=$val; Line=$line }
      } else {
        $decoded[$f] = $bytes
      }
    }
  }
}

Write-Host "Scanned fields: $($fields -join ', ')"
if ($invalid.Count -gt 0) {
  Write-Warning "Malformed base64 detected in $($invalid.Count) field(s)."
  if ($VerboseReport) { $invalid | Format-Table -AutoSize }
} else {
  Write-Host "All base64 fields decoded successfully." -ForegroundColor Green
}

if ($ExportFiles -and $decoded.Values.Where({$_ -ne $null}).Count -gt 0) {
  if (-not $ExportDir) { $ExportDir = Join-Path (Split-Path $InputFile -Parent) 'exported-certs' }
  if (!(Test-Path $ExportDir)) { New-Item -ItemType Directory -Path $ExportDir | Out-Null }
  $map = @{}
  foreach ($kv in $decoded.GetEnumerator()) {
    if ($kv.Value -ne $null) {
      $outfile = Join-Path $ExportDir ($kv.Key + '.pem')
      [IO.File]::WriteAllBytes($outfile,$kv.Value)
      $map[$kv.Key] = $outfile
      Write-Host "Exported $($kv.Key) -> $outfile"
    }
  }
  if ($FixOutputFile) {
    $newLines = @()
    foreach ($line in $lines) {
      $replaced = $false
      foreach ($f in $fields) {
        if ($line -match "^\s*${f}:\s*(.+)$" -and $map.ContainsKey($f)) {
          # Replace data field with file path variant
          switch ($f) {
            'certificate-authority-data' { $newLines += ($line -replace ($f + ':'), 'certificate-authority:') -replace 'certificate-authority-data','certificate-authority'; $newLines[-1] = "certificate-authority: $($map[$f])"; $replaced=$true }
            'client-certificate-data'    { $newLines += "client-certificate: $($map[$f])"; $replaced=$true }
            'client-key-data'            { $newLines += "client-key: $($map[$f])"; $replaced=$true }
          }
        }
      }
      if (-not $replaced) { $newLines += $line }
    }
    Set-Content -Path $FixOutputFile -Value ($newLines -join "`n") -NoNewline
    Write-Host "Wrote repaired kubeconfig with file paths: $FixOutputFile"
  }
}

Write-Host "Summary:"
Write-Host "  Invalid fields: $($invalid.Count)"
Write-Host "  Exported fields: $($decoded.Values.Where({$_ -ne $null}).Count)"
if ($invalid.Count -gt 0) { Write-Host "  Action: Rebuild via build_kubeconfig.ps1 or supply correct base64" }
Write-Host "Done."
