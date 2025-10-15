<#
Download Playwright/Actions artifacts for a branch to a local folder and extract them.

Usage: run this locally; you will be prompted for a PAT (do NOT paste it into chat).

Requires: PowerShell 5+ (Windows), network access to api.github.com, and a PAT with repo + workflow scopes.

The script will:
- list recent workflow runs for a branch
- allow you to pick a run (default: latest)
- download all artifacts for that run into C:\tmp\artifacts\<run-id> and extract them

Example:
  .\download-playwright-artifacts.ps1 -Owner GloryMat2025 -Repo appmat -Branch e2e/playwright-reservations-fix-local
#>

param(
    [string]$Owner = 'GloryMat2025',
    [string]$Repo = 'appmat',
    [string]$Branch = 'e2e/playwright-reservations-fix-local',
    [string]$OutRoot = 'C:\tmp\artifacts'
)

function Read-PatSecure() {
    $sec = Read-Host 'Paste a GitHub PAT with repo+workflow scopes (won''t be shown)' -AsSecureString
    return [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))
}

Write-Output "Will fetch workflow runs for $Owner/$Repo branch '$Branch'"
$pat = Read-PatSecure
if (-not $pat) { Write-Error 'No PAT provided; aborting'; exit 1 }
$headers = @{ Authorization = "Bearer $pat"; Accept = 'application/vnd.github+json'; 'User-Agent' = 'artifact-downloader' }

try {
    $uri = "https://api.github.com/repos/$Owner/$Repo/actions/runs?branch=$Branch&per_page=20"
    $resp = Invoke-RestMethod -Uri $uri -Headers $headers -ErrorAction Stop
} catch {
    Write-Error "Failed to list workflow runs: $_"; exit 2
}

$runs = $resp.workflow_runs
if (-not $runs) { Write-Error "No workflow runs found for branch $Branch"; exit 3 }

Write-Output "Found $($runs.Count) runs; showing the latest 10"
$runs | Sort-Object created_at -Descending | Select-Object -First 10 | ForEach-Object {
    $i = [array]::IndexOf(($runs | Sort-Object created_at -Descending), $_) + 1
    Write-Output "[$i] id=$($_.id) status=$($_.status) conclusion=$($_.conclusion) created_at=$($_.created_at) workflow=$($_.name)"
}

$choice = Read-Host 'Enter number of run to download (ENTER for latest)'
if (-not $choice) { $run = $runs | Sort-Object created_at -Descending | Select-Object -First 1 } else {
    $idx = [int]$choice - 1
    $run = ($runs | Sort-Object created_at -Descending)[$idx]
}

if (-not $run) { Write-Error 'Invalid selection'; exit 4 }

Write-Output "Selected run id=$($run.id) created_at=$($run.created_at)"

$artsUri = "https://api.github.com/repos/$Owner/$Repo/actions/runs/$($run.id)/artifacts"
try { $artsResp = Invoke-RestMethod -Uri $artsUri -Headers $headers -ErrorAction Stop } catch { Write-Error "Failed to list artifacts: $_"; exit 5 }

$arts = $artsResp.artifacts
if (-not $arts -or $arts.Count -eq 0) { Write-Error 'No artifacts available for this run'; exit 6 }

Write-Output "Found $($arts.Count) artifacts:"
$arts | ForEach-Object { Write-Output " - $($_.name) id=$($_.id) size=$($_.size_in_bytes)" }

$runOut = Join-Path $OutRoot $($run.id.ToString())
if (-not (Test-Path $runOut)) { New-Item -Path $runOut -ItemType Directory -Force | Out-Null }

foreach ($a in $arts) {
    $zipUrl = "https://api.github.com/repos/$Owner/$Repo/actions/artifacts/$($a.id)/zip"
    $dest = Join-Path $runOut ($a.name + '.zip')
    Write-Output "Downloading artifact '$($a.name)' -> $dest"
    try {
        Invoke-WebRequest -Uri $zipUrl -Headers $headers -OutFile $dest -ErrorAction Stop
        Write-Output "Saved $dest"
        # Try to extract
        $extractTo = Join-Path $runOut $a.name
        try {
            Expand-Archive -LiteralPath $dest -DestinationPath $extractTo -Force
            Write-Output "Extracted to $extractTo"
        } catch {
            Write-Warning ("Failed to extract {0}: {1}" -f $dest, $_.Exception.Message)
        }
    } catch {
        Write-Warning "Download failed for artifact $($a.name): $_"
    }
}

Write-Output "Done. Listing downloaded files:"; Get-ChildItem -LiteralPath $runOut -Recurse | Select-Object FullName, Length | Format-Table -AutoSize

Write-Output "If you find a trace.zip inside the extracted folders, run locally: npx playwright show-trace <path-to-trace.zip>"
