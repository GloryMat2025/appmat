#!/bin/sh
set -eux

# Small experiment matrix for Chromium args
mkdir -p /workspace/out/experiments
CANON1=out/docker-repro-architecture-png/architecture-refined.png
CANON2=out/architecture-refined.png
if [ -f "$CANON1" ]; then
  CANON="$CANON1"
elif [ -f "$CANON2" ]; then
  CANON="$CANON2"
else
  echo "Canonical PNG not found (tried $CANON1 and $CANON2)" >&2
  exit 2
fi
echo "Using canonical: $CANON"

variants=("" "--disable-gpu" "--force-color-profile=srgb" "--disable-gpu --force-color-profile=srgb")
for v in "${variants[@]}"; do
  for embed in true false; do
    safe=$(echo "$v" | sed -e 's/ /_/g' -e 's/[^A-Za-z0-9_\-]/_/g')
    out=/workspace/out/experiments/pw${safe}_embed${embed}.png
    echo "Running variant: args='$v', embed=$embed -> $out"
    SVG_PW_CHROMIUM_ARGS="$v" \
      node scripts/svg-to-png-pw.mjs docs/architecture-refined.svg "$out" $( [ "$embed" = "true" ] && echo "--embed-font docs/fonts/Roboto-Regular.ttf" ) || true

    # Compute diffs and analysis (best-effort)
    node scripts/png-idat-diff.mjs "$CANON" "$out" > "/workspace/out/experiments/$(basename "$out")-idat.txt" || true
    node scripts/png-visual-diff.mjs "$CANON" "$out" "/workspace/out/experiments/$(basename "$out")-pixdiff.ppm" || true
    node scripts/ppm-analyze.mjs "/workspace/out/experiments/$(basename "$out")-pixdiff.ppm" > "/workspace/out/experiments/$(basename "$out")-ppm-analysis.txt" || true
  done
done
