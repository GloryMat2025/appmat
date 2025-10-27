import fs from 'fs';
import crypto from 'crypto';

function inspect(file) {
  const buf = fs.readFileSync(file);
  const stat = fs.statSync(file);
  const hash = crypto.createHash('sha256').update(buf).digest('hex');
  console.log('FILE:', file);
  console.log('SIZE:', stat.size, 'bytes');
  console.log('SHA256:', hash);

  if (buf.length < 8 || buf.slice(0,8).toString('hex') !== '89504e470d0a1a0a') {
    console.log('Not a PNG or truncated.');
    return;
  }

  let offset = 8;
  let idatTotal = 0;
  while (offset < buf.length) {
    if (offset + 8 > buf.length) break;
    const len = buf.readUInt32BE(offset);
    const type = buf.slice(offset+4, offset+8).toString('ascii');
    const dataStart = offset + 8;
    const dataEnd = dataStart + len;
    if (dataEnd + 4 > buf.length) break;
    const data = buf.slice(dataStart, dataEnd);
    const crc = buf.readUInt32BE(dataEnd);

    console.log(`CHUNK @${offset}: ${type} (len=${len})`);
    if (type === 'IHDR') {
      const w = data.readUInt32BE(0);
      const h = data.readUInt32BE(4);
      const bit = data.readUInt8(8);
      const col = data.readUInt8(9);
      const comp = data.readUInt8(10);
      const filt = data.readUInt8(11);
      const inter = data.readUInt8(12);
      console.log(`  IHDR: ${w}x${h}, bit=${bit}, color=${col}, comp=${comp}, filter=${filt}, interlace=${inter}`);
    } else if (type === 'tEXt') {
      const nul = data.indexOf(0);
      if (nul !== -1) {
        const k = data.slice(0,nul).toString('latin1');
        const v = data.slice(nul+1).toString('latin1');
        console.log(`  tEXt: ${k}=${v}`);
      } else {
        console.log('  tEXt: (no NUL)');
      }
    } else if (type === 'iTXt' || type === 'zTXt') {
      console.log(`  ${type}: <compressed/utf8 metadata>`);
    } else if (type === 'IDAT') {
      idatTotal += len;
    } else if (type === 'IEND') {
      console.log('  IEND end');
      break;
    }
    offset = dataEnd + 4;
  }
  console.log('Total IDAT bytes:', idatTotal);
  console.log('---\n');
}

if (process.argv.length < 3) {
  console.error('Usage: node png-inspect.js file1 [file2 ...]');
  process.exit(2);
}

for (let i=2;i<process.argv.length;i++) inspect(process.argv[i]);
