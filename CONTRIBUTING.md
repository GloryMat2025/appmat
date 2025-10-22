CONTRIBUTING

This repository contains tooling for Playwright-based screenshot and trace capture. To keep CI stable and avoid large binary artifacts in the Git history, follow these contributor guidelines.

Run helper

- Use the canonical run helper in `scripts/lib/run.mjs` (or the project's spawn helper) instead of importing `child_process` directly.
- This avoids platform-specific differences between Windows and Unix and centralizes env handling, timeouts, and error logging.

CI guard

- The smoke workflow (`.github/workflows/shots-smoke.yml`) will print (warn) about any direct `child_process` usage during PRs. Please replace direct usage with the run helper.

Local dev

1. Install dependencies:

```bash
pnpm install
```

2. Start dev server:

```bash
pnpm dev
```

3. Run quick health-check:

```bash
pnpm run hc
```

Avoid committing large artifacts

- Don't commit the following directories/files:
  - `.pw-profile/` (Playwright profiles)
  - `patches/` (local patch files and archives)
  - `backups/`, `dist/`, `*.tar.gz`, `*.zip`
  - `node_modules/`
- Add large debugging artifacts to an artifact store (S3, internal file share) or share as downloadable archives instead of committing them.

PR checklist

- [ ] Did you run `pnpm install` and `pnpm run hc`?
- [ ] Does CI pass for your PR branch?
- [ ] Did you avoid committing large files (see list above)?
- [ ] If you changed any script that previously used `child_process`, did you migrate it to `scripts/lib/run.mjs`?

If you need help migrating scripts or want an automated migration PR, open an issue or ping the maintainers.

How to run captures locally

- Ensure the dev server is running (default: http://localhost:5173):

```bash
pnpm run dev
```

- Run the minimal capture script (saves output under the ignored `shots/` directory):

```bash
node tools/capture.mjs
# optional flags: --skip-on-error, --persistent
```

Release changelog

- The release workflow (`.github/release.yml`) runs the `metcalfc/changelog-generator` step on tag pushes and wires the generated changelog into the GitHub Release body automatically. To trigger it, push a tag like:

```bash
git tag v1.2.3
git push origin --tags
```

- If you want the changelog included as an asset instead of the body, ask and I can add an upload step to the workflow.


Contributing Quick Steps
-----------------------

Follow these quick steps to contribute:

1. Fork the repository on GitHub and clone your fork locally.

```bash
git clone git@github.com:<your-username>/appmat.git
cd appmat
```

2. Create a new branch for your work:

```bash
git checkout -b feature-xyz
```

3. Make changes and commit using Conventional Commits format (examples are in `CONTRIBUTING-EXTRA.md`):

```bash
git add .
git commit -m "feat(cli): add mock-shots helper"
```

4. Push your branch and open a Pull Request:

```bash
git push origin feature-xyz
# Then create a PR on GitHub from your fork -> upstream:feature-xyz
```

5. CI will automatically run tests, enforce conventional commits for versioning, and (on tag/release) publish artifacts.

See `CONTRIBUTING-EXTRA.md` for extended examples, commit message templates, and release-trigger notes.
