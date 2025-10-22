How to use the shots tooling

This project includes small npm scripts to create mock Playwright runs, generate a compact report, archive the run, and merge reports. These are useful for local development and CI smoke tests.

Common scripts
- npm run shots:mock — create a small mock run under `shots/` (used for smoke tests)
- npm run shots:report — analyze the newest `shots/` run and print a compact textual report; can also generate an HTML gallery with `--make-html`.
- npm run shots:zip — create a zip of the newest run (uses PowerShell/zip/tar or an in-process archiver fallback).
- npm run shots:merge — merge reports or produce a combined report for a run (project-specific behavior).

Path and manifest conventions
- Runs live under `shots/` and are named with an ISO-like timestamp and optional label, for example: `shots/2025-10-22T02-51-44__mock/` or `shots/2025-10-16T06-10-56.merged/`.
- Each run should contain a `manifest.json` or `report.json` describing the test results. Tools will look for `report.json` in common locations (root, `playwright-report/report.json`, `test-results/report.json`).

Quick CI smoke snippet (optional)

- name: Smoke tests — shots
  run: |
    npm run shots:mock
    npm run shots:report
    npm run shots:zip
    npm run shots:merge

Notes
- The archiving step prefers `pwsh`/`powershell` on Windows, then `zip`/`tar` on POSIX systems, and finally falls back to an in-process `archiver` library if necessary.
- If you want custom zip behavior set the `ZIP_CMD` environment variable (the command must contain `{src}` and `{dst}` placeholders).
