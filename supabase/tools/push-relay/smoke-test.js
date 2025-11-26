#!/usr/bin/env node
// Cross-platform Node smoke-test for push-relay
// Starts the relay on a free port, waits for /health, posts simulated notify and order-status, then stops the process.

const { spawn } = require('child_process');
const http = require('http');

const PORT = process.env.PORT ? Number(process.env.PORT) : 4020;
const REPO_DIR = __dirname;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(path, method = 'GET', body) {
  const opts = { method, hostname: 'localhost', port: PORT, path, headers: {} };
  if (body) {
    const s = JSON.stringify(body);
    opts.headers['Content-Type'] = 'application/json';
    opts.headers['Content-Length'] = Buffer.byteLength(s);
    return new Promise((resolve, reject) => {
      const req = http.request(opts, (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null });
          } catch (e) {
            resolve({ status: res.statusCode, body: data });
          }
        });
      });
      req.on('error', reject);
      req.write(s);
      req.end();
    });
  }
  return new Promise((resolve, reject) => {
    const req = http.request(opts, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log(`Starting relay smoke-test on port ${PORT} (cwd=${REPO_DIR})`);

  const nodeCmd = process.platform === 'win32' ? 'node' : 'node';
  const child = spawn(nodeCmd, ['index.js'], {
    cwd: REPO_DIR,
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (d) => process.stdout.write(`[relay] ${d}`));
  child.stderr.on('data', (d) => process.stderr.write(`[relay:err] ${d}`));

  // wait for /health
  const deadline = Date.now() + 10000;
  let up = false;
  while (Date.now() < deadline) {
    try {
      const res = await fetchJson('/health');
      if (res && res.status === 200) {
        up = true;
        console.log('health ok', res.body);
        break;
      }
    } catch (e) {
      // swallow
    }
    await wait(500);
  }

  if (!up) {
    console.error('Relay did not start within timeout. Check relay.log or stdout.');
    child.kill('SIGKILL');
    process.exit(2);
  }

  // POST /api/notify
  try {
    const notifyPayload = {
      subscription: {
        endpoint: 'https://example.com/fake-sub',
        keys: { p256dh: 'BAbCdEfGhIjKlMnOpQrStUvWxY', auth: 'abcd1234' },
      },
      message: { title: 'Smoke Test', body: 'Simulated notify' },
    };
    const r = await fetchJson('/api/notify', 'POST', notifyPayload);
    console.log('/api/notify ->', r.status, r.body);
  } catch (_e) {
    void _e;
    console.error(_e);
  }

  // POST /order-status
  try {
    const orderPayload = { order_id: 555, status: 'processing' };
    const r = await fetchJson('/order-status', 'POST', orderPayload);
    console.log('/order-status ->', r.status, r.body);
  } catch (_error) {
    void _error;
  }

  // stop
  console.log('Stopping relay...');
  child.kill('SIGINT');
  await wait(500);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
