#!/usr/bin/env bash
# Download Roboto-Regular.ttf into docs/fonts/ and optionally commit it.
# Usage: ./scripts/vendor-roboto.sh [--commit]

set -euo pipefail

COMMIT=0
URL=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --commit) COMMIT=1; shift ;;
    -h|--help) echo "Usage: $0 [--commit]"; exit 0 ;;
    *) echo "Unknown arg: $1"; exit 2 ;;
  esac
done

ROOT_DIR=$(pwd)
FONTS_DIR="$ROOT_DIR/docs/fonts"
mkdir -p "$FONTS_DIR"
OUT_PATH="$FONTS_DIR/Roboto-Regular.ttf"

echo "Attempting to download Roboto Regular from known locations"
# Candidate URLs to try (raw.githubusercontent and github raw alias)
URLS=(
  "https://raw.githubusercontent.com/google/fonts/main/apache/roboto/Roboto-Regular.ttf"
  "https://github.com/google/fonts/raw/main/apache/roboto/Roboto-Regular.ttf"
)

downloaded=0
for U in "${URLS[@]}"; do
  echo "Trying: $U"
  if command -v curl >/dev/null 2>&1; then
    if curl -fsSL "$U" -o "$OUT_PATH"; then
      downloaded=1
      break
    fi
  elif command -v wget >/dev/null 2>&1; then
    if wget -qO "$OUT_PATH" "$U"; then
      downloaded=1
      break
    fi
  else
    echo "Neither curl nor wget available; please install one or download the font manually." >&2
    exit 3
  fi
done

if [[ $downloaded -ne 1 ]]; then
  echo "All download attempts failed. Please download Roboto-Regular.ttf manually from:\n  https://github.com/google/fonts/tree/main/apache/roboto\nand place it at: $OUT_PATH" >&2
  exit 4
fi

if [[ ! -f "$OUT_PATH" ]]; then
  echo "Download failed: $OUT_PATH not found" >&2
  exit 4
fi

size=$(wc -c < "$OUT_PATH" | tr -d ' ')
echo "Downloaded: $OUT_PATH ($size bytes)"
if [[ $size -lt 10000 ]]; then
  echo "Downloaded file is unexpectedly small (<10KB). Inspect $OUT_PATH manually." >&2
  exit 5
fi

if [[ $COMMIT -eq 1 ]]; then
  git add -- "$OUT_PATH"
  git commit -m "chore: vendor Roboto-Regular.ttf into docs/fonts (for deterministic SVG->PNG exports)"
  echo "Committed $OUT_PATH"
else
  echo "Font downloaded. To commit run: git add docs/fonts/Roboto-Regular.ttf && git commit -m 'chore: vendor Roboto-Regular.ttf'"
fi
