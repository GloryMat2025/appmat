import fs from 'fs';
import zlib from 'zlib';

function readPNG(file) {
  const buf = fs.readFileSync(file);
  if (buf.slice(0,8).toString('hex') !== '89504e470d0a1a0a') throw new Error('Not a PNG');
  let offset = 8;
  let ihdr = null;
  const idats = [];
  while (offset < buf.length) {
    if (offset + 8 > buf.length) break;
    const len = buf.readUInt32BE(offset);
    const type = buf.slice(offset+4, offset+8).toString('ascii');
    const dataStart = offset + 8;
    const dataEnd = dataStart + len;
    if (dataEnd + 4 > buf.length) break;
    const data = buf.slice(dataStart, dataEnd);
    if (type === 'IHDR') {
      ihdr = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
        bitDepth: data.readUInt8(8),
        colorType: data.readUInt8(9),
        comp: data.readUInt8(10),
        filter: data.readUInt8(11),
        interlace: data.readUInt8(12)
      };
    } else if (type === 'IDAT') {
      idats.push(data);
    }
    offset = dataEnd + 4;
  }
  const idatBuf = Buffer.concat(idats);
  const inflated = zlib.inflateSync(idatBuf);
  return { ihdr, inflated };
}

function paeth(a,b,c){
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function unfilterScanlines(inflated, w, h, bpp){
  const scanlineLen = 1 + w * bpp;
  const out = Buffer.alloc(h * w * bpp);
  for (let r=0;r<h;r++){
    const lineStart = r * scanlineLen;
    const filterType = inflated[lineStart];
    const line = inflated.slice(lineStart+1, lineStart+scanlineLen);
    const prevLine = (r===0) ? null : out.slice((r-1)*w*bpp, r*w*bpp);
    const recon = Buffer.alloc(w*bpp);
    if (filterType === 0){
      // None
      for (let i=0;i<line.length;i++) recon[i] = line[i];
    } else if (filterType === 1){
      // Sub
      for (let i=0;i<line.length;i++){
        const left = (i - bpp) >= 0 ? recon[i-bpp] : 0;
        recon[i] = (line[i] + left) & 0xFF;
      }
    } else if (filterType === 2){
      // Up
      for (let i=0;i<line.length;i++){
        const up = prevLine ? prevLine[i] : 0;
        recon[i] = (line[i] + up) & 0xFF;
      }
    } else if (filterType === 3){
      // Average
      for (let i=0;i<line.length;i++){
        const left = (i - bpp) >= 0 ? recon[i-bpp] : 0;
        const up = prevLine ? prevLine[i] : 0;
        const val = Math.floor((left + up)/2);
        recon[i] = (line[i] + val) & 0xFF;
      }
    } else if (filterType === 4){
      // Paeth
      for (let i=0;i<line.length;i++){
        const left = (i - bpp) >= 0 ? recon[i-bpp] : 0;
        const up = prevLine ? prevLine[i] : 0;
        const upLeft = (prevLine && (i - bpp) >= 0) ? prevLine[i-bpp] : 0;
        const val = paeth(left, up, upLeft);
        recon[i] = (line[i] + val) & 0xFF;
      }
    } else {
      throw new Error('Unsupported filter type: '+filterType);
    }
    recon.copy(out, r*w*bpp);
  }
  return out;
}

function rgbaFromUnfiltered(unfiltered, w, h, colorType){
  // support colorType 6 (RGBA) and 2 (RGB)
  if (colorType === 6){
    return unfiltered; // already RGBA bytes
  }
  if (colorType === 2){
    // expand RGB to RGBA with alpha=255
    const out = Buffer.alloc(w*h*4);
    for (let i=0, j=0;i<unfiltered.length;i+=3,j+=4){
      out[j] = unfiltered[i];
      out[j+1] = unfiltered[i+1];
      out[j+2] = unfiltered[i+2];
      out[j+3] = 255;
    }
    return out;
  }
  throw new Error('Unsupported color type for RGBA conversion: '+colorType);
}

function writePPM(path, w, h, rgbBuf){
  const header = `P6\n${w} ${h}\n255\n`;
  const out = Buffer.concat([Buffer.from(header,'ascii'), rgbBuf]);
  fs.writeFileSync(path, out);
}

function diffImages(aPath, bPath, outPath){
  const a = readPNG(aPath);
  const b = readPNG(bPath);
  if (!a.ihdr || !b.ihdr) throw new Error('Missing IHDR');
  if (a.ihdr.width !== b.ihdr.width || a.ihdr.height !== b.ihdr.height) throw new Error('Dimensions differ');
  const w = a.ihdr.width; const h = a.ihdr.height;
  const bppA = (a.ihdr.colorType === 6) ? 4 : (a.ihdr.colorType === 2 ? 3 : null);
  const bppB = (b.ihdr.colorType === 6) ? 4 : (b.ihdr.colorType === 2 ? 3 : null);
  if (!bppA || !bppB) throw new Error('Unsupported color types');
  const unA = unfilterScanlines(a.inflated, w, h, bppA);
  const unB = unfilterScanlines(b.inflated, w, h, bppB);
  const pixA = rgbaFromUnfiltered(unA, w, h, a.ihdr.colorType);
  const pixB = rgbaFromUnfiltered(unB, w, h, b.ihdr.colorType);
  // build RGB diff buffer
  const rgbBuf = Buffer.alloc(w*h*3);
  let diffPixels = 0;
  let totalDiff = 0;
  for (let i=0, j=0;i<pixA.length;i+=4,j+=3){
    const dr = Math.abs(pixA[i]-pixB[i]);
    const dg = Math.abs(pixA[i+1]-pixB[i+1]);
    const db = Math.abs(pixA[i+2]-pixB[i+2]);
    const d = Math.min(255, Math.round((dr+dg+db)/3));
    if (d>0) diffPixels++;
    totalDiff += d;
    // visualize as red-ish: R=d, G=0, B=0 (or greyscale)
    rgbBuf[j] = d; rgbBuf[j+1] = d; rgbBuf[j+2] = d;
  }
  writePPM(outPath, w, h, rgbBuf);
  return {w,h,diffPixels,totalDiff};
}

if (process.argv.length < 4){
  console.log('Usage: node png-visual-diff.mjs fileA.png fileB.png');
  process.exit(2);
}

const a = process.argv[2];
const b = process.argv[3];
const out = process.argv[4] || 'out/pixel-diff.ppm';
try{
  fs.mkdirSync('out',{recursive:true});
  const res = diffImages(a,b,out);
  console.log('Wrote visual diff to', out);
  console.log('Width x Height:', res.w+'x'+res.h);
  console.log('Pixels with non-zero diff:', res.diffPixels, 'of', res.w*res.h);
  console.log('Total diff sum (0-255 aggregate):', res.totalDiff);
} catch (err){
  console.error('Error:', err.message);
  process.exit(2);
}
