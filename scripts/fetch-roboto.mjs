#!/usr/bin/env node
/*
 Simple helper to download Roboto-Regular.ttf into docs/fonts/.
 Usage: node scripts/fetch-roboto.mjs

 This script downloads the Roboto Regular TTF from the official Google Fonts GitHub
 repository raw URL. It performs a basic size/hash check if provided and saves the file
 to `docs/fonts/Roboto-Regular.ttf`.

 Note: Run this only if you accept the Roboto license (Apache 2.0). This script does
 a direct HTTP GET; if your environment blocks network access, instead copy the TTF
 manually into `docs/fonts/`.
*/
import fs from 'fs';
import path from 'path';
import https from 'https';

const outDir = path.resolve('docs','fonts');
const outPath = path.join(outDir, 'Roboto-Regular.ttf');

const ROBOTO_RAW_URL = 'https://github.com/google/fonts/raw/main/apache/roboto/Roboto%5Bwdth%2Cwght%5D.ttf';
// The URL above contains both width/weight axes; many repos also include Roboto-Regular.ttf separately.
// If that raw path doesn't work for you, replace ROBOTO_RAW_URL with a mirror or local file.

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 400) return reject(new Error('HTTP ' + res.statusCode));
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      const tmp = dest + '.tmp'
      const ws = fs.createWriteStream(tmp);
      res.pipe(ws);
      ws.on('finish', () => {
        ws.close(() => {
          fs.renameSync(tmp, dest);
          resolve(dest);
        });
      });
      ws.on('error', (err) => reject(err));
    });
    req.on('error', reject);
  });
}

(async function main(){
  console.log('Downloading Roboto to:', outPath);
  try {
    await download(ROBOTO_RAW_URL, outPath);
    const s = fs.statSync(outPath);
    console.log('Saved:', outPath);
    console.log('Size:', s.size, 'bytes');
    try {
      const { createHash } = await import('crypto');
      const buf = fs.readFileSync(outPath);
      const sha = createHash('sha256').update(buf).digest('hex');
      console.log('SHA256:', sha);
    } catch (e) {
      // ignore hash errors
    }
    console.log('Done. You can now run: node scripts/check-fonts.mjs');
  } catch (err) {
    console.error('Failed to download Roboto:', err && err.message ? err.message : err);
    console.error('If network is blocked, download the TTF manually and place it at docs/fonts/Roboto-Regular.ttf');
    process.exit(1);
  }
})();
