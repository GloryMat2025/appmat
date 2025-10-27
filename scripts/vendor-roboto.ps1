<#
Download and commit Roboto-Regular.ttf into docs/fonts/ and create a deterministic vendor commit.

Usage (PowerShell, run from repo root):
  .\scripts\vendor-roboto.ps1 -Commit

By default this script will:
 - ensure docs/fonts exists
 - download Roboto-Regular.ttf from Google Fonts (GitHub raw)
 - verify the downloaded file size looks sane
 - add and commit the font file to git with a clear commit message

This script requires network access and git on PATH. Run interactively to review before committing.
#>

param(
    [switch] $Commit,
    [string] $Url = ''
)

Set-StrictMode -Version Latest

$fontsDir = Join-Path -Path (Get-Location) -ChildPath 'docs\fonts'
if (-not (Test-Path $fontsDir)) {
    Write-Host "Creating fonts directory: $fontsDir"
    New-Item -ItemType Directory -Path $fontsDir | Out-Null
}

$outPath = Join-Path $fontsDir 'Roboto-Regular.ttf'

$candidates = @()
if ($Url -and $Url.Trim() -ne '') { $candidates += $Url }
# Common raw locations to try (GitHub raw, github raw alias)
$candidates += 'https://raw.githubusercontent.com/google/fonts/main/apache/roboto/Roboto-Regular.ttf'
$candidates += 'https://github.com/google/fonts/raw/main/apache/roboto/Roboto-Regular.ttf'

$downloaded = $false
# If the file already exists, skip downloading and treat as downloaded
if (Test-Path $outPath) {
    Write-Host "Font already present at: $outPath — skipping download"
    $downloaded = $true
}

# Only attempt downloads when the file is not already present
if (-not $downloaded) {
    foreach ($u in $candidates) {
        Write-Host "Attempting download from: $u"
        try {
            Invoke-WebRequest -Uri $u -OutFile $outPath -UseBasicParsing -ErrorAction Stop
            $downloaded = $true
            break
        } catch {
            Write-Warning "Download from $u failed: $($_.Exception.Message)"
        }
    }
}

if (-not $downloaded) {
    Write-Error "All download attempts failed. You can manually download Roboto-Regular.ttf from https://github.com/google/fonts/tree/main/apache/roboto and place it at $outPath"
    exit 2
}

if (-not (Test-Path $outPath)) {
    Write-Error "Download did not produce $outPath"
    exit 3
}

$size = (Get-Item $outPath).Length
Write-Host "Downloaded: $outPath ($size bytes)"

if ($size -lt 10000) {
    Write-Warning "Downloaded file is unexpectedly small (<10KB). Aborting commit. Inspect $outPath manually."
    exit 4
}

if ($Commit) {
    Write-Host "Staging and committing $outPath"
    git add -A -- "$outPath"
    # Detect whether any files are staged; if nothing staged then there's nothing to commit
    $staged = & git diff --cached --name-only
    if ([string]::IsNullOrWhiteSpace($staged)) {
        Write-Host "No changes to commit for $outPath"
    } else {
        git commit -m "chore: vendor Roboto-Regular.ttf into docs/fonts (for deterministic SVG->PNG exports)"
        if ($LASTEXITCODE -ne 0) {
            Write-Error "git commit failed (exit $LASTEXITCODE). Check git status and run the command manually."
            exit 5
        }
        Write-Host "Committed Roboto-Regular.ttf"
    }
} else {
    Write-Host "Downloaded file is ready at: $outPath"
    Write-Host "To commit it, re-run this script with -Commit or run: git add docs/fonts/Roboto-Regular.ttf && git commit -m 'chore: vendor Roboto-Regular.ttf'"
}
