Vendor Roboto font
==================

This repository's SVG->PNG exporter can embed fonts to make rasterization deterministic. The project expects
the Roboto Regular font to be vendored at `docs/fonts/Roboto-Regular.ttf` when running embedding experiments.

How to vendor (automatic)
-------------------------
- Windows (PowerShell, from repo root):

  .\scripts\vendor-roboto.ps1 -Commit

- macOS / Linux (from repo root):

  ./scripts/vendor-roboto.sh --commit

The scripts download the official Roboto Regular TTF from the Google Fonts GitHub repo and commit it to the
current branch (requires network and git).

If you prefer to vendor manually, download the TTF from:

https://github.com/google/fonts/tree/main/apache/roboto

and place it at `docs/fonts/Roboto-Regular.ttf`, then commit it.

License
-------
Roboto is licensed under the Apache License, Version 2.0 (ALv2). By vendoring the font into this repository you
agree to include it under the same license terms.
