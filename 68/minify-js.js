// scripts/minify-js.js
// Batch minify all JS files in a directory to .min.js using terser
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dirs = [
  path.join(__dirname, '../public/assets/js'),
  path.join(__dirname, '../public/js')
];

for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') && !f.endsWith('.min.js'));
  for (const file of files) {
    const inFile = path.join(dir, file);
    const outFile = path.join(dir, file.replace(/\.js$/, '.min.js'));
    try {
      execSync(`npx terser "${inFile}" -c -m --keep-fnames -o "${outFile}"`);
      console.log(`Minified: ${file} → ${path.basename(outFile)}`);
    } catch (e) {
      console.error(`Failed to minify ${file}:`, e.message);
    }
  }
}
