PR title: docs(ci): finalize canonical SVG→PNG artifact (librsvg) + export improvements

Summary
-------
This PR finalizes the canonical SVG→PNG decision for this project and adds a small, low-risk improvement to the Playwright exporter to aid future experiments.

What changed
------------
- docs/CANONICAL_EXPORT.md: add a timestamped "Finalized" note (2025-10-27) that records the project's decision to adopt the native librsvg (`rsvg-convert`) output from the Docker reproduction image as the canonical artifact.
- scripts/svg-to-png-pw.mjs: add support for `SVG_PW_CHROMIUM_ARGS` (env var) so maintainers can run Chromium-flag experiments without editing the exporter code.
- scripts/run-experiments.sh: helper script to run a small experiment matrix inside the Docker reproduction image (POSIX). This is a convenience tool for maintainers.

Why
---
We observed a consistent, material delta between Playwright/Chromium rasterization and the native librsvg output (IDAT-level and per-pixel diffs; ~44% of pixels differing). The Docker reproduction image using librsvg produces a deterministic artifact whose SHA256 and size are recorded in `docs/CANONICAL_EXPORT.md`. Adopting librsvg as canonical gives reproducible verification for reviewers and for CI.

Notes on experiments and artifacts
---------------------------------
- I ran a short set of local experiments (baseline, `--disable-gpu`, `--force-color-profile=srgb`) with Playwright/Chromium and embedded the vendored Roboto TTF. None materially reduced the parity gap vs the librsvg canonical artifact.
- Generated experimental artifacts and analysis are available under `out/experiments/` in the branch workspace. These were intentionally not added to the PR to avoid large binary diffs; if you want them attached, I'll create a zip and include it in the PR or upload it to a CI run as an artifact.

How to review
-------------
1. Confirm `docs/CANONICAL_EXPORT.md` contents and the recorded SHA256/size match the canonical artifact you expect.
2. Spot-check the Playwright exporter change in `scripts/svg-to-png-pw.mjs`. The change only enables extra Chromium args via `SVG_PW_CHROMIUM_ARGS` and does not change export behavior by default.
3. Optionally run the Docker reproduction locally to verify the canonical artifact:

   docker build -t appmat-export-ci:fixed -f docker/Dockerfile.export-ci .
   docker run --rm -v "$(pwd):/workspace" appmat-export-ci:fixed

4. If you want the experiment outputs included in the PR, reply and I'll attach a zip.

Suggested PR metadata
---------------------
- Base branch: main
- Head branch: feature-xyz-ci
- Labels: documentation, ci
- Reviewers: @<your-team-member> (optional)

Suggested gh CLI command (optional)
----------------------------------
# Create the PR from the repo root (adjust base if needed):
# gh pr create --title "docs(ci): finalize canonical SVG→PNG artifact (librsvg) + export improvements" --body-file PR_DRAFT_finalize_canonical.md --base main --head feature-xyz-ci --label documentation --label ci

If you want me to open the PR for you, say "open PR" and I will attempt to create it (I may need permissions or a token; if those are absent I'll show the exact gh command and provide the PR link you can paste).