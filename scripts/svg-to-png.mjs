#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

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
