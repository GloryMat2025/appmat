// Generate VAPID keys using the web-push installed in this folder's node_modules
try {
  const webpush = require('./node_modules/web-push');
  const keys = webpush.generateVAPIDKeys();
  console.log(JSON.stringify(keys, null, 2));
} catch (err) {
  console.error('Failed to generate VAPID keys locally:', err && (err.stack || err));
  process.exit(1);
}
