// i18n-missing-keys.js
// Usage: node i18n-missing-keys.js
// Checks for missing or extra keys between en.json and bm.json

const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'public', 'i18n', 'en.json');
const bmPath = path.join(__dirname, 'public', 'i18n', 'bm.json');

function flatten(obj, prefix = '') {
  return Object.keys(obj).reduce((acc, k) => {
    const pre = prefix ? prefix + '.' : '';
    if (typeof obj[k] === 'object' && obj[k] !== null) {
      Object.assign(acc, flatten(obj[k], pre + k));
    } else {
      acc[pre + k] = obj[k];
    }
    return acc;
  }, {});
}

function main() {
  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const bm = JSON.parse(fs.readFileSync(bmPath, 'utf8'));
  const enFlat = flatten(en);
  const bmFlat = flatten(bm);
  const enKeys = Object.keys(enFlat);
  const bmKeys = Object.keys(bmFlat);
  const missingInBm = enKeys.filter(k => !(k in bmFlat));
  const missingInEn = bmKeys.filter(k => !(k in enFlat));
  if (missingInBm.length === 0 && missingInEn.length === 0) {
    console.log('✅ All i18n keys are present in both en.json and bm.json');
    process.exit(0);
  }
  if (missingInBm.length) {
    console.warn('❌ Missing in bm.json:', missingInBm);
  }
  if (missingInEn.length) {
    console.warn('❌ Missing in en.json:', missingInEn);
  }
  process.exit(1);
}

main();
