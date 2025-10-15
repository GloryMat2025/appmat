<<<<<<< HEAD
ci(tests): Playwright CI, artifact uploads, and headed debug workflow

This branch adds CI-friendly Playwright configuration, test artifact
uploading and a manual headed debug workflow to help debug flaky E2E
failures (traces, screenshots and videos).

Key changes
- `tests/playwright.ci.config.mjs` — Playwright config tuned for CI
  (Chromium-only, trace: "on-first-retry", screenshots/videos on-fail,
  --no-sandbox launch args).
- `.github/workflows/playwright-artifacts.yml` — full Playwright suite run
  that uploads artifacts (trace.zip, videos, screenshots) and conditionally
  dispatches `playwright-debug.yml` when a run fails.
- `.github/workflows/playwright-debug.yml` — manual (workflow_dispatch)
  headed debug workflow that runs a single test or test file with full
  tracing for reproducing failures locally or in a maintainer environment.
- `scripts/*` helper scripts — `create-zip.ps1`, `GitFix.ps1`,
  `MAINTAINER_APPLY.md` etc. to help maintainers or contributors apply the
  patch when local push is not possible.
- `appmat-changes-latest.zip` — an archive of the branch changes (for
  manual application if needed).
- `.github/workflows/synthetic-tests.yml` — YAML quoting/heredoc fixes so
  the Slack notification and artifact path formatting are correct.

Why this change
- The Playwright test run produces large trace artifacts that are
  necessary to debug intermittent failures. CI now uploads these,
  and a maintainer or CI operator can dispatch a headed debug job when
  necessary to reproduce issues interactively.

How to use
- If CI fails, download the `trace.zip` artifact from the Actions run and
  run locally: `npx playwright show-trace <path/to/trace.zip>`.
- To run the headed debug job from the Actions UI: open the `playwright-debug`
  workflow and pass the failing test file or test id as `testPath`.

Notes and follow-ups
- This repo patch was pushed to `e2e/playwright-reservations-fix-local`
  rather than overwriting the existing remote `e2e/playwright-reservations-fix`
  branch to avoid overwriting remote work. Create a PR from the branch
  `e2e/playwright-reservations-fix-local` to `main` (link shown in push
  output).
- If you need me to open the PR for you, I can create a clean PR title
  and description and open it (I won't need any secrets).

Testing performed
- Local Playwright install verified (`npx playwright install`).
- CI workflow YAML validated and YAML quoting issues resolved for the
  Slack notification step.

If you'd like any edits to this PR body (shorter, or to call out specific
files), say which part to change and I'll update and push the branch.
feat: add receipt styles and Tailwind CSS configuration

- Created a new CSS file for receipt styling with responsive design and print support.
- Added Tailwind CSS configuration to enable dark mode and extend theme colors and shadows.

test: add Playwright tests for product popup and reservation flow

- Implemented tests for product details popup functionality and "Add to Cart" feature.
- Added tests for reservation flow, including countdown and payment modal interactions.

chore: setup TypeScript configuration and validation script

- Added TypeScript configuration file for project compilation settings.
- Created a validation script for products.json to ensure data integrity against defined product interface.

chore: add helper functions for test setup and server management

- Introduced helper functions to start and stop a static server for testing purposes.
- Added reservation shims to facilitate testing of reservation-related functionalities.

Notes:
- If CI can't be triggered from this client due to local auth/permissions, you can upload the generated `appmat-changes.zip` (created by `scripts/create-zip.ps1`) to a GitHub issue or send to a maintainer to apply and open a PR.
- See `scripts/GitFix.ps1` for local Git diagnostic/repair guidance.
=======
Title: E2E: restore fixtures and stabilize Playwright tests

Summary:
- Restored a small deterministic `public/data/products.json` fixture to ensure product grid renders reliably in headless E2E runs.
- Fixed minor frontend defensive code in `products-grid.js` to fallback to `localStorage` cart operations and ensure popup fragment population.
- Added a conservative CI workflow `.github/workflows/playwright-artifacts.yml` which runs Playwright on pushes/PRs and uploads test artifacts (reports, traces, screenshots) for easier debugging of failures.

Why:
- Playwright runs were failing due to malformed fixture data. Tests are now stable locally and we should run CI to confirm the same in GitHub Actions. The new workflow uploads artifacts to help debug any failures.

What to review:
- `public/data/products.json` (small fixture)
- `public/assets/js/products-grid.js` (popup and add-to-cart fallback)
- `.github/workflows/playwright-artifacts.yml` (new workflow)

How to test locally:
1. Run Playwright tests locally:
   - `npx playwright test --config=tests/playwright.config.mjs`
2. To run CI-like job locally, ensure node modules installed: `npm ci`, then run Playwright (the workflow uses `http-server` to serve `public`).

Notes:
- I did not remove or modify your existing workflows; the new workflow is additive and conservative. If you prefer to change your existing workflow instead, I can prepare a patch that updates it instead of adding a new file.
>>>>>>> 201bf9d (ci(playwright): add CI Playwright config + debug workflow; add helper scripts for E2E debugging)
