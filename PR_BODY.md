PR title
---------
feat(docs): add PNG export + CI exporter workflow

Summary
-------
This PR adds a reproducible export path for the project's architecture diagram and hardens the CI export flow to avoid native build approval issues. It prefers a Sharp-based exporter when available, falls back to a Playwright renderer locally, and uses `rsvg-convert` on CI with a Node fallback. The changes also include a committed PNG for immediate consumption in the docs.

Changed files
-------------
- .github/workflows/ci.yml (new)
- .github/workflows/deploy.yml (new)
- .github/workflows/export-architecture-png.yml (new/updated) — try rsvg-convert, fallback to Node export, verify PNG size
- scripts/svg-to-png-pw.mjs (new) — Playwright-based exporter
- package.json (updated) — merged scripts and `docs:export-png` fallback

Reviewer checklist
------------------
 - [ ] Confirm the exported PNG renders correctly and is of sufficient quality (the PNG has been removed from the branch and is available as a workflow artifact named `architecture-png`).
- [ ] Verify CI workflows meet org policy (checkout depth, permissions, apt usage).
- [ ] Decide whether to keep the committed PNG in repo or rely on CI artifacts.
- [ ] Optionally prefer Playwright fallback by updating scripts or adding a `docs:export-png:ci` script.

Commands to open a PR locally (if you have GitHub CLI)
---------------------------------------------------
```bash
git checkout feature-xyz
git pull --ff-only origin feature-xyz
gh pr create --fill --base main --head feature-xyz
```

Or open via the web UI:

https://github.com/GloryMat2025/appmat/compare/main...feature-xyz

Notes
-----
The export flow now tries `rsvg-convert` on CI first. If that fails, CI installs deps and runs a deterministic Playwright-based exporter (`docs:export-png:ci`). Locally the `docs:export-png` script prefers `sharp` then falls back to Playwright.
Summary

This PR contains the fixes and hardening needed to stabilize the Playwright-based screenshot/tracing tooling and to make the repo safe to run locally and in CI.

Key changes

- Repair: fixed multiple ESM CLI scripts under `tools/*.mjs` and consolidated a canonical run helper to avoid raw child_process usage.
- Windows-safe: made capture and helper scripts Windows-friendly (spawn helper and env handling).
- CI: added `.github/workflows/shots-smoke.yml` to validate installs, enforce no-direct-child_process usage, and run the `hc` health check.
- Repo hygiene: replaced malformed `.gitignore`, removed / excluded large generated artifacts (`.pw-profile/`, `patches/`, `backups/`, `dist/`, zip/tar files).
- Exports: generated `patches/` and archive fallbacks (kept out of this PR to avoid large blobs); created a cleaned snapshot branch `shots-final-no-patches` for review.

How to test locally

1. Clone the branch and install:

```bash
pnpm install
```

2. Start the dev server:

```bash
pnpm dev
# or: pnpm exec vite
```

3. Run the health-check step from CI:

```bash
pnpm run hc
```

Notes & follow-ups

- Large binary artifacts are intentionally excluded from this PR. If you want the full debug patches, they are available in `patches/` (not included here) or I can re-produce them on request.
- If you'd like the guard to initially warn (instead of fail) for raw `child_process` usage, I can change the workflow to only print matches and succeed.

• Large binary artifacts are intentionally excluded from this PR. If you want the full debug patches, they are
	available in  patches/  (not included here) or I can re-produce them on request.
	• If you'd like the guard to initially warn (instead of fail) for raw  child_process  usage, I can change the
	workflow to only print matches and succeed.

Reviewed-by: automated CI smoke workflow


CI artifact verification
------------------------
The exported PNG is created by the CI workflow and uploaded as an artifact named `architecture-png`.
Use the commands below to download and verify the authoritative artifact (run id included):

PowerShell (recommended):

```powershell
gh run download 18740367394 --repo GloryMat2025/appmat --name architecture-png --dir tmp
Expand-Archive -LiteralPath .\tmp\architecture-png.zip -DestinationPath .\tmp\architecture-png -Force
Get-FileHash .\tmp\architecture-png\architecture-refined.png -Algorithm SHA256 | Format-List
Get-Item .\tmp\architecture-png\architecture-refined.png | Select-Object Name, Length
```

cmd.exe:

```
gh run download 18740367394 --repo GloryMat2025/appmat --name architecture-png --dir tmp
powershell -Command "Expand-Archive -LiteralPath .\\tmp\\architecture-png.zip -DestinationPath .\\tmp\\architecture-png -Force"
certutil -hashfile tmp\\architecture-png\\architecture-refined.png SHA256
for %I in (tmp\\architecture-refined.png) do @echo Size(bytes): %~zI
```

Authoritative CI values (from run 18740367394):

- DPR: 1
- PNG size (bytes): 50594
- PNG sha256: 3e444b39c760bd8ebf483206b5a5fcc0bcf5bf494f5705fee7e4165dcf9f5c2e

