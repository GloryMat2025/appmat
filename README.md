![Shots Smoke Test](https://github.com/GloryMat2025/appmat/actions/workflows/shots-smoke.yml/badge.svg)

# appmat

A small demo app used to exercise Playwright screenshot/trace tooling and CI smoke checks.

## CI workflow overview

```mermaid
graph TD
	A[Push or PR to main] --> B[Shots Smoke Test (shots-smoke.yml)]
	B -->|✅ Passed| C[Version Bump & Auto Tag (version-bump.yml)]
	C -->|New tag vX.Y.Z| D[Release Workflow (release.yml)]
	D --> E[Generate changelog + publish GitHub Release]
	E --> F[Upload artifacts (gallery.html, zip)]
```
