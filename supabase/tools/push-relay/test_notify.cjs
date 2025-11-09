// Simple test script to POST a sample subscription to the relay.
// Usage:
// set RELAY_URL=http://localhost:4000/api/notify
// set RELAY_TOKEN=super-secret-token
// node test_notify.cjs

const RELAY_URL = process.env.RELAY_URL || 'http://localhost:4000/api/notify';
const RELAY_TOKEN = process.env.RELAY_TOKEN || '';

const sampleSubscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/fake-endpoint',
  keys: {
    p256dh: 'BExampleP256dhKey',
    auth: 'ExampleAuth'
  }
};

const payload = { title: 'Relay test', body: 'This is a test payload from test_notify.cjs' };

(async function main(){
  try {
    const res = await fetch(RELAY_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(RELAY_TOKEN ? { 'x-relay-token': RELAY_TOKEN } : {})
      },
      body: JSON.stringify({ subscription: sampleSubscription, payload, ttl: 60 })
    });

    console.log('Status:', res.status);
    const body = await res.text();
    console.log('Body:', body);
  } catch (err) {
    console.error('Error sending test notify:', err && err.stack ? err.stack : err);
  }
})();
