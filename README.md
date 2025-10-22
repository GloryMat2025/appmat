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
