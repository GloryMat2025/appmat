#!/usr/bin/env node
// images-pipeline.mjs
// Generate WebP/AVIF responsive variants and rewrite <img> in HTML to <picture>
// Usage: node images-pipeline.mjs ./dist
import fs from 'fs';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// --- Config ---
const ROOT = path.resolve(process.argv[2] || './dist');
const WIDTHS = [320, 480, 640, 960, 1280];
const WEBP_QUALITY = 82;
const AVIF_QUALITY = 45;

// Heuristics for sizes attribute by path pattern
function sizesFor(srcPath) {
  if (/\/carousel\//i.test(srcPath)) return '100vw'; // full-bleed carousel
  if (/\/products?\//i.test(srcPath)) return '(min-width: 640px) 50vw, 100vw'; // 2-col grid on sm+
  return '100vw';
}

// --- Helpers ---
function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else if (ent.isFile()) out.push(p);
  }
  return out;
}

function uniq(arr) {
  return [...new Set(arr)];
}

// Load Cheerio & Sharp dynamically (so the script doesn't crash on import if not installed)
async function loadDeps() {
  const cheerio = await import('cheerio');
  const sharp = (await import('sharp')).default;
  return { cheerio, sharp };
}

function isRaster(p) {
  return /\.(?:jpe?g|png)$/i.test(p);
}

function makeVariantName(absFile, width, ext) {
  const dir = path.dirname(absFile);
  const base = path.basename(absFile, path.extname(absFile));
  return path.join(dir, `${base}-w${width}.${ext}`);
}

function relFromRoot(abs) {
  return abs.replace(ROOT + path.sep, '').split(path.sep).join('/');
}

async function processImage(absFile, sharp) {
  const out = [];
  for (const w of WIDTHS) {
    const avifPath = makeVariantName(absFile, w, 'avif');
    const webpPath = makeVariantName(absFile, w, 'webp');

    if (!fs.existsSync(avifPath)) {
      await sharp(absFile).resize({ width: w }).avif({ quality: AVIF_QUALITY }).toFile(avifPath);
    }
    if (!fs.existsSync(webpPath)) {
      await sharp(absFile).resize({ width: w }).webp({ quality: WEBP_QUALITY }).toFile(webpPath);
    }
    out.push({
      width: w,
      avif: '/' + relFromRoot(avifPath),
      webp: '/' + relFromRoot(webpPath),
    });
  }
  return out.sort((a,b) => a.width - b.width);
}

function buildSrcset(list, key) {
  return list.map(v => `${v[key]} ${v.width}w`).join(', ');
}

async function rewriteHtml(htmlAbsPath, cheerio, variantsBySrc) {
  const html = fs.readFileSync(htmlAbsPath, 'utf-8');
  const $ = cheerio.default.load(html, { decodeEntities: false });

  $('img[src]').each((_, el) => {
    const img = $(el);
    if (img.attr('data-no-responsive') !== undefined) return; // opt-out

    const src = img.attr('src');
    if (!src || !/\.(?:jpe?g|png)$/i.test(src)) return;

    const record = variantsBySrc.get(src) || variantsBySrc.get(src.replace(/^\//, ''));
    if (!record) return;

    const variants = record.variants;
    const sizes = sizesFor(src);

    // Build <picture>
    const picture = $('<picture></picture>');
    picture.append(`<source type="image/avif" srcset="${buildSrcset(variants, 'avif')}" sizes="${sizes}">`);
    picture.append(`<source type="image/webp" srcset="${buildSrcset(variants, 'webp')}" sizes="${sizes}">`);

    // Keep original <img> as fallback (preserve attributes)
    const fallback = $('<img/>');

    // Copy attributes
    for (const { name, value } of el.attribs ? Object.entries(el.attribs).map(([name, value]) => ({ name, value })) : []) {
      if (name === 'src') continue; // we'll keep original as-is
      fallback.attr(name, value);
    }
    fallback.attr('src', src);

    picture.append(fallback);
    img.replaceWith(picture);
  });

  fs.writeFileSync(htmlAbsPath, $.html());
}

async function main() {
  console.log(`🖼️  Image pipeline on: ${ROOT}`);
  const { cheerio, sharp } = await loadDeps();

  if (!fs.existsSync(ROOT)) {
    console.error('Directory not found:', ROOT);
    process.exit(1);
  }

  // 1) Collect HTML files
  const htmlFiles = walk(ROOT).filter(p => p.toLowerCase().endsWith('.html'));
  if (!htmlFiles.length) {
    console.log('No HTML files found. Nothing to do.');
    return;
  }

  // 2) Collect <img src="..."> paths referenced
  const referenced = new Set();
  for (const html of htmlFiles) {
    const s = fs.readFileSync(html, 'utf-8');
    const $ = cheerio.default.load(s);
    $('img[src]').each((_, el) => {
      const src = $(el).attr('src');
      if (src) referenced.add(src.split('?')[0].split('#')[0]);
    });
  }
  const refs = uniq([...referenced]);

  // 3) Map referenced raster paths to absolute files within ROOT
  const variantsBySrc = new Map();
  for (const ref of refs) {
    if (!/\.(?:jpe?g|png)$/i.test(ref)) continue;
    // Resolve absolute path from ROOT
    const abs = path.resolve(ROOT, ref.replace(/^\//, ''));
    if (!fs.existsSync(abs)) {
      console.warn('⚠️  Referenced image not found, skipping:', ref);
      continue;
    }

    // Generate AVIF/WEBP variants for configured widths
    const variants = await processImage(abs, sharp);
    variantsBySrc.set(ref, { abs, variants });
  }

  // 4) Rewrite HTML to <picture> with responsive sources
  for (const html of htmlFiles) {
    await rewriteHtml(html, cheerio, variantsBySrc);
  }

  // 5) Summary
  console.log(`✅ Processed ${variantsBySrc.size} images across ${htmlFiles.length} HTML files.`);
  console.log('   Added AVIF/WebP responsive sources and <picture> markup.');
  console.log('   Use data-no-responsive on <img> to opt-out for a specific element.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
