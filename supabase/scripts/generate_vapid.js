// generate_vapid.js
// Usage: node generate_vapid.js
// Outputs a small JSON with publicKey and privateKey. Do NOT commit output.

const webpush = require('web-push');
const keys = webpush.generateVAPIDKeys();
console.log(JSON.stringify(keys, null, 2));
