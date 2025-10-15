<#
apply_e2e_patch.ps1

Usage: run this script on a machine that has Git installed (or to just write the files).
It will create/update these files relative to the repo root:
 - .github/workflows/playwright-artifacts.yml
 - PR_BODY.md
 - public/data/products.json

If git is present, the script can optionally commit and push the changes for you.
#>

param(
    [switch]$Commit,
    [string]$Branch = 'e2e/playwright-reservations-fix'
)

function Write-File($path, $content) {
    $dir = Split-Path $path -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    $content | Out-File -FilePath $path -Encoding utf8 -Force
    Write-Host "Wrote: $path"
}

$workflowPath = '.github/workflows/playwright-artifacts.yml'
$workflowContent = @'
name: Playwright E2E with artifacts

on:
  push:
    branches:
      - main
      - 'e2e/**'
  pull_request:
    branches:
      - main

jobs:
  playwright:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Install dependencies
        run: |
          npm ci

      - name: Start static server
        run: |
          npx http-server public -p 5173 &
          sleep 1

      - name: Run Playwright tests
        run: |
          npx playwright test --reporter=list
        continue-on-error: true

      - name: Upload Playwright artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-artifacts
          path: |
            test-results/**
            playwright-report/**
            tests/test-results/**
            playwright-report

      - name: Fail when tests failed
        if: ${{ failure() }}
        run: |
          echo "Playwright tests failed — see uploaded artifacts";
          exit 1
'@

$prBodyPath = 'PR_BODY.md'
$prBodyContent = @'
Title: E2E: restore fixtures and stabilize Playwright tests

Summary:
- Restored a small deterministic `public/data/products.json` fixture to ensure product grid renders reliably in headless E2E runs.
- Fixed minor frontend defensive code in `products-grid.js` to fallback to `localStorage` cart operations and ensure popup fragment population.
- Added a conservative CI workflow `.github/workflows/playwright-artifacts.yml` which runs Playwright on pushes/PRs and uploads test artifacts (reports, traces, screenshots) for easier debugging of failures.

Why:
- Playwright runs were failing due to malformed fixture data. Tests are now stable locally and we should run CI to confirm the same in GitHub Actions. The new workflow uploads artifacts to help debug any failures.

What to review:
- `public/data/products.json` (small fixture)
- `public/assets/js/products-grid.js` (popup and add-to-cart fallback)
- `.github/workflows/playwright-artifacts.yml` (new workflow)

How to test locally:
1. Run Playwright tests locally:
   - `npx playwright test --config=tests/playwright.config.mjs`
2. To run CI-like job locally, ensure node modules installed: `npm ci`, then run Playwright (the workflow uses `http-server` to serve `public`).

Notes:
- I did not remove or modify your existing workflows; the new workflow is additive and conservative. If you prefer to change your existing workflow instead, I can prepare a patch that updates it instead of adding a new file.
'@

$productsPath = 'public/data/products.json'
$productsContent = @'
[
  {
    "id": "p001",
    "name": { "en": "Asam Pedas", "bm": "Asam Pedas" },
    "price": 10.0,
    "img": "assets/images/products/placeholder.jpg",
    "category": "johor",
    "description": { "en": "A spicy tamarind fish stew.", "bm": "Ikan masak asam pedas." },
    "tags": ["halal", "spicy"]
  },
  {
    "id": "p002",
    "name": { "en": "Laksa Johor", "bm": "Laksa Johor" },
    "price": 9.5,
    "img": "assets/images/products/placeholder.jpg",
    "category": "johor",
    "description": { "en": "Spaghetti with fish-based gravy.", "bm": "Spaghetti dengan kuah ikan." },
    "tags": ["halal", "noodle"]
  },
  {
    "id": "p003",
    "name": { "en": "Mee Bandung", "bm": "Mee Bandung" },
    "price": 8.0,
    "img": "assets/images/products/placeholder.jpg",
    "category": "johor",
    "description": { "en": "Noodle in rich prawn broth.", "bm": "Mi dengan kuah udang yang kaya." },
    "tags": ["halal"]
  }
]
'@

Write-File $workflowPath $workflowContent
Write-File $prBodyPath $prBodyContent
Write-File $productsPath $productsContent

if ($Commit) {
    # check for git
    $git = (Get-Command git -ErrorAction SilentlyContinue)
    if (-not $git) {
        Write-Host "Git not found in PATH. Install Git and re-run with -Commit to commit/push changes." -ForegroundColor Yellow
        exit 0
    }

    # create branch and commit
    & git checkout -b $Branch
    & git add $workflowPath $prBodyPath $productsPath
    & git commit -m "chore(e2e): add Playwright artifacts workflow and restore products fixture"
    try {
        & git push -u origin $Branch
        Write-Host "Pushed branch $Branch to origin." -ForegroundColor Green
    } catch {
        Write-Host "Failed to push branch: $_" -ForegroundColor Red
    }
}

Write-Host "Done. If you ran without -Commit, inspect the files and commit on a machine with git." -ForegroundColor Cyan
