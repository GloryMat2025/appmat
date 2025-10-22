How to use the shots tooling

This project includes small npm scripts to create mock Playwright runs, generate a compact report, archive the run, and merge reports. These are useful for local development and CI smoke tests.

Shots Automation Quick Guide

| Task | NPM Script | Description |
|------|-------------|--------------|
| Mock run | `shots:mock` | Generate dummy screenshots & manifest |
| Report | `shots:report` | Build HTML gallery (`shots/gallery.html`) |
| Zip | `shots:zip` | Compress latest run safely |
| Merge | `shots:merge` | Validate all runs, output `merge.index.json` |

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

Folder Layout

```
shots/
  <iso-like-timestamp>__<label>/
    report.json
    manifest.json
    traces/
    screenshots/
    gallery.html
```

Notes

- The archiving step prefers `pwsh`/`powershell` on Windows, then `zip`/`tar` on POSIX systems, and finally falls back to an in-process `archiver` library if necessary.
- If you want custom zip behavior set the `ZIP_CMD` environment variable (the command must contain `{src}` and `{dst}` placeholders).
