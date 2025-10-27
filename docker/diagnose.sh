#!/usr/bin/env sh
set -eu
rsvg-convert --version || true
if command -v dpkg >/dev/null 2>&1; then
  dpkg -s librsvg2-bin 2>/dev/null | head -n 5 || true
fi
apt-cache policy librsvg2-bin || true
echo '--- fonts (first 200 lines)'
fc-list | head -n 200 || true
