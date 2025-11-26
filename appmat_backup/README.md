# 🚀 Appmat Automation

[![Shots Smoke Test](https://github.com/GloryMat2025/appmat/actions/workflows/shots-smoke.yml/badge.svg)](https://github.com/GloryMat2025/appmat/actions/workflows/shots-smoke.yml)
[![Release Workflow](https://github.com/GloryMat2025/appmat/actions/workflows/release.yml/badge.svg)](https://github.com/GloryMat2025/appmat/actions/workflows/release.yml)
[![Version Bump](https://github.com/GloryMat2025/appmat/actions/workflows/version-bump.yml/badge.svg)](https://github.com/GloryMat2025/appmat/actions/workflows/version-bump.yml)

---

## 🧭 Overview

Appmat is an automated screenshot, reporting, and release pipeline powered by Node.js and GitHub Actions. It streamlines project snapshots, HTML gallery generation, version bumping, changelog creation, and GitHub releases — all without manual steps.

```mermaid
flowchart LR
    Dev[Developer] --> Branch[Feature branch]
    Branch --> Commit[Conventional Commit]
    Commit --> PR[Open PR]
    PR --> CI[Shots Smoke (shots-smoke.yml)]
    CI --> Report[Generate gallery + zip]
    Report --> Artifacts[Artifacts uploaded]
    Tagging[Push tag vX.Y.Z] --> ReleaseWorkflow[release.yml]
    ReleaseWorkflow --> Changelog[Generate CHANGELOG]
    Changelog --> GitHubRelease[Create GitHub Release]
    Merge[Merge to main] --> VersionBump[version-bump.yml]
    VersionBump --> Tagging
```

---

## 🧩 Features

- Automated screenshots and HTML gallery
- Cross-platform CI with `pnpm`, Node 20+
- Automatic semantic version bumping
- Auto-generated `CHANGELOG.md`
- GitHub Release with artifacts
- Release guards to prevent empty/broken artifacts

---

## 🗂 Folder Structure (excerpt)

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
  css/base.css
  js/app.js
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

Run a fast, local mock capture:

```bash
pnpm run shots:mock
```

Full capture/report pipeline (requires Playwright browsers & dev server):

```bash
pnpm run capture       # tools/capture.mjs -> screenshots/traces
pnpm run shots:report
pnpm run shots:zip
```

Helpful shortcuts:

| Command                   | Description               |
| ------------------------- | ------------------------- |
| `pnpm run shots:mock`     | Generate mock screenshots |
| `pnpm run shots:report`   | Create HTML gallery       |
| `pnpm run shots:zip`      | Archive latest run        |
| `pnpm run shots:merge`    | Merge and index results   |
| `npm version patch|minor|major` | Manual version bump |

---

## 🧪 CI/CD Workflows

1) Smoke Test — `.github/workflows/shots-smoke.yml`

- Runs on push/PR to `main` or `shots-final`.
- Steps:
  ```bash
  pnpm install --frozen-lockfile
  pnpm run shots:mock
  pnpm run shots:report
  pnpm run shots:zip
  pnpm run shots:merge
  ```

2) Version Bump — `.github/workflows/version-bump.yml`

- Runs on pushes/merges to `main`.
- Uses Conventional Commits to infer patch/minor/major, updates `package.json` and `CHANGELOG.md`, and pushes tag `vX.Y.Z`.

3) Release — `.github/workflows/release.yml`

- Triggers on tag push (`v*`).
- Generates/validates gallery + zip, creates changelog, publishes GitHub Release, uploads artifacts.

---

## 🔖 Version Bump & CHANGELOG

Prefix mapping:

| Prefix              | Bump  |
| ------------------- | ----- |
| `fix:`              | Patch |
| `feat:`             | Minor |
| `BREAKING CHANGE:`  | Major |

Workflow steps:
1. Inspect recent commits on `main`.
2. Determine bump level.
3. Update `package.json` + `CHANGELOG.md`.
4. Commit and push tag `vX.Y.Z` (triggers release).

---

## 🚀 Deployment (Kubernetes patch)

Enable Claude Sonnet 4.5 via env var patch.

- Patch file: `deploy/k8s-patches/my-api-enable-claude-sonnet-4-5.patch.json`
- GitHub Actions workflow: `.github/workflows/apply-claude-sonnet-4-5.yml`
- Local scripts (fallback): `src/scripts/k8s/apply_patch.*`, `src/scripts/k8s/rollback.*`

Via GitHub Actions (recommended):
- Run the `apply-claude-sonnet-4-5` workflow (workflow_dispatch) with inputs:
  - `namespace`: e.g. `staging`
  - `deployment`: e.g. `my-api`
  - `patch_path`: `deploy/k8s-patches/my-api-enable-claude-sonnet-4-5.patch.json`
  - optional `smoke_api_url`
- The workflow uses repository secret `KUBECONFIG` to connect to the cluster and waits for rollout.

Locally with kubeconfig (Windows CMD example):

```cmd
src\scripts\k8s\apply_patch.cmd -n staging -d my-api -p deploy\k8s-patches\my-api-enable-claude-sonnet-4-5.patch.json -k .kube\config
```

Rollback (previous revision):

```cmd
src\scripts\k8s\rollback.cmd -n staging -d my-api -k .kube\config
```

Notes:
- `.kube/config.template` is provided. Do not commit real kubeconfigs; `.kube/` is gitignored.
- Slack notifications are optional and only run if `SLACK_WEBHOOK` is set in repo secrets.

---

## 📣 Notifications

Edge notification pipeline docs are in `supabase/NOTIFICATIONS.md` (setup, secrets, local integration).

---

## 🤖 AI Integration

Claude Sonnet 4.5 is controlled by `ENABLE_CLAUDE_SONNET_4_5=true` (added by the K8s patch). Optional model configs can be placed in `.env` (see `.env.example`).

---

## 👨‍💻 Contributing

- Follow Conventional Commits (e.g., `feat: ...`, `fix: ...`, `docs: ...`).
- PRs run smoke tests; merges to `main` trigger version bumps; tags trigger releases.
# 🚀 Appmat Automation

[![Shots Smoke Test](https://github.com/GloryMat2025/appmat/actions/workflows/shots-smoke.yml/badge.svg)](https://github.com/GloryMat2025/appmat/actions/workflows/shots-smoke.yml)
[![Release Workflow](https://github.com/GloryMat2025/appmat/actions/workflows/release.yml/badge.svg)](https://github.com/GloryMat2025/appmat/actions/workflows/release.yml)
[![Version Bump](https://github.com/GloryMat2025/appmat/actions/workflows/version-bump.yml/badge.svg)](https://github.com/GloryMat2025/appmat/actions/workflows/version-bump.yml)

---

## 🧭 Overview

**Appmat** is an automated screenshot, reporting, and release pipeline powered by Node.js and GitHub Actions.  
It streamlines project snapshots, HTML gallery generation, version bumping, changelog creation, and GitHub releases — all without manual steps.

### Project Architecture Diagram

The diagram below shows how developer actions, the repository scripts, and GitHub workflows interact end-to-end.

```mermaid
flowchart LR
    Dev[Developer] --> Fork[Fork / Clone]
    Fork --> Branch[Create feature branch]
    Branch --> Code[Edit code & scripts\n(e.g. tools/*.mjs, scripts/*.mjs)]
    Code --> Commit[Commit with Conventional Commit message]
    Commit --> PR[Push branch & Open PR]
    PR --> CI[GitHub Actions (shots-smoke.yml)]
    CI --> Mock[Run pnpm run shots:mock]
    CI --> Capture[Run tools/capture.mjs or scripts mock]
    Capture --> Report[Generate gallery (generate-gallery.mjs) => shots/gallery.html]
    Report --> Zip[Zip latest (zip-latest.mjs) => shots/*.zip]
    Zip --> Artifacts[Artifacts: shots/gallery.html + shots/*.zip]
    Tagging[Push tag (vX.Y.Z)] --> ReleaseWorkflow[release.yml]
    ReleaseWorkflow --> Verify[Verify gallery + zip exist & pass checks]
    Verify --> Changelog[Generate / persist CHANGELOG.md]
    Changelog --> GitHubRelease[Create GitHub Release + upload artifacts]
    VersionBump[Push to main (merge PR)] --> VersionWorkflow[version-bump.yml]
    VersionWorkflow --> Tagging
<!-- Exported diagram for presentations -->
![Project Architecture (refined)](docs/architecture-refined.svg)

View the diagram in a standalone page: [docs/index.html](docs/index.html)
```

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

## ⚡ Quick commands

| Command                           | Description                    |
| --------------------------------- | ------------------------------ |
| `pnpm run shots:mock`             | Generate mock screenshots      |
| `pnpm run shots:report`           | Create HTML gallery            |
| `pnpm run shots:zip`              | Archive latest run             |
| `pnpm run shots:merge`            | Merge and index results        |
| `npm version patch\|minor\|major` | Manual version bump (optional) |

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

- Runs on pushes to `main`. Uses `standard-version`/`standard-version` style bumping to update `package.json` and `CHANGELOG.md`, commit the changes and push a `vX.Y.Z` tag.

### **3️⃣ Release – `release.yml`**

Runs automatically whenever a tag is pushed (v1.1.0, etc.)

**Features:**

- Validates `shots/` artifacts exist (gallery + zip)
- Optionally checks for `release:` keyword in the last commit message to gate releases
- Generates changelog (using `metcalfc/changelog-generator`)
- Publishes a GitHub Release and uploads HTML + ZIP files

---

## 🔖 Version Bump & Auto CHANGELOG

The `version-bump.yml` workflow automates semantic version increments and changelog updates.

Commit prefix -> version bump mapping:

| Commit prefix      | Version bump |
| ------------------ | ------------ |
| `fix:`             | Patch        |
| `feat:`            | Minor        |
| `BREAKING CHANGE:` | Major        |

What the workflow does:

1. Scans recent commit messages on `main`.
2. Determines the appropriate bump level (major/minor/patch) from prefixes.
3. Runs `standard-version` (or equivalent) to update `package.json` and `CHANGELOG.md`.
4. Commits the updated files and pushes a tag `vX.Y.Z`.
5. The tag push triggers the `release.yml` workflow which performs release generation and artifact upload.

Notes:

- Ensure commit messages follow the prefix convention above; otherwise, no bump will be performed.
- You can override automatic bumps by creating a PR with the desired version changes, but the CI flow expects the tag push to trigger releases.

---

If you'd like, I can add a short `CONTRIBUTING.md` explaining commit message conventions and how to trigger a release (e.g., commit message examples and tag push instructions).

---

## 🧾 Conventional Commits

Use Conventional Commit prefixes to indicate intent and drive automated version bumps and changelog generation.

Examples:

- `feat: add new gallery layout`
- `fix: correct zip path`
- `docs: update README`
- `chore: cleanup workflow cache`

These prefixes feed the `version-bump.yml` workflow to decide whether to bump patch/minor/major.

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

Runs automatically whenever a tag is pushed (v1.1.0, etc.)

**Features:**

- Validates `shots/` artifacts exist (gallery + zip)
- Optionally checks for `release:` keyword in the last commit message to gate releases
- Generates changelog (using `metcalfc/changelog-generator`)
- Publishes a GitHub Release and uploads HTML + ZIP files

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

````
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
````

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

````
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
````
<<<<<<< HEAD
=======

```mermaid
flowchart TD
  A([🟢 Trigger]) -->|push / PR / manual| B[🏗️ Job: build-and-test]
  B --> C[🧪 Job: parity]
  C --> D[[📦 Output]]

  subgraph "Trigger Events"
    A1(push ke main)
    A2(pull_request)
    A3(workflow_dispatch)
  end
  A1 --> B
  A2 --> B
  A3 --> B

  subgraph "build-and-test"
    B1[Checkout repository]
    B2[Setup Node & pnpm]
    B3[Enable Corepack & Install deps]
    B4[Run Playwright export (PNG)]
    B5[Generate gallery.html]
    B6[Upload Artifacts (ZIP + HTML)]
  end
  B1 --> B2 --> B3 --> B4 --> B5 --> B6

  subgraph "parity"
    C1[Checkout repository]
    C2[Setup Node v22]
    C3[Install dependencies]
    C4[Run Playwright tests (3 browsers)]
    C5[Auto-comment on PR]
  end
  C1 --> C2 --> C3 --> C4 --> C5

  subgraph "Output"
    D1[Artifacts: PNG + gallery.html]
    D2[PR comment: thumbnails + gallery link]
    D3[workflow_dispatch ready]
  end
  D1 --> D2 --> D3

  classDef job fill:#f9f9f9,stroke:#333,stroke-width:1px;
  class B,C job;


> 💡 **Tip:** Kalau kau preview `README.md` di GitHub, diagram ni akan muncul automatik dengan ikon & panah flow.

---

## 🧩 **Apa Yang Dah Lengkap Sekarang**
| Komponen | Status |
|-----------|---------|
| ✅ Workflow YAML (push, PR, manual trigger) | Siap |
| ✅ Matrix (Node × OS, browser) | Siap |
| ✅ Gallery generator (with slider) | Siap |
| ✅ PR comment automation | Siap |
| ✅ Diagram dokumentasi (Mermaid) | Siap |

---

Langkah seterusnya, aku boleh bantu kau:
- 🔖 **Tambahkan dokumentasi “Developer Guide”** (contohnya `docs/ci-overview.md`) — lengkap dengan cara run CI secara lokal dengan `act`.
- atau 💬 **Integrasi notifikasi WhatsApp/Telegram** setiap kali parity test gagal (alert QA team automatik).

Nak saya terus buat versi “Developer CI Guide” untuk folder `docs/`?
```

## Notifications

Appmat includes an edge notification pipeline. See supabase/NOTIFICATIONS.md for setup, required secrets, and local integration instructions.


# 🍽️ AppMat — Mobile Ordering Platform (2025 Edition)

AppMat is a modern food ordering platform featuring:
- Real-time push notifications
- Online payment (Billplz)
- Order tracking
- Supabase backend
- Claude Sonnet 4.5 AI integration
- Kubernetes deployment
- Enterprise CI/CD pipelines

---

## 📁 Project Structure
Refer to `docs/appmat-docs/03_directory-structure.md`.

---

## 🚀 Deployment
Use GitHub Actions:
- `apply-claude-sonnet-4-5.yml`
- `promote-to-prod.yml`
- `rollback.yml`

---

## 🔥 AI Model Fallback Logic
Located under:


Order:
1. Claude Sonnet 4.5  
2. Claude Sonnet 3.7  
3. GPT-4.1-mini  

---

## 📡 Push Notification System
3 Components:
- Client listener
- Push relay
- Edge Functions

Details in `docs/appmat-docs/05_push-system.md`.

---

## 🧪 Tests
CLI tests under `/scripts`:
- Model tests
- Smoke tests
- K8s rollout checks

---

## 👨‍💻 Contributing
Use the migration guide:




>>>>>>> f21627f04ad8552970a779d3f1c2b161aae1a46b
