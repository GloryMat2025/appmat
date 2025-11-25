#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

// Folder utama
const docsDir = path.resolve('docs');
const outDir = path.join(docsDir, 'exported');
const zipPath = path.join(outDir, 'exported.zip');

// Pastikan folder wujud
if (!fs.existsSync(docsDir)) {
  console.error(`❌ Folder 'docs' tak wujud di: ${docsDir}`);
  process.exit(2);
}
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Import Sharp
let sharp;
try {
  sharp = (await import('sharp')).default;
} catch (err) {
  console.error('❌ Sharp belum dipasang.');
  console.error('➡️  Jalankan: pnpm add -D sharp');
  process.exit(3);
}

// Dapatkan semua fail SVG
const svgFiles = fs.readdirSync(docsDir).filter((f) => f.endsWith('.svg'));

if (svgFiles.length === 0) {
  console.error('❌ Tiada fail SVG dijumpai dalam folder docs/');
  process.exit(4);
}

console.log(`📄 Jumpa ${svgFiles.length} fail SVG. Memulakan penukaran...`);

for (const file of svgFiles) {
  const svgPath = path.join(docsDir, file);
  const pngPath = path.join(outDir, file.replace('.svg', '.png'));

  try {
    const svgBuffer = fs.readFileSync(svgPath);
    await sharp(svgBuffer).png({ quality: 90 }).toFile(pngPath);
<<<<<<< HEAD
    console.log(`Wrote PNG: ${pngPath}`);
=======
    console.log(`✅ ${file} → ${path.basename(pngPath)}`);
>>>>>>> f21627f04ad8552970a779d3f1c2b161aae1a46b
  } catch (e) {
    console.error(`⚠️  Gagal convert ${file}:`, e.message);
  }
}

// Zip semua hasil PNG
console.log('📦 Memampatkan hasil ke exported.zip...');
const output = fs.createWriteStream(zipPath);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  console.log(`🎉 Siap! ${archive.pointer()} bytes ditulis ke ${zipPath}`);
});
archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);
archive.directory(outDir, false);
await archive.finalize();
