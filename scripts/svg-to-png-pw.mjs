#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

// Global error handlers to ensure we log full stacks for unexpected runtime errors
process.on('uncaughtException', (err) => {
  console.error('uncaughtException:', err && (err.stack || err.message) || err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('unhandledRejection:', reason && (reason.stack || reason) || reason);
  process.exit(1);
});

const svgPath = path.resolve('docs', 'architecture-refined.svg');
const pngPath = path.resolve('docs', 'architecture-refined.png');

if (!fs.existsSync(svgPath)) {
  console.error(`SVG not found: ${svgPath}`);
  process.exit(2);
}

let svg = fs.readFileSync(svgPath, 'utf8');
// Normalize input to a string and strip potential BOM
if (typeof svg !== 'string') svg = String(svg || '');
if (svg.charCodeAt(0) === 0xFEFF) svg = svg.slice(1);

// Try to parse width/height from the root svg element's attributes (fallbacks present)
let width = 1200, height = 700;
try {
  const viewBoxMatch = svg.match(/viewBox\s*=\s*"(\d+)\s+(\d+)\s+(\d+)\s+(\d+)"/i);
  if (viewBoxMatch && viewBoxMatch.length >= 5) {
    const wv = Number.parseInt(viewBoxMatch[3], 10);
    const hv = Number.parseInt(viewBoxMatch[4], 10);
    if (Number.isFinite(wv) && wv > 0) width = wv;
    if (Number.isFinite(hv) && hv > 0) height = hv;
  } else {
    const w = svg.match(/<svg[^>]*\swidth\s*=\s*"([0-9]+)"/i);
    const h = svg.match(/<svg[^>]*\sheight\s*=\s*"([0-9]+)"/i);
    const wi = w && w[1] ? Number.parseInt(w[1], 10) : NaN;
    const hi = h && h[1] ? Number.parseInt(h[1], 10) : NaN;
    if (Number.isFinite(wi) && wi > 0) width = wi;
    if (Number.isFinite(hi) && hi > 0) height = hi;
  }
} catch (e) {
  // fall back to defaults on any parse error
  console.warn('Warning: error parsing SVG dimensions, using defaults', e && e.message ? e.message : e);
}

const maxAttempts = Number.parseInt(process.env.SVG_PW_ATTEMPTS || '3', 10) || 3;
const attemptDelayMs = Number.parseInt(process.env.SVG_PW_DELAY_MS || '250', 10) || 250;

// Debug mode: --debug or DEBUG_SVG_PW=1 will write the HTML wrapper to .tmp/svg-debug.html
const argvDebug = process.argv.includes('--debug');
const debugMode = argvDebug || process.env.DEBUG_SVG_PW === '1';
if (debugMode) {
  try { await (async function ensureTmp(){ const fsP = await import('fs'); const p = '.tmp'; if (!fsP.existsSync(p)) fsP.mkdirSync(p); })(); } catch (err) { /* ignore */ }
}

async function renderOnce() {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  // Allow forcing device pixel ratio (deviceScaleFactor) for deterministic renders
  const dpr = Number.parseFloat(process.env.SVG_PW_DPR || '1') || 1;
  console.log(`Using deviceScaleFactor (DPR): ${dpr}`);
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr });
    const page = await context.newPage();

    // minimal HTML wrapper so fonts and styles resolve predictably
    const html = `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:transparent}</style>${svg}`;
    if (debugMode) {
      // write out the wrapper for inspection
      try {
        const fs = await import('fs');
        fs.writeFileSync('.tmp/svg-debug.html', html, 'utf8');
        console.log('Wrote debug HTML to .tmp/svg-debug.html');
      } catch (e) {
        console.error('Failed to write debug HTML:', e && e.message ? e.message : e);
      }
    }

    await page.setContent(html, { waitUntil: 'networkidle' });
    // give a bit more time in debug mode
    await page.waitForTimeout(debugMode ? 500 : 150);

    await page.screenshot({ path: pngPath, fullPage: false });
    await browser.close();
    return true;
  } catch (err) {
    console.error('Playwright render error:', err && err.message ? err.message : err);
    if (browser) await browser.close().catch(() => {});
    return false;
  }
}

(async () => {
  for (let i = 1; i <= maxAttempts; i++) {
    console.log(`Attempt ${i}/${maxAttempts} to render SVG -> PNG (viewport: ${width}x${height})`);
    const ok = await renderOnce();
    if (ok) {
      if (fs.existsSync(pngPath)) {
        const stats = fs.statSync(pngPath);
        if (stats.size > 0) {
          console.log(`Wrote PNG: ${pngPath} (${stats.size} bytes)`);
          process.exit(0);
        }
      }
      console.error('Rendered PNG was empty or missing after render.');
      // try again
    }
    if (i < maxAttempts) await new Promise((r) => setTimeout(r, attemptDelayMs));
  }
  console.error('Failed to render SVG via Playwright after multiple attempts.');
  process.exit(1);
})();
