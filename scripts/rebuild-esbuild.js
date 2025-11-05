const { execSync } = require('child_process');

function run(cmd) {
  try {
    console.log(`> ${cmd}`);
    execSync(cmd, { stdio: 'inherit' });
    return true;
  } catch (err) {
    return false;
  }
}

// Try pnpm rebuild first
if (run('pnpm rebuild esbuild')) process.exit(0);

// Fallback to npm update-binary rebuild
console.log('pnpm rebuild failed — trying npm rebuild esbuild --update-binary');
if (run('npm rebuild esbuild --update-binary')) process.exit(0);

console.error('ERROR: esbuild rebuild failed for both pnpm and npm.');
process.exit(1);
