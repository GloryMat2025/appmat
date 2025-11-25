# fix-and-reinstall.ps1
Write-Host "🧩 Running package.json cleanup..." -ForegroundColor Cyan
node scripts/fix-package.mjs

# find latest report
$report = Get-ChildItem -Path . -Filter "package-fix-report.*.json" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if (-not $report) {
    Write-Host "❌ No package-fix-report found. Nothing to reinstall." -ForegroundColor Red
    exit 1
}

Write-Host "📄 Using report: $($report.Name)" -ForegroundColor Yellow
$json = Get-Content $report.FullName | ConvertFrom-Json

# extract suggested packages
$pkgs = @()
foreach ($k in $json.suggestions.PSObject.Properties.Name) {
    $v = $json.suggestions.$k
    if ($v) { $pkgs += "$k@$v" }
}

if ($pkgs.Count -eq 0) {
    Write-Host "No suggested packages to install." -ForegroundColor Yellow
    exit 0
}

Write-Host "📦 Installing suggested dependencies:" -ForegroundColor Cyan
Write-Host "npm install $($pkgs -join ' ')" -ForegroundColor Gray

npm install $pkgs

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Done. package.json cleaned and dependencies reinstalled." -ForegroundColor Green
} else {
    Write-Host "`n⚠️ npm install failed." -ForegroundColor Red
}
