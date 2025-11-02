<#
PowerShell helper: fix-git-pr.ps1

Usage (PowerShell):
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  cd <repo-root>
  pwsh ./scripts/fix-git-pr.ps1

What it does:
 - Checks presence of `git` and `gh` on PATH
 - Shows versions and auth status
 - Fetches origin and shows commits/diff between origin/main and current branch
 - If no commit delta, it can create an empty commit and push (confirm first)
 - Optionally runs `gh pr create` to open a draft PR (confirm first)

Outputs helpful diagnostic lines you can paste back to the assistant.
#>

param(
    [switch] $AutoFixEmptyCommit,   # If set, create an empty commit automatically when no delta
    [switch] $AutoCreatePR,         # If set, run gh pr create automatically (asks for details)
    [string] $PrTitle = "ci: add Playwright parity matrix workflow (manual)",
    [string] $PrBody = "Add manual Playwright parity matrix workflow (manual dispatch) for review.",
    [string] $BaseBranch = "main"
)

function Write-Header($t){ Write-Host "`n=== $t ===`n" -ForegroundColor Cyan }

Write-Header "Environment checks"

# git
if (Get-Command git -ErrorAction SilentlyContinue) {
    $gver = git --version
    Write-Host "git:" $gver
} else { Write-Host "git: NOT FOUND on PATH" -ForegroundColor Red }

# gh
if (Get-Command gh -ErrorAction SilentlyContinue) {
    $ghver = gh --version
    Write-Host "gh:" $ghver
    Write-Host "gh auth status:"
    gh auth status 2>&1 | ForEach-Object { Write-Host "  $_" }
} else { Write-Host "gh: NOT FOUND on PATH" -ForegroundColor Red }

# repo root
$repoRoot = (git rev-parse --show-toplevel 2>$null) -replace '\\$',''
if ([string]::IsNullOrEmpty($repoRoot)) {
    Write-Host "Not inside a git repository. cd to your repo root and re-run this script." -ForegroundColor Red
    exit 2
}
Write-Host "Repo root:" $repoRoot

# current branch
$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "Current branch:" $currentBranch

Write-Header "Fetch origin and compare"

git fetch origin --prune 2>&1 | ForEach-Object { Write-Host "  $_" }

# Show commits difference (origin/main..HEAD)
Write-Host "Commits on $currentBranch not on origin/$BaseBranch:"
$commits = git --no-pager log --oneline origin/$BaseBranch..HEAD 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Unable to run git log; check remotes/branch names." -ForegroundColor Yellow
} else {
    if ([string]::IsNullOrWhiteSpace($commits)) { Write-Host "  (no commits)" -ForegroundColor Yellow }
    else { $commits | ForEach-Object { Write-Host "  $_" } }
}

# Show changed files
Write-Host "Files changed vs origin/$BaseBranch:"
$diffFiles = git diff --name-only origin/$BaseBranch...HEAD
if ([string]::IsNullOrWhiteSpace($diffFiles)) { Write-Host "  (no file changes)" -ForegroundColor Yellow }
else { $diffFiles | ForEach-Object { Write-Host "  $_" } }

# Check whether workflow exists on origin/main
$workflowPath = ".github/workflows/playwright-parity-matrix.yml"
Write-Host "Checking whether $workflowPath exists on origin/$BaseBranch..."
$exists = $true
try {
    $content = git show origin/$BaseBranch:`$workflowPath 2>&1
    if ($content -match "Path '.*' does not exist") { $exists = $false }
} catch {
    $exists = $false
}
if ($exists) {
    Write-Host "Workflow already exists on origin/$BaseBranch." -ForegroundColor Yellow
} else {
    Write-Host "Workflow NOT found on origin/$BaseBranch." -ForegroundColor Green
}

Write-Header "Suggested actions / automated fixes"

if ($diffFiles -and $diffFiles -match [regex]::Escape($workflowPath)) {
    Write-Host "Your branch already modifies the workflow file. You should be able to create a PR." -ForegroundColor Green
    Write-Host "Run: gh pr create --base $BaseBranch --head $currentBranch --draft --title \"$PrTitle\" --body \"$PrBody\""
    if ($AutoCreatePR) {
        Write-Host "Attempting to create PR now..."
        gh pr create --base $BaseBranch --head $currentBranch --draft --title "$PrTitle" --body "$PrBody"
        if ($LASTEXITCODE -eq 0) { Write-Host "PR created." -ForegroundColor Green } else { Write-Host "gh pr create failed; check output above." -ForegroundColor Red }
    }
} else {
    # no diff or workflow not present on branch
    if ($exists) {
        Write-Host "Because the workflow already exists on $BaseBranch, GitHub reports no commits between the branches. No PR is needed unless you intended to change the file." -ForegroundColor Yellow
        Write-Host "If you wanted a PR for review, either make a small non-functional edit to the workflow file, or create a new branch with a small comment change. Example:"
        Write-Host "  git checkout -b add-playwright-parity-workflow-2"
        Write-Host "  (edit $workflowPath add a comment)"
        Write-Host "  git add $workflowPath && git commit -m \"chore(ci): small comment for review\" && git push -u origin add-playwright-parity-workflow-2"
    } else {
        Write-Host "No commit delta found and the workflow is not on $BaseBranch — it may not have been committed to your branch or push didn't include it." -ForegroundColor Yellow
        Write-Host "If you want to force a draft PR for reviewers (harmless empty commit), you can run the next step."

        if ($AutoFixEmptyCommit) {
            Write-Host "Creating empty commit to force PR..."
            git commit --allow-empty -m "chore(ci): create branch for Playwright parity matrix workflow" || Write-Host "empty commit failed" -ForegroundColor Red
            git push origin $currentBranch
            if ($AutoCreatePR) {
                gh pr create --base $BaseBranch --head $currentBranch --draft --title "$PrTitle" --body "$PrBody"
                if ($LASTEXITCODE -eq 0) { Write-Host "PR created." -ForegroundColor Green } else { Write-Host "gh pr create failed; check output above." -ForegroundColor Red }
            } else {
                Write-Host "Empty commit pushed. Now run: gh pr create --base $BaseBranch --head $currentBranch --draft --title \"$PrTitle\" --body \"$PrBody\""
            }
        } else {
            Write-Host "To force a PR you can run (confirm first):"
            Write-Host "  git commit --allow-empty -m \"chore(ci): create branch for Playwright parity matrix workflow\""
            Write-Host "  git push origin $currentBranch"
            Write-Host "  gh pr create --base $BaseBranch --head $currentBranch --draft --title \"$PrTitle\" --body \"$PrBody\""
        }
    }
}

Write-Header "If things still fail"
Write-Host "1) Ensure you're authenticated with GitHub CLI: gh auth status (or gh auth login)"
Write-Host "2) Ensure remote 'origin' points to the GitHub repo: git remote -v"
Write-Host "3) If gh errors with GraphQL 'No commits between', it's because there's zero commit delta. Use the empty commit workaround above." 
Write-Host "4) As a last resort, open the compare view in your browser to create the PR manually:
  https://github.com/GloryMat2025/appmat/compare/$BaseBranch...$currentBranch?expand=1"

Write-Host "\nIf the script outputs something unclear, paste the output here and I'll finish the next steps for you."

# End
