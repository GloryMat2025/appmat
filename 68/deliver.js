import http from 'http';
import https from 'https';

export async function postJson(url, body, headers={}){
  const u = new URL(url);
  const data = Buffer.from(typeof body === 'string' ? body : JSON.stringify(body));
  const opts = {
    method: 'POST',
    hostname: u.hostname,
    port: u.port || (u.protocol === 'https:' ? 443 : 80),
    path: u.pathname + (u.search||''),
    headers: {
      'content-type': 'application/json',
      'content-length': data.length,
      ...headers
    }
  };
  const mod = u.protocol === 'https:' ? https : http;
  const t0 = Date.now();
  return await new Promise((resolve, reject) => {
    const req = mod.request(opts, res => {
      const chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', () => {
        const ms = Date.now() - t0;
        resolve({ statusCode: res.statusCode, body: Buffer.concat(chunks).toString('utf-8'), ms });
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}
