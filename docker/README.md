Docker reproduction for CI PNG export
===================================

This directory contains a small Dockerfile and runner script to reproduce the CI export flow used in the `export-architecture-png.yml` workflow. It attempts to mirror the CI steps on an Ubuntu base so you can produce the same PNG artifact locally.


Build:

```bash
docker build -f docker/Dockerfile.export-ci -t appmat-export-ci .
```

Run (mount an output folder on host):

POSIX / Git Bash / WSL
```bash
mkdir -p out
docker run --rm -v "$(pwd)/out:/workspace/out" appmat-export-ci
```

Windows cmd.exe
```cmd
mkdir out
docker run --rm -v "%cd%\out:/workspace/out" appmat-export-ci
```

PowerShell
```powershell
New-Item -ItemType Directory -Path out -Force
docker run --rm -v "${PWD}/out:/workspace/out" appmat-export-ci
```

The produced file will be available at `./out/architecture-refined.png` on the host. You can then compute SHA256 to verify against the CI artifact.

Quick verification (script)

This repo includes `scripts/verify-artifact.mjs` which checks SHA256 and optional size.

Example (replace SHA with authoritative value from CI):

POSIX / WSL / Git Bash / PowerShell
```bash
node scripts/verify-artifact.mjs out/architecture-refined.png --sha 3e444b39c760bd8ebf483206b5a5fcc0bcf5bf494f5705fee7e4165dcf9f5c2e --size 50594
```

Windows cmd.exe
```cmd
node scripts\verify-artifact.mjs out\architecture-refined.png --sha 3e444b39c760bd8ebf483206b5a5fcc0bcf5bf494f5705fee7e4165dcf9f5c2e --size 50594
```

Note: the container will attempt to install Playwright browsers which may download ~200MB+ of data. Be patient; this mirrors the CI runner behavior.
