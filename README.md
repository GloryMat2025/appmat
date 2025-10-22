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

---

## 🧪 CI/CD Workflows

### **1️⃣ Smoke Test – `shots-smoke.yml`**
Runs on every push/PR to `main` or `shots-final`.

**Steps:**
- Install dependencies via `pnpm install --frozen-lockfile`
- Run:
  ```bash
  pnpm run shots:mock
  pnpm run shots:report
  pnpm run shots:zip
  pnpm run shots:merge
  ```

### **2️⃣ Version bump – `version-bump.yml`**
- Runs on merges to `main`. Uses `standard-version` style bumping based on commit messages and pushes a `vX.Y.Z` tag.

### **3️⃣ Release – `release.yml`**
- Triggered by tag pushes `v*`. Generates gallery, creates changelog, verifies artifacts, and publishes a GitHub Release with `shots/gallery.html`, `shots/*.zip` and `CHANGELOG.md` attached.

---

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

If you'd like I can add a Troubleshooting section for Playwright on Windows (browsers, dependencies, required packages).
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
![Shots Smoke Test](https://github.com/GloryMat2025/appmat/actions/workflows/shots-smoke.yml/badge.svg)

# appmat

A small demo app used to exercise Playwright screenshot/trace tooling and CI smoke checks.

## CI workflow overview

```mermaid
graph TD
	A[Push or PR to main] --> B[Shots Smoke Test (shots-smoke.yml)]
	B -->|✅ Passed| C[Version Bump & Auto Tag (version-bump.yml)]
	C -->|New tag vX.Y.Z| D[Release Workflow (release.yml)]
	D --> E[Generate changelog + publish GitHub Release]
	E --> F[Upload artifacts (gallery.html, zip)]
```
