#!/usr/bin/env bash
# Entrypoint to reproduce CI export in container
set -euo pipefail

echo "Running CI-style export inside container"

# Ensure pnpm/corepack and Playwright are available (best-effort)
export CI=${CI:-true}
if command -v corepack >/dev/null 2>&1; then
  corepack enable || true
  corepack prepare pnpm@latest --activate || true
fi

if command -v npx >/dev/null 2>&1; then
  npx playwright@latest install --with-deps || npx playwright install --with-deps || true
fi

# Install node deps only if node_modules is missing (we prefer deps baked into the image)
if [ ! -d node_modules ]; then
  if command -v pnpm >/dev/null 2>&1; then
    echo "Installing node deps (pnpm)"
    pnpm install --frozen-lockfile || pnpm install || true
  elif [ -f package.json ]; then
    echo "Installing node deps (npm)"
    npm install --production || true
  fi
else
  echo "Using baked-in node_modules from image"
fi

echo "Running CI export (docs:export-png:ci)"
# Ensure DPR is set to the same as CI
export SVG_PW_DPR=${SVG_PW_DPR:-1}

# Prefer rsvg-convert when available, otherwise use Playwright exporter
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
  else
    # fallback to npm script if present
    if grep -q "docs:export-png:ci" package.json 2>/dev/null; then
      pnpm run docs:export-png:ci || npm run docs:export-png:ci || true
    fi
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
