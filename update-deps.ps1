# ==========================================
# APPMAT DEPENDENCY UPDATE SCRIPT
# ==========================================
Write-Host "🔁 Starting Appmat Dependency Updater..." -ForegroundColor Cyan
$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$log = "update-deps-$timestamp.log"

function Log($m){$m | Tee-Object -FilePath $log -Append}

# 1️⃣ Check environment
Log "[1/6] Checking Node & pnpm..."
try {
  Log "Node: $(node -v)"
  Log "pnpm: $(pnpm -v)"
} catch {
  Write-Host "❌ Node.js or pnpm not found." -ForegroundColor Red
  exit 1
}

# 2️⃣ Check outdated dependencies
Log "`n[2/6] Checking outdated packages..."
$outdated = pnpm outdated
$outdated | Tee-Object -FilePath $log -Append

if ($outdated -match "No outdated packages") {
  Write-Host "✅ All dependencies are up-to-date." -ForegroundColor Green
  exit 0
}

Write-Host "`n📦 Outdated packages found:`n"
$outdated | Out-String | Write-Host

# 3️⃣ Ask user choice
$choice = Read-Host "`nChoose update mode:
[A] Update all packages
[B] Manual (one-by-one)
[C] Cancel"

switch ($choice.ToUpper()) {
  "A" {
    Write-Host "🚀 Updating all packages..."
    pnpm update --latest | Tee-Object -FilePath $log -Append
  }
  "B" {
    $lines = $outdated -split "`n" | Select-String "^\S"
    foreach ($line in $lines) {
      $pkg = $line -split "\s+" | Select-Object -First 1
      if ($pkg -and $pkg -notmatch "Package") {
        $ans = Read-Host "Update $pkg? (y/n)"
        if ($ans -eq "y") {
          pnpm update $pkg --latest | Tee-Object -FilePath $log -Append
        }
      }
    }
  }
  Default {
    Write-Host "❌ Cancelled."
    exit 0
  }
}

# 4️⃣ Reinstall deps after update
Log "`n[4/6] Reinstalling dependencies..."
pnpm install --frozen-lockfile

# 5️⃣ Optional: Git commit
if (Test-Path ".git") {
  Log "`n[5/6] Committing changes to Git..."
  git add package.json pnpm-lock.yaml
  git commit -m "chore: update dependencies ($timestamp)" | Tee-Object -FilePath $log -Append
  Write-Host "✅ Changes committed to Git."
} else {
  Write-Host "⚠️ Git not initialized, skipping commit."
}

# 6️⃣ Final summary
Log "`n[6/6] Dependency update complete."
Write-Host "`n✅ All updates done! Log saved to $log" -ForegroundColor Green
exit 0
