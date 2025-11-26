const { execSync } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');

function tryCmd(cmd) {
  try {
    console.log('> ' + cmd);
    const out = execSync(cmd, { stdio: 'inherit' });
    return true;
  } catch (err) {
    console.error('Command failed:', cmd);
    return false;
  }
}

console.log('Running rebuild-esbuild helper...');

if (tryCmd('pnpm rebuild esbuild')) {
  console.log('pnpm rebuild succeeded.');
  process.exit(0);
}

// fallback to npm (attempt to recreate native binary)
if (tryCmd('npm rebuild esbuild --update-binary')) {
  console.log('npm rebuild --update-binary succeeded.');
  process.exit(0);
}

// final fallback: force-install latest esbuild and let postinstall succeed
if (tryCmd('npm install --no-audit --no-fund --save-dev esbuild@latest')) {
  console.log('npm install esbuild@latest succeeded.');
  process.exit(0);
}

console.error(
  'All attempts to rebuild/install esbuild failed. See the error output above for details.'
);
process.exit(1);

const exe = path.join(__dirname, '../node_modules/esbuild/bin/esbuild.exe');
if (existsSync(exe)) {
  console.log('esbuild binary rebuilt successfully!');
} else {
  console.error('esbuild binary missing after rebuild.');
  process.exit(1);
}
