# 🚀 Appmat Automation

[![Shots Smoke Test](https://github.com/GloryMat2025/appmat/actions/workflows/shots-smoke.yml/badge.svg)](https://github.com/GloryMat2025/appmat/actions/workflows/shots-smoke.yml)
[![Release Workflow](https://github.com/GloryMat2025/appmat/actions/workflows/release.yml/badge.svg)](https://github.com/GloryMat2025/appmat/actions/workflows/release.yml)
[![Version Bump](https://github.com/GloryMat2025/appmat/actions/workflows/version-bump.yml/badge.svg)](https://github.com/GloryMat2025/appmat/actions/workflows/version-bump.yml)

---

## 🧭 Overview

**Appmat** is an automated screenshot, reporting, and release pipeline powered by Node.js and GitHub Actions.  
It streamlines project snapshots, HTML gallery generation, version bumping, changelog creation, and GitHub releases — all without manual steps.

---

## 🧩 Features

- 🧪 **Automated Shots & Reports** via Playwright or mock runs  
- 🧰 **Cross-platform CI/CD** with `pnpm`, Node 20, and GitHub Actions  
- 🧱 **Auto Version Bump** (based on commit messages)  
- 🧾 **Auto CHANGELOG.md** generation  
- 🚀 **Automatic Releases** with uploaded gallery + ZIP artifacts  
- 🔒 **Release Guards** — only trigger if artifacts exist and pipeline passes  

---

## 🗂 Folder Structure

```
index.html
package.json
pnpm-lock.yaml
README.md
tailwind.config.js
appmat/
    index.html
    package.json
    public/
    src/
        counter.js
        main.js
        style.css
assets/
    css/
        base.css
    js/
        app.js
components/
    footer.html
    header.html
    modals/
        delivery.html
        pickup.html
        product-detail.html
data/
    outlets.json
    products.json
pages/
    account.html
    cart.html
    checkout.html
    home.html
    menu.html
    rewards.html
scripts/
    fix-all.js
src/
    index.css
```

---

## ▶️ Usage

Run a mock capture locally (fast):

```bash
pnpm run shots:mock
```

Run the full capture/report pipeline (requires Playwright browsers & dev server):

```bash
pnpm run capture  # uses tools/capture.mjs to produce screenshots/traces
pnpm run shots:report
pnpm run shots:zip
```

## 📦 How releases work

- The `version-bump.yml` workflow bumps the package version on `main` when commit messages follow conventional style (e.g. `feat:`, `fix:`, `chore:`) and pushes a tag like `v1.2.3`.
- The `release.yml` workflow is triggered by a tag push (`v*`). It performs the following high-level steps:
    1. Checkout full history (`fetch-depth: 0`) so commit message checks work.
    2. Run smoke steps that can generate the latest `shots/` outputs (mock or real captures).
    3. Generate an HTML gallery (`shots/gallery.html`) and zip the latest shots.
    4. Verify the gallery contains images and at least one zip is non-trivial (>= 1 KB). If verification fails the release is aborted.
    5. Generate a changelog and create a GitHub release with the changelog as the body.
    6. Upload `shots/gallery.html`, `shots/*.zip`, and `CHANGELOG.md` as release artifacts.

If you prefer artifacts to be pre-committed rather than generated in-job, the verify step can be moved to the start of the job (or made non-blocking).

---

## Local pnpm (recommended)

This repository uses pnpm for frontend package management. To avoid requiring a global pnpm install, we recommend using Node's Corepack to activate pnpm:

```bash
# enable corepack and prepare pnpm (one-time per dev machine)
corepack enable
corepack prepare pnpm@8.10.0 --activate
```

Apply edits automatically (PowerShell recipe)
- The following PowerShell helper will:
  - create backups (.bak.TIMESTAMP) for each file it updates,
  - insert the PowerShell snippet at the top of each listed PS1 file if it's not already present,
  - create a backup of the batch file and insert the batch snippet if needed,
  - add the README fragment (appends if not present),
  - show the list of changed files.

Save as `prepare-local-pnpm.ps1` and run from repo root (pwsh):

```powershell
# prepare-local-pnpm.ps1
$psFiles = @(
  "verify-all.ps1",
  "update-deps.ps1",
  "init-dev.ps1",
  "fix-and-start-dev.ps1",
  "fix-rebuild-esbuild.ps1",
  "fix-esbuild.ps1",
  "fix-esbuild-rescue.ps1",
  "fix-esbuild-noninteractive.ps1",
  "fix-all.ps1",
  "restore-rebuild-esbuild.ps1"
) | ForEach-Object { Join-Path $PWD $_ } | Where-Object { Test-Path $_ }

$batFile = Join-Path $PWD "setup-dev.bat"
$readme = Join-Path $PWD "README.md"

$psSnippet = @'
# Ensure pnpm is available via Corepack (idempotent)
if (Get-Command corepack -ErrorAction SilentlyContinue) {
    Write-Host "Enabling Corepack and preparing pnpm@8.10.0..."
    & corepack enable
    & corepack prepare pnpm@8.10.0 --activate
} else {
    Write-Host "Corepack not found. If you expect pnpm to be available, install pnpm or update Node to a Corepack-enabled version."
}
'@

$batSnippet = @'
:: Ensure pnpm is available via Corepack (idempotent)
where corepack >nul 2>&1
if %ERRORLEVEL%==0 (
  echo Enabling Corepack and preparing pnpm@8.10.0...
  corepack enable
  corepack prepare pnpm@8.10.0 --activate
) else (
  echo Corepack not found. Please install pnpm or Node >=16.10 which includes corepack.
)
'@

$readmeFragment = @'
### Local pnpm (recommended)

This repository uses pnpm for frontend package management. To avoid requiring a global pnpm install, we recommend using Node's Corepack to activate pnpm:

```bash
# enable corepack and prepare pnpm (one-time per dev machine)
corepack enable
corepack prepare pnpm@8.10.0 --activate
```
