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

Reviewed-by: automated CI smoke workflow
