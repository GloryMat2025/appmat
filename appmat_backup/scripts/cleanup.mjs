import fs from 'fs';

const junk = [
  'h -u origin add-playwright-parity-workflow',
  'h origin add-playwright-parity-workflow',
  'mall comment for review',
  'tatus',
];

for (const file of junk) {
  const path = new URL(`../${file}`, import.meta.url);
  if (fs.existsSync(path)) {
    fs.unlinkSync(path);
    console.log(`🧹 Removed: ${file}`);
  }
}
console.log('✅ Cleanup complete.');
