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
    // const crc = buf.readUInt32BE(dataEnd);
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

function analyze(a, b) {
  console.log('IHDR A:', a.ihdr);
  console.log('IHDR B:', b.ihdr);
  if (!a.ihdr || !b.ihdr) {
    console.error('Missing IHDR in one file');
    process.exit(2);
  }
  if (a.ihdr.width !== b.ihdr.width || a.ihdr.height !== b.ihdr.height) {
    console.log('Different dimensions — cannot directly per-scanline compare');
    return;
  }
  const w = a.ihdr.width;
  const h = a.ihdr.height;
  const colorType = a.ihdr.colorType;
  const bitDepth = a.ihdr.bitDepth;
  // currently handle 8-bit RGBA (colorType=6)
  const bytesPerPixel = (colorType === 6) ? 4 : (colorType === 2 ? 3 : null);
  if (!bytesPerPixel) {
    console.log('Unsupported color type for fine diff:', colorType);
  }
  const scanlineLen = 1 + w * (bytesPerPixel || 1);
  console.log('Scanline length (incl filter byte):', scanlineLen);
  const aLen = a.inflated.length;
  const bLen = b.inflated.length;
  console.log('Inflated IDAT bytes A:', aLen, 'B:', bLen);
  const minLen = Math.min(aLen, bLen);
  let diffCount = 0;
  let firstDiff = -1;
  for (let i=0;i<minLen;i++){
    if (a.inflated[i] !== b.inflated[i]){
      diffCount++;
      if (firstDiff === -1) firstDiff = i;
    }
  }
  diffCount += Math.abs(aLen - bLen);
  console.log('Total differing bytes in inflated streams:', diffCount);
  if (firstDiff >= 0) {
    console.log('First differing byte index in inflated stream:', firstDiff);
    const row = Math.floor(firstDiff / scanlineLen);
    const colByte = firstDiff % scanlineLen;
    if (colByte === 0) console.log(`Difference is in filter byte of row ${row}`);
    else {
      const px = Math.floor((colByte-1)/bytesPerPixel);
      const channel = (colByte-1) % bytesPerPixel;
      console.log(`Approx first differing pixel: row ${row}, x=${px}, channel=${channel}`);
    }
  }

  // produce a per-row diff count
  const rows = Math.min(h, Math.floor(minLen/scanlineLen));
  const rowDiffs = new Array(rows).fill(0);
  for (let r=0;r<rows;r++){
    const base = r*scanlineLen;
    for (let j=0;j<scanlineLen;j++){
      const ai = base + j;
      const bi = base + j;
      const av = (ai < aLen) ? a.inflated[ai] : null;
      const bv = (bi < bLen) ? b.inflated[bi] : null;
      if (av !== bv) rowDiffs[r]++;
    }
  }
  // show rows with non-zero diffs (collapsed ranges)
  const diffRows = [];
  for (let r=0;r<rows;r++) if (rowDiffs[r]>0) diffRows.push({r,count:rowDiffs[r]});
  console.log('Number of rows with differences:', diffRows.length, 'of', rows);
  if (diffRows.length>0) {
    console.log('Sample differing rows (first 20):');
    diffRows.slice(0,20).forEach(d=>console.log(` row ${d.r} -> ${d.count} differing bytes`));
  }
}

if (process.argv.length < 4) {
  console.log('Usage: node png-idat-diff.mjs fileA.png fileB.png');
  process.exit(2);
}

try {
  const a = readPNG(process.argv[2]);
  const b = readPNG(process.argv[3]);
  analyze(a,b);
} catch (err) {
  console.error('Error:', err.message);
  process.exit(2);
}
