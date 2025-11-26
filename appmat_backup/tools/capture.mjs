#!/usr/bin/env node
/* Minimal Playwright capture script (Windows-safe)
   - Navigates to the local dev server (default http://localhost:5173)
   - Saves a screenshot and a Playwright trace into shots/local-<timestamp>/
   - Lightweight flags: --skip-on-error, --persistent
*/
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const skipOnError = args.includes('--skip-on-error');
const persistent = args.includes('--persistent');

const URL = process.env.URL || 'http://localhost:5173';

function ts() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function run() {
  const outDir = path.resolve(process.cwd(), 'shots', `local-${ts()}`);
  fs.mkdirSync(outDir, { recursive: true });
  const tracePath = path.join(outDir, 'trace.zip');
  const screenshotPath = path.join(outDir, 'page.png');

  console.log('capture: starting', { URL, outDir });
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();
  try {
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: screenshotPath, fullPage: true });
    await context.tracing.stop({ path: tracePath });
    console.log('capture: done', { screenshot: screenshotPath, trace: tracePath });
    if (!persistent) await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('capture: error', err && err.message);
    if (!persistent) await browser.close();
    if (skipOnError) process.exit(0);
    process.exit(2);
  }
}

run();
