// Generate VAPID keys using local web-push, then spawn index.js with env set.
try {
  const path = require('path');
  const webpush = require(path.join(__dirname, 'node_modules', 'web-push'));
  const { spawn } = require('child_process');

  const keys = webpush.generateVAPIDKeys();
  const env = Object.assign({}, process.env, {
    VAPID_PUBLIC_KEY: keys.publicKey,
    VAPID_PRIVATE_KEY: keys.privateKey,
    RELAY_TOKEN: process.env.RELAY_TOKEN || 'super-secret-token',
    PORT: process.env.PORT || '4001'
  });

  console.log('Starting relay with generated VAPID keys on port', env.PORT);

  const child = spawn(process.execPath, [path.join(__dirname, 'index.js')], {
    cwd: __dirname,
    env,
    stdio: 'inherit'
  });

  child.on('exit', (code, signal) => {
    console.log('relay exited', { code, signal });
    process.exit(code || 0);
  });
} catch (err) {
  console.error('Failed to start relay with generated keys:', err && (err.stack || err));
  process.exit(1);
}
