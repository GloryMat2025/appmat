#!/bin/sh
# Entrypoint to reproduce CI export in container
set -eux

echo "Running CI-style export inside container"

# Install Playwright browsers (with deps) - best effort
if command -v npx >/dev/null 2>&1; then
  npx playwright@1.56.0 install --with-deps || npx playwright install --with-deps || true
fi

# Ensure pnpm is available if project uses it
if command -v corepack >/dev/null 2>&1; then
  corepack enable || true
  corepack prepare pnpm@latest --activate || true
fi

if command -v pnpm >/dev/null 2>&1; then
  echo "Installing node deps (pnpm)"
  pnpm install --frozen-lockfile || pnpm install
elif [ -f package.json ]; then
  echo "Installing node deps (npm)"
  npm install --production || true
fi

echo "Running CI export (docs:export-png:ci)"
# Ensure DPR is set to the same as CI
export SVG_PW_DPR=${SVG_PW_DPR:-1}

if command -v rsvg-convert >/dev/null 2>&1; then
  echo "Using rsvg-convert native converter"
  SVG=$(ls *.svg 2>/dev/null | head -n1 || true)
  if [ -z "$SVG" ] && [ -f docs/architecture.svg ]; then
    SVG=docs/architecture.svg
  fi
  if [ -z "$SVG" ]; then
    echo "No SVG found to convert" >&2
    exit 2
  fi
  rsvg-convert -w 1200 -h 800 "$SVG" -o docs/architecture-refined.png
else
  if [ -f scripts/svg-to-png-pw.mjs ]; then
    node ./scripts/svg-to-png-pw.mjs --input docs/architecture.svg --output docs/architecture-refined.png || true
  fi
fi

OUT_DIR=/workspace/out
mkdir -p "$OUT_DIR"
if [ -f docs/architecture-refined.png ]; then
  cp docs/architecture-refined.png "$OUT_DIR/architecture-refined.png"
  echo "Copied docs/architecture-refined.png -> $OUT_DIR/architecture-refined.png"
else
  echo "No PNG produced"
  exit 2
fi

echo "Done"
#!/usr/bin/env bash
set -euo pipefail

echo "Running CI-style export inside container"

# Install Playwright browsers (with deps) - best effort
npx playwright@1.56.0 install --with-deps || npx playwright install --with-deps || true

# Ensure pnpm is available
corepack enable || true
corepack prepare pnpm@latest --activate || true

echo "Installing node deps (pnpm)"
pnpm install --frozen-lockfile || pnpm install

echo "Running CI export (docs:export-png:ci)"
# Ensure DPR is set to the same as CI
export SVG_PW_DPR=${SVG_PW_DPR:-1}
pnpm run docs:export-png:ci

OUT_DIR=/workspace/out
mkdir -p "$OUT_DIR"
if [ -f docs/architecture-refined.png ]; then
  cp docs/architecture-refined.png "$OUT_DIR/architecture-refined.png"
  echo "Copied docs/architecture-refined.png -> $OUT_DIR/architecture-refined.png"
else
  echo "No PNG produced"
  exit 2
fi

echo "Done"
