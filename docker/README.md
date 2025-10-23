Docker reproduction for CI PNG export
===================================

This directory contains a small Dockerfile and runner script to reproduce the CI export flow used in the `export-architecture-png.yml` workflow. It attempts to mirror the CI steps on an Ubuntu base so you can produce the same PNG artifact locally.

Build:

```bash
docker build -f docker/Dockerfile.export-ci -t appmat-export-ci .
```

Run (mount an output folder on host):

```bash
mkdir -p out
docker run --rm -v "$(pwd)/out:/workspace/out" appmat-export-ci
```

The produced file will be available at `./out/architecture-refined.png` on the host. You can then compute SHA256 to verify against the CI artifact.

Note: the container will attempt to install Playwright browsers which may download ~200MB+ of data. Be patient; this mirrors the CI runner behavior.
