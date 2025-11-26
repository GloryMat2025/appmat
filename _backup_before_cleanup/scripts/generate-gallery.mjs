/**
 * Enhanced Playwright Parity Gallery
 * Compare before/after screenshots interactively.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(ROOT, 'docs');
const OUT_DIR = path.join(ROOT, 'out');
const OUTPUT_HTML = path.join(ROOT, 'gallery.html');

function collectPNGs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.png'))
    .map((f) => path.join(dir, f));
}

// kumpul imej dari dua folder (docs = baseline, out = current)
const docsPNGs = collectPNGs(DOCS_DIR);
const outPNGs = collectPNGs(OUT_DIR);

if (docsPNGs.length === 0 && outPNGs.length === 0) {
  console.log('⚠️  No PNG files found in docs/ or out/');
  process.exit(0);
}

console.log(`🖼️  Found ${docsPNGs.length} docs and ${outPNGs.length} out PNGs.`);

// pairing ikut nama fail
const pairs = outPNGs.map((current) => {
  const name = path.basename(current);
  const baseline = docsPNGs.find((b) => path.basename(b) === name);
  return { name, baseline, current };
});

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Playwright Parity Comparison Gallery</title>
<style>
  body {
    font-family: system-ui, sans-serif;
    background: #f8f9fb;
    padding: 2rem;
  }
  h1 {
    text-align: center;
    margin-bottom: 1.5rem;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 2rem;
  }
  .card {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 3px 8px rgba(0,0,0,0.1);
    overflow: hidden;
    position: relative;
  }
  .compare-container {
    position: relative;
    overflow: hidden;
  }
  .compare-container img {
    width: 100%;
    display: block;
  }
  .compare-overlay {
    position: absolute;
    top: 0; left: 0; bottom: 0;
    width: 50%;
    overflow: hidden;
  }
  .compare-overlay img {
    display: block;
    width: 100%;
  }
  .slider {
    position: absolute;
    top: 0; bottom: 0;
    left: 50%;
    width: 3px;
    background: #0078ff;
    cursor: ew-resize;
  }
  .caption {
    padding: 0.75rem;
    text-align: center;
    font-weight: 500;
    background: #fafafa;
    border-top: 1px solid #eee;
  }
  footer {
    text-align: center;
    margin-top: 2rem;
    color: #666;
    font-size: 0.9rem;
  }
</style>
</head>
<body>
  <h1>Playwright Visual Parity Gallery</h1>
  <div class="grid">
    ${pairs
      .map((p) => {
        if (p.baseline)
          return `
          <div class="card">
            <div class="compare-container" data-name="${p.name}">
              <img src="${path.relative(ROOT, p.current).replace(/\\/g, '/')}" alt="after">
              <div class="compare-overlay">
                <img src="${path.relative(ROOT, p.baseline).replace(/\\/g, '/')}" alt="before">
              </div>
              <div class="slider"></div>
            </div>
            <div class="caption">${p.name}</div>
          </div>`;
        else
          return `
          <div class="card">
            <img src="${path.relative(ROOT, p.current).replace(/\\/g, '/')}" alt="${p.name}">
            <div class="caption">${p.name} (no baseline)</div>
          </div>`;
      })
      .join('\n')}
  </div>
  <footer>Generated automatically on ${new Date().toLocaleString()}</footer>
<script>
  // simple slider handler
  document.querySelectorAll(".compare-container").forEach((container) => {
    const overlay = container.querySelector(".compare-overlay");
    const slider = container.querySelector(".slider");

    const update = (clientX) => {
      const rect = container.getBoundingClientRect();
      let x = clientX - rect.left;
      x = Math.max(0, Math.min(x, rect.width));
      const pct = (x / rect.width) * 100;
      overlay.style.width = pct + "%";
      slider.style.left = pct + "%";
    };

    let dragging = false;

    slider.addEventListener("pointerdown", (e) => {
      dragging = true;
      slider.setPointerCapture && slider.setPointerCapture(e.pointerId);
    });

    container.addEventListener("pointerup", (e) => {
      dragging = false;
      try { container.releasePointerCapture && container.releasePointerCapture(e.pointerId); } catch (err) {}
    });

    container.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      update(e.clientX);
    });

    // touch support
    slider.addEventListener("touchstart", (e) => {
      dragging = true;
    });
    document.addEventListener("touchend", () => (dragging = false));
    document.addEventListener("touchmove", (e) => {
      if (!dragging) return;
      update(e.touches[0].clientX);
    });

    // initialize center
    const rect = container.getBoundingClientRect();
    update(rect.left + rect.width / 2);
  });
</script>
</body>
</html>`;

// write output
fs.writeFileSync(OUTPUT_HTML, html, 'utf8');
console.log(`Gallery written to ${OUTPUT_HTML}`);
