Project TODO

- [x] Batch 1 atomic-replace
- [x] Batch 2 gallery/zip/merge
- [ ] Child-process refactor complete → mark to [x] after step 1
- [x] Smoke tests (mock, report, zip, merge)
- [x] Cleanup backups

Notes
- Child-process refactor checklist: convert shell-dependent branches (ZIP_CMD, PowerShell) to use `scripts/lib/run.mjs` and prefer `run()` / `runNode()` for new code. Some manual review remains for CI inline scripts and legacy helpers.
