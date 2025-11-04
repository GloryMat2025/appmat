Adds REPRO-WINDOWS.md and helper scripts (repro-windows.cmd, repro-windows.ps1) to make it easy to reproduce SVG→PNG exports on Windows.

Canonical artifact (for reference):
- Path: out/docker-repro-architecture-png/architecture-refined.png
- SHA256: 1e8d9d60c1aeedb0338baac825a517e81a859b975ab6a3364d37ebf1b51006bf
- Size: 57016 bytes

How to run (local quick):
- From cmd.exe: repro-windows.cmd
- From PowerShell: .\repro-windows.ps1
- Docker repro (optional): repro-windows.cmd docker or .\repro-windows.ps1 -UseDocker

Diagnostics (optional, after producing both canonical and Playwright outputs):
- node scripts/png-idat-diff.mjs out\docker-repro-architecture-png\architecture-refined.png out\pw-embed-roboto-committed.png > out\idat-diff-embed.txt
- node scripts/png-visual-diff.mjs out\docker-repro-architecture-png\architecture-refined.png out\pw-embed-roboto-committed.png out\pixel-diff-embed.ppm
- node scripts/ppm-analyze.mjs out\pixel-diff-embed.ppm > out\ppm-analysis-embed.txt

Notes:
- These repro helper scripts are read-only wrappers and do not modify tracked repository files. They create outputs under the local 'out/' directory only.
- This PR is documentation-only (no CI changes, no committed PNGs).

Experiments ZIP (draft release) — contents checklist:
- out/docker-repro-architecture-png/architecture-refined.png (canonical librsvg output)
- Playwright PNG outputs (various runs: DPR 1/2, embed true/false, disable-gpu, forced sizes)
- IDAT diff text files (inflated IDAT comparisons)
- PPM visual diffs (pixel-diff *.ppm) for visual inspection
- ppm-analysis *.txt reports (counts, bbox, avg intensity)
- Playwright and docker logs (pw-embed-roboto.log, docker-repro-inspect outputs)
- A small matrix/ folder with per-variant artifacts and analysis

Experiments download: https://github.com/GloryMat2025/appmat/releases/download/untagged-740eb977f0fd1bcc78ff/experiments.zip

Key findings (summary):
- The Docker/native rasterizer (librsvg / rsvg-convert) was adopted as the canonical exporter because it produces deterministic, byte-stable PNG outputs across runs and matches project visual intent.
- Playwright/Chromium renders were consistent across repeated Playwright runs but materially differ from librsvg: IDAT-level diffs and per-pixel PPM analysis show large differences in many pixels.
- Vendoring the Roboto TTF and embedding it in the Playwright run reduced font fallback variability but did not eliminate the visual/IDAT differences versus librsvg.
- Attempts to tune Chromium (DPR, disable-gpu, forced dimensions, chromium args) produced variations but did not achieve parity with librsvg in these experiments.

Key quantitative numbers (example analysis):
- Compared image: out/docker-repro-architecture-png/architecture-refined.png (canonical) vs out/pw-embed-roboto-committed.png (Playwright)
- PPM analysis (out/pbm-analysis / out/ppm-analysis.txt):
  - Image size: 1200×800 (960,000 pixels)
  - Differing pixels: 446,086 (46.47%)
  - Average diff intensity (per differing pixel): 117.0
  - Diff bounding box: x=0..1141, y=0..720

Pointer to policy and canonical decision:
- See `docs/CANONICAL_EXPORT.md` for the recorded canonical artifact, SHA256, and reproduction steps. This PR provides the reproducible artifacts and helper scripts reviewers can use to validate the decision.

Recommendation: Keep font enforcement as a soft warning for now, until cross-renderer parity improves.

If you'd like I can add a one-line recommendation (e.g., enforce vendored Roboto in CI or keep as a warning).