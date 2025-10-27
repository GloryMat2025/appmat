Canonical SVG→PNG artifact
==========================

This file records the canonical SVG→PNG artifact chosen for reviewers to verify quickly.

Canonical artifact (from Docker reproduction)
--------------------------------------------

- Path (in repository workspace): `out/docker-repro-architecture-png/architecture-refined.png`
- Size (bytes): 57,016
- SHA256: `1e8d9d60c1aeedb0338baac825a517e81a859b975ab6a3364d37ebf1b51006bf`
- Exporter (as reproduced): Docker reproduction image (native librsvg/rsvg-convert preferred in CI)

Why this artifact?
-------------------

This PNG was produced by the deterministic Docker reproduction image (`docker/Dockerfile.export-ci`) that pre-installs system libraries, pinned Playwright browsers, and vendors the Roboto font used by the SVG. A build/run of that image produced a byte-for-byte match with the authoritative CI artifact; therefore this file is the current canonical reference for verification.

How to verify locally (Windows / cmd.exe)
-----------------------------------------

1. Build the reproduction image (from repository root):

   docker build -t appmat-export-ci:fixed -f docker/Dockerfile.export-ci .

2. Run the container and write outputs to the `out/` folder in your repo:

   docker run --rm -v "%cd%:/workspace/out" appmat-export-ci:fixed

   After this runs, the canonical PNG will be available at `out/docker-repro-architecture-png/architecture-refined.png`.

3. Compute the SHA256 and file size (Windows):

   certutil -hashfile out\docker-repro-architecture-png\architecture-refined.png SHA256

   (Compare the printed SHA256 to the canonical value above. The file size should be 57,016 bytes.)

How to verify locally (POSIX / Linux / WSL)
------------------------------------------

1. Build the reproduction image:

   docker build -t appmat-export-ci:fixed -f docker/Dockerfile.export-ci .

2. Run the container and mount the current directory:

   docker run --rm -v "$(pwd):/workspace/out" appmat-export-ci:fixed

3. Compute the SHA256 and size:

   sha256sum out/docker-repro-architecture-png/architecture-refined.png
   stat -c%s out/docker-repro-architecture-png/architecture-refined.png

Notes and troubleshooting
-------------------------

- If the SHA256 does not match: ensure you built the image from the latest `docker/Dockerfile.export-ci` in this branch and that the repository's `docs/architecture-refined.svg` and `docs/fonts/Roboto-Regular.ttf` are present and unchanged.
- If the container run fails due to missing privileges, try running Docker Desktop or use WSL2/Ubuntu shell.
- If you prefer not to build the image locally, download the `architecture-png` artifact from the workflow run in the PR Actions UI and run the verifier script:

   node scripts/verify-artifact.mjs ./artifact/architecture-refined.png --sha 1e8d9d60c1aeedb0338baac825a517e81a859b975ab6a3364d37ebf1b51006bf --size 57016

How to vendor the Roboto font (optional, helps Playwright reproduce text metrics)
--------------------------------------------------------------------------

To try to reproduce Playwright/Chromium renders deterministically you can vendor the Roboto font used by the SVG. Place `Roboto-Regular.ttf` at `docs/fonts/Roboto-Regular.ttf`.

Quick automatic method (requires network access):

   node scripts/fetch-roboto.mjs

This downloads a Roboto TTF into `docs/fonts/` and prints a SHA256. If network access is restricted, download the TTF from Google Fonts and copy it into that path.

After adding the font, run:

   node scripts/check-fonts.mjs

Then re-run the Playwright embed experiment:

   set SVG_PW_DPR=1
   set SVG_PW_FORCE_HEIGHT=800
   node scripts/svg-to-png-pw.mjs docs/architecture-refined.svg out/pw-embed-dpr1-forced-omit.png --embed-font docs/fonts/Roboto-Regular.ttf

Contact / Next steps
--------------------

If reviewers prefer a different canonical renderer (for example Playwright-based), we will run the CI matrix experiments and re-evaluate. See `.github/workflows/matrix-experiments.yml` and `docker/README.md` for more details.

Decision: canonical renderer
----------------------------

After running local and Docker reproductions and performing IDAT / pixel-level diagnostics, we adopt the native librsvg (`rsvg-convert`) output produced by the Docker reproduction image as the canonical SVG→PNG artifact for reviewers and CI verification. Rationale:

- The Docker reproduction image (see `docker/Dockerfile.export-ci`) produces a deterministic, repeatable artifact whose SHA256 and size are recorded above.
- Playwright/Chromium rendered output (even when embedding a vendored Roboto TTF) is consistent across host and Docker Playwright runs but shows a large visual and IDAT-level delta vs the native rasterizer; achieving reliable parity is costly and brittle.

What this means:

- The file at `out/docker-repro-architecture-png/architecture-refined.png` (SHA256 `1e8d9d60c1aeedb0338baac825a517e81a859b975ab6a3364d37ebf1b51006bf`, size 57,016) is the authoritative canonical artifact used by CI comments and reviewer verification.
- CI will attempt native rasterization first (librsvg/rsvg-convert) and fall back to Playwright when necessary; the canonical artifact remains the librsvg-produced image unless the project maintainers explicitly change this decision.

If you'd like me to reverse this decision and invest in a Playwright parity matrix (DPR, Chromium revisions, embed/no-embed), I can prepare and run that CI experiment and report consolidated diffs.

Finalized
---------

- Finalized on: 2025-10-27 — The team adopts the native librsvg (`rsvg-convert`) output from the Docker reproduction image as the canonical SVG→PNG artifact for CI and reviewer verification. This decision is recorded here to make the choice explicit and timestamped. To change the canonical renderer in the future, update this document and the CI workflows accordingly.

CI enforcement
--------------

We added a lightweight workflow `.github/workflows/enforce-roboto.yml` on the feature branch that fails CI when `docs/fonts/Roboto-Regular.ttf` is missing. This is intended to keep Playwright embedding experiments deterministic and to make CI failures actionable.

How to fix a CI failure from this check:

- Option A (preferred): Add `Roboto-Regular.ttf` to `docs/fonts/` and push the branch. Use the vendoring script if you have network access:

```powershell
pwsh -NoProfile -File .\scripts\vendor-roboto.ps1 -Commit
```

- Option B: Manually download the Roboto family from Google Fonts and place `Roboto-Regular.ttf` at `docs/fonts/Roboto-Regular.ttf`, then run:

```cmd
git add docs/fonts/Roboto-Regular.ttf
git commit -m "chore: vendor Roboto-Regular.ttf"
git push
```

If you prefer not to vendor fonts in the repo, this workflow can be disabled or removed; it's intentionally lightweight and reversible. Contact the maintainers if you want enforcement relaxed for a particular branch.
