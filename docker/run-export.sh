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
