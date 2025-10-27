import fs from 'fs';
import path from 'path';

const p = process.argv[2] || 'out/pixel-diff.ppm';
if (!fs.existsSync(p)) {
  console.error('PPM not found:', p);
  process.exit(2);
}
const buf = fs.readFileSync(p);
let idx = 0;
function readToken() {
  // skip whitespace
  while (idx < buf.length && (buf[idx] === 0x20 || buf[idx] === 0x0a || buf[idx] === 0x0d || buf[idx] === 0x09)) idx++;
  let start = idx;
  while (idx < buf.length && buf[idx] > 0x20) idx++;
  return buf.toString('ascii', start, idx);
}
const magic = readToken();
if (magic !== 'P6') {
  console.error('Unsupported PPM magic:', magic);
  process.exit(3);
}
const width = parseInt(readToken(), 10);
const height = parseInt(readToken(), 10);
const maxval = parseInt(readToken(), 10);
// next byte is single newline; idx currently at first byte after newline
// pixel data starts at idx
const pixelStart = idx;
const expected = width * height * 3;
const available = buf.length - pixelStart;
if (available < expected) {
  console.error(`PPM truncated: expected ${expected} bytes, have ${available}`);
  process.exit(4);
}
let diffPixels = 0;
let sumIntensity = 0;
let maxIntensity = 0;
let minIntensity = 255;
let bbox = {minX: width, minY: height, maxX: 0, maxY: 0};
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = pixelStart + (y * width + x) * 3;
    const r = buf[i];
    const g = buf[i+1];
    const b = buf[i+2];
    const intensity = Math.round((r + g + b) / 3);
    if (intensity > 0) {
      diffPixels++;
      sumIntensity += intensity;
      if (intensity > maxIntensity) maxIntensity = intensity;
      if (intensity < minIntensity) minIntensity = intensity;
      if (x < bbox.minX) bbox.minX = x;
      if (y < bbox.minY) bbox.minY = y;
      if (x > bbox.maxX) bbox.maxX = x;
      if (y > bbox.maxY) bbox.maxY = y;
    }
  }
}
const total = width * height;
console.log('PPM analysis:', path.resolve(p));
console.log(` size: ${width}x${height}, maxval=${maxval}, pixels=${total}`);
console.log(` differing pixels: ${diffPixels} (${((diffPixels/total)*100).toFixed(2)}%)`);
if (diffPixels>0) {
  console.log(` intensity: avg=${(sumIntensity/diffPixels).toFixed(1)}, min=${minIntensity}, max=${maxIntensity}`);
  console.log(` bbox: x=${bbox.minX}..${bbox.maxX}, y=${bbox.minY}..${bbox.maxY}`);
}
