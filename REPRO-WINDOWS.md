## Reproducing SVG→PNG exports (Windows, cmd.exe)

This document contains exact, copy-paste-friendly cmd.exe steps to reproduce the canonical export and the Playwright fallback runs, plus verification commands (SHA256 + size). Use these steps from the repository root (the folder that contains this README and `docs/`).

Prerequisites
- Windows with Docker Desktop installed (for the Docker reproduction).
- Node.js 22+ and npm (or pnpm) for local Node scripts.
- Git (to confirm branch and commit).
- Optional: PowerShell for running the vendor script if needed.

Canonical artifact info (recorded):
- Path: `out/docker-repro-architecture-png/architecture-refined.png`
- SHA256: `1e8d9d60c1aeedb0338baac825a517e81a859b975ab6a3364d37ebf1b51006bf`
- Size: 57016 bytes

Quick checks (in cmd.exe)
1) Confirm you're on the expected branch:

   git rev-parse --abbrev-ref HEAD

2) Confirm repository root (print current working directory):

   cd /d %cd%
   echo %cd%

Local Playwright exporter (no Docker)
These commands run the Playwright-based exporter directly on Windows. If you want DPR=2 or Chromium args, see the examples below.

Example: render and embed the vendored Roboto font

   mkdir out 2>nul
   node scripts/svg-to-png-pw.mjs docs/architecture-refined.svg out\pw-embed-roboto-committed.png --embed-font docs/fonts/Roboto-Regular.ttf

Set devicePixelRatio (DPR) for the exporter (cmd.exe):

   set SVG_PW_DPR=2 && node scripts/svg-to-png-pw.mjs docs/architecture-refined.svg out\pw-dpr2.png --embed-font docs/fonts/Roboto-Regular.ttf

Pass Chromium launch args (example: disable GPU, no-sandbox):

   set "SVG_PW_CHROMIUM_ARGS=--disable-gpu --no-sandbox" && node scripts/svg-to-png-pw.mjs docs/architecture-refined.svg out\pw-disable-gpu.png --embed-font docs/fonts/Roboto-Regular.ttf

Docker reproduction (recommended for canonical native run)
There are two safe ways to run the Docker repro on Windows cmd.exe.

A) Interactive, step-by-step (recommended to avoid quoting complexity)

   REM Build the reproduction image (run from repo root)
   docker build -t appmat-export-ci -f docker/Dockerfile.export-ci .

   REM Run an interactive shell in the image with the repo mounted
   docker run --rm -it -v "%cd%:/workspace" appmat-export-ci /bin/sh

   REM Inside the container shell (prompted by /bin/sh) run the CI-style export:
   /bin/sh -c "mkdir -p /workspace/out && cp /usr/local/bin/rsvg-convert /usr/bin/ || true; /workspace/scripts/export-ci-helper.sh"

   REM After the container run completes, exit and inspect files under %cd%\out

B) One-liner (if you prefer a single command). Note: quoting can be fragile in cmd.exe; use the interactive method if you hit mount/quoting issues.

   docker build -t appmat-export-ci -f docker/Dockerfile.export-ci .
   docker run --rm -v "%cd%:/workspace" appmat-export-ci /bin/sh -c "mkdir -p /workspace/out && /workspace/scripts/run-experiments.sh"

Notes on mount quoting errors
- If you see an error like `create %cd%: "%cd%" includes invalid characters for a local volume name`, your shell did not expand `%cd%` — ensure you're running from cmd.exe (not PowerShell) and using the exact `"%cd%:/workspace"` pattern above. The interactive approach avoids most quoting pitfalls.

Verify canonical artifact (cmd.exe)
Use `certutil` to compute SHA256 and a small PowerShell snippet (or `for` expansion) to get file size.

   REM Compute SHA256
   certutil -hashfile out\docker-repro-architecture-png\architecture-refined.png SHA256

   REM Print file size (bytes) using PowerShell from cmd.exe
   powershell -Command "(Get-Item -Path 'out\\docker-repro-architecture-png\\architecture-refined.png').Length"

Compare the reported SHA256 and size with the canonical values above.

Diagnostics (run after producing both canonical and Playwright outputs)
1) IDAT diff (inflate IDATs and compare):

   node scripts/png-idat-diff.mjs out\docker-repro-architecture-png\architecture-refined.png out\pw-embed-roboto-committed.png > out\idat-diff-embed.txt

2) Visual per-pixel diff (PPM) and analysis:

   node scripts/png-visual-diff.mjs out\docker-repro-architecture-png\architecture-refined.png out\pw-embed-roboto-committed.png out\pixel-diff-embed.ppm
   node scripts/ppm-analyze.mjs out\pixel-diff-embed.ppm > out\ppm-analysis-embed.txt

3) Quick inspect of PNG metadata (IHDR, size):

   node scripts/png-inspect.js out\pw-embed-roboto-committed.png > out\pw-embed-roboto-inspect.txt

Vendor font helper (PowerShell)
If you need to refresh or vendor Roboto, run the provided PowerShell helper in an elevated PowerShell session (not cmd.exe):

   powershell -ExecutionPolicy Bypass -File .\scripts\vendor-roboto.ps1 -Commit

Troubleshooting tips
- If the Playwright exporter fails due to missing browser binaries, run `npx playwright install` (or `npx playwright install chromium`) before invoking the exporter.
- If scripts error with `permission denied` inside Docker, ensure the repository mount is writeable and that Docker Desktop is running.
- When Windows path separators cause issues inside container shell commands, prefer the interactive container approach and run POSIX scripts from the container's shell.

What to check in a review
- Confirm the certutil SHA256 equals the canonical SHA above.
- Confirm file size matches 57016 bytes.
- If you have time, run the Playwright export with and without `--embed-font` and inspect `out\ppm-analysis-*.txt` to observe the parity gap.

If you want, I can also add a short PowerShell variant of these steps or an automated `repro-windows.cmd` helper script — tell me which you'd prefer.
