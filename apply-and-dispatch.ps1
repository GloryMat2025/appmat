# apply-and-dispatch.ps1
# Usage: run from repo root. Will backup existing workflow, write Patch A, commit & push, then dispatch.
# Requires: git, gh, network access and permissions to push.

$ErrorActionPreference = 'Stop'

# Config
$workflowPath = ".github/workflows/playwright-parity-matrix.yml"
$branchName = "add-playwright-dispatch"
$commitMessage = "ci: add workflow_dispatch run_id and pin pnpm@8 (patch A)"

# Backup existing workflow if present
if (Test-Path $workflowPath) {
    $bak = "$workflowPath.bak.$((Get-Date).ToString('yyyyMMdd-HHmmss'))"
    Copy-Item -Path $workflowPath -Destination $bak -Force
    Write-Output "Backed up existing workflow to: $bak"
} else {
    Write-Output "No existing workflow file found at $workflowPath (will create new)."
}

# Patch A content (YAML)
$yaml = @'
name: Playwright Parity Matrix

on:
  push:
    branches: [ main ]
  workflow_dispatch:
    inputs:
      run_id:
        description: 'Manual run id to use in artifact names (optional)'
        required: false
        default: ''

env:
  NODE_VERSION: '18'
  RUN_ID: ${{ github.event.inputs.run_id || github.run_id }}

jobs:
  parity:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [ chromium, firefox, webkit ]
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Show Node & Git info
        run: |
          node --version
          npm --version || true
          git --version
          echo "RUN_ID=${RUN_ID}"
      
      - name: Cache pnpm store and node_modules
        uses: actions/cache@v4
        with:
          path: |
            ~/.pnpm-store
            node_modules
            .pnpm-store
          key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}-${{ matrix.browser }}-${{ env.RUN_ID }}
          restore-keys: |
            ${{ runner.os }}-pnpm-

      - name: Install pnpm and project deps (robust + verbose)
        run: |
          set -e
          echo "Installing pnpm@8..."
          npm install -g pnpm@8

          echo "pnpm version: $(pnpm --version)"
          echo "Using registry: $(pnpm config get registry || npm config get registry)"

          retries=3
          delay=5
          i=1
          until [ $i -gt $retries ]
          do
            echo "pnpm install attempt #$i ..."
            pnpm install --frozen-lockfile --reporter=ndjson && break
            echo "pnpm install failed, printing diagnostics..."
            pnpm -v || true
            pnpm store status || true
            pnpm config list || true
            i=$((i+1))
            echo "Sleeping ${delay}s before retry..."
            sleep $delay
            delay=$((delay * 2))
          done

          if [ $i -gt $retries ]; then
            echo "pnpm install failed after $retries attempts, listing workspace for debugging:"
            ls -la
            echo "Printing last 200 lines of pnpm logs (if any):"
            find . -type f -name "pnpm-debug.log" -maxdepth 4 -print -exec tail -n 200 {} \; || true
            exit 1
          fi
        shell: bash

      - name: Ensure Playwright browsers
        run: |
          pnpm exec playwright install --with-deps
        shell: bash

      - name: Run Playwright exporter (per-browser)
        run: |
          mkdir -p artifacts || true
          echo "Running exporter for ${matrix.browser} with RUN_ID=${RUN_ID}"
          node --version
          pnpm exec node scripts/svg-to-png-pw.mjs --browser=${{ matrix.browser }} --out=artifacts/${{ matrix.browser }}-${{ env.RUN_ID }}
        shell: bash

      - name: Upload parity artifacts
        uses: actions/upload-artifact@v4
        with:
          name: parity-${{ matrix.browser }}-${{ env.RUN_ID }}
          path: artifacts/${{ matrix.browser }}-${{ env.RUN_ID }}/*.png
'@

# Write workflow file
$yaml | Out-File -FilePath $workflowPath -Encoding utf8

# Git config
git config --global user.email "action@github.com"
git config --global user.name "GitHub Action"

# Commit & push
git add $workflowPath
git commit -m $commitMessage
git push -u origin $branchName

# Dispatch workflow
gh workflow run "playwright-parity-matrix.yml" --ref $branchName -f run_id=$env:GITHUB_RUN_ID

Write-Output "Workflow dispatched: $branchName (run_id: $env:GITHUB_RUN_ID)"
