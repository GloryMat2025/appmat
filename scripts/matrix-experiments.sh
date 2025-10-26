#!/bin/sh
set -ex

# matrix-experiments.sh
# Runs a set of export variants and records SHA256, size and IDAT diffs

OUTDIR=/workspace/out/matrix
mkdir -p "$OUTDIR"
CI_ARTIFACT=/workspace/docker-repro-architecture-png/architecture-refined.png

# ensure non-interactive pnpm (node deps are baked into the image at build time)
export CI=true

hashfile() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1"  " $2}'
  else
    # fallback to openssl
    openssl dgst -sha256 "$1" | sed 's/^.*= //'
  fi
}

record() {
  FILE="$1"
  NAME="$2"
  if [ -f "$FILE" ]; then
    SIZE=$(stat -c%s "$FILE" 2>/dev/null || (powershell -Command "(Get-Item \"$FILE\").Length" 2>/dev/null))
    SHA=$(hashfile "$FILE")
    echo "$NAME,$FILE,$SIZE,$SHA" >> "$OUTDIR/results.csv"
  else
    echo "$NAME,missing,0," >> "$OUTDIR/results.csv"
  fi
}

# clear results
rm -f "$OUTDIR/results.csv"
echo "variant,path,size,sha256" > "$OUTDIR/results.csv"

# 1) rsvg baseline
rsvg-convert -o "$OUTDIR/arch-rsvg-default.png" /workspace/docs/architecture-refined.svg || true
record "$OUTDIR/arch-rsvg-default.png" rsvg-default

# 2) rsvg after installing vendored Roboto system-wide
mkdir -p /usr/local/share/fonts/truetype/roboto
cp /workspace/docs/fonts/Roboto-Regular.ttf /usr/local/share/fonts/truetype/roboto/ || true
fc-cache -f -v > "$OUTDIR/fc-cache-roboto.txt" 2>&1 || true
fc-list | grep -i roboto > "$OUTDIR/fc-list-roboto.txt" || true
rsvg-convert -o "$OUTDIR/arch-rsvg-roboto.png" /workspace/docs/architecture-refined.svg || true
record "$OUTDIR/arch-rsvg-roboto.png" rsvg-roboto

# 3) Playwright exports (ensure Playwright installed - install browsers)
# Install browsers if necessary
pnpm -s exec playwright install --with-deps || true

# Run Playwright exporter with embedding forced
export SVG_PW_FORCE_NO_EMBED=0
export SVG_PW_DPR=1
node /workspace/scripts/svg-to-png-pw.mjs /workspace/docs/architecture-refined.svg "$OUTDIR/arch-pw-embed.png" || true
record "$OUTDIR/arch-pw-embed.png" pw-embed

# Run Playwright exporter with embedding disabled
export SVG_PW_FORCE_NO_EMBED=1
node /workspace/scripts/svg-to-png-pw.mjs /workspace/docs/architecture-refined.svg "$OUTDIR/arch-pw-noembed.png" || true
record "$OUTDIR/arch-pw-noembed.png" pw-noembed

# DPR 2
export SVG_PW_FORCE_NO_EMBED=0
export SVG_PW_DPR=2
node /workspace/scripts/svg-to-png-pw.mjs /workspace/docs/architecture-refined.svg "$OUTDIR/arch-pw-dpr2.png" || true
record "$OUTDIR/arch-pw-dpr2.png" pw-dpr2

# 4) force Playwright by disabling rsvg
if [ -x /usr/bin/rsvg-convert ]; then
  mv /usr/bin/rsvg-convert /usr/bin/rsvg-convert.disabled || true
fi
pnpm -s run docs:export-png:ci || true
cp /workspace/docs/architecture-refined.png "$OUTDIR/arch-pw-ci.png" || true
record "$OUTDIR/arch-pw-ci.png" pw-ci

# Compute IDAT-diff against CI artifact for each produced file
NODE=/usr/bin/node
for f in "$OUTDIR"/*.png; do
  [ -f "$f" ] || continue
  bn=$(basename "$f")
  $NODE /workspace/scripts/png-idat-diff.mjs "$CI_ARTIFACT" "$f" > "$OUTDIR/${bn}.idat-diff.txt" 2>&1 || true
  echo "wrote $OUTDIR/${bn}.idat-diff.txt"
done

# List results
ls -l "$OUTDIR"
cat "$OUTDIR/results.csv" || true

echo done
