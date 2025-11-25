#!/usr/bin/env node
// Generates VAPID keys using the `web-push` package.
// Usage: node supabase/scripts/generate_vapid.cjs

try {
  const webpush = require('web-push');
  const keys = webpush.generateVAPIDKeys();
  console.log(JSON.stringify({
    publicKey: keys.publicKey,
    privateKey: keys.privateKey
  }, null, 2));
} catch (err) {
  console.error('Missing dependency: web-push.');
  console.error('Install it with: npm install web-push --save-dev');
  process.exit(2);
}
