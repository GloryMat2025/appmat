#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

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

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch (err) {
  console.error('sharp is not installed. Install it to enable SVG->PNG export:');
  console.error('pnpm add -D sharp');
  process.exit(3);
}

(async () => {
  try {
    const svgBuffer = fs.readFileSync(svgPath);
    await sharp(svgBuffer)
      .png({ quality: 90 })
      .toFile(pngPath);
    console.log(`Wrote PNG: ${pngPath}`);
  } catch (e) {
    console.error('Failed to convert SVG to PNG:', e);
    process.exit(1);
  }
})();
