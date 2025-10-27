#!/bin/sh
set -ex

mkdir -p /workspace/out

# baseline font list and rsvg version
fc-list > /workspace/out/fc-list-before.txt || true
rsvg-convert --version > /workspace/out/rsvg-ver.txt 2>&1 || true

# render with rsvg-convert (baseline)
rsvg-convert -o /workspace/out/arch-rsvg-default.png /workspace/docs/architecture-refined.svg || true

# install vendored Roboto into system fonts and rebuild cache
mkdir -p /usr/local/share/fonts/truetype/roboto
cp /workspace/docs/fonts/Roboto-Regular.ttf /usr/local/share/fonts/truetype/roboto/ || true
fc-cache -f -v > /workspace/out/fc-cache-install.txt 2>&1 || true
fc-list | grep -i roboto > /workspace/out/fc-list-roboto-after.txt || true

# render with rsvg-convert after installing Roboto
rsvg-convert -o /workspace/out/arch-rsvg-roboto.png /workspace/docs/architecture-refined.svg || true

# force Playwright exporter by renaming rsvg
if [ -x /usr/bin/rsvg-convert ]; then mv /usr/bin/rsvg-convert /usr/bin/rsvg-convert.disabled || true; fi
pnpm -s run docs:export-png:ci || true
cp /workspace/docs/architecture-refined.png /workspace/out/arch-pw.png || true

# list output files
ls -l /workspace/out || true

echo done
