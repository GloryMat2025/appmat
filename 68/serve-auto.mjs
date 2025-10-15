#!/usr/bin/env node
import { createServer as createHTTPServer } from 'http';
import { createReadStream, statSync, existsSync, readFileSync } from 'fs';
import { extname, join, resolve } from 'path';

// Allow PORT=0 for ephemeral random port selection
const REQ_PORT_RAW = process.env.PORT;
const BASE_PORT = Number(REQ_PORT_RAW === undefined ? 5173 : REQ_PORT_RAW);
const MAX_TRIES = 15;
const HOST_PRIMARY = '127.0.0.1';
const HOST_FALLBACK = '0.0.0.0';
const ROOT = resolve(process.cwd(), 'public');
const INDEX_FILES = ['index.html','offline.html'];

const MIME = {
  '.html':'text/html; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.mjs':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.webmanifest':'application/manifest+json; charset=utf-8',
  '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.svg':'image/svg+xml', '.webp':'image/webp', '.avif':'image/avif',
  '.ico':'image/x-icon', '.txt':'text/plain; charset=utf-8'
};

function tryPort(port){
  return new Promise((resolveAttempt)=>{
    const srv = createHTTPServer(handler);
    let triedFallback = false;
    const cleanupAndFail = ()=>{
      try { srv.close(()=> resolveAttempt(false)); } catch { resolveAttempt(false); }
    };
    function onError(err){
      if(err.code === 'EADDRINUSE'){
        if(!triedFallback){
          triedFallback = true;
          console.warn(`[serve:auto] Port ${port} busy on ${HOST_PRIMARY}, retrying on ${HOST_FALLBACK}…`);
          // Keep the error listener for the fallback attempt
          try { srv.listen(port, HOST_FALLBACK); } catch { cleanupAndFail(); }
          return;
        }
        // Both attempts failed
        return cleanupAndFail();
      }
      console.error('[serve:auto] Server error:', err);
      cleanupAndFail();
    }
    srv.on('error', onError);
    srv.once('listening', ()=>{
      const addr = srv.address();
      console.log(`[serve:auto] Serving ${ROOT} on http://${addr.address}:${addr.port}`);
      process.env.PORT = String(addr.port);
          srv.on('close', ()=> console.warn('[serve:auto] HTTP server close event (port', addr.port, ')'));
      resolveAttempt(srv);
    });
    try { srv.listen(port, HOST_PRIMARY); } catch { cleanupAndFail(); }
  });
}

function safePath(urlPath){
  try {
    const raw = urlPath.split('?')[0];
    const dec = decodeURIComponent(raw);
    // Normalize slashes, remove any '..' segments but keep dots in filenames
    const noBack = dec.replace(/\\/g,'/');
    const segments = noBack.split('/').filter(seg => seg && seg !== '.' && seg !== '..');
    let rebuilt = '/' + segments.join('/');
    if(rebuilt === '/') rebuilt = '/index.html';
    const full = resolve(ROOT, '.' + rebuilt);
    if(!full.startsWith(ROOT)) return null;
    return full;
  } catch {
    return null;
  }
}

function findIndex(){
  for(const f of INDEX_FILES){
    const p = join(ROOT, f); if(existsSync(p)) return p;
  }
  return null;
}

function handler(req, res){
  const url = req.url || '/';
  const originalUrl = url;
  let target = safePath(url === '/' ? '/index.html' : url);
  if(!target || !existsSync(target)){
    if(!extname(url)){
      const idx = findIndex();
      if(idx){
        console.log('[serve:auto] 200', originalUrl, '-> index fallback');
        return streamFile(idx, 'text/html; charset=utf-8', res, 200);
      }
    }
    console.warn('[serve:auto] 404', originalUrl, 'resolved to', target);
    res.writeHead(404, { 'content-type':'text/plain; charset=utf-8', 'cache-control':'no-cache' });
    return res.end('Not Found');
  }
  try {
    if(statSync(target).isDirectory()){
      const idx = join(target, 'index.html');
      if(existsSync(idx)) target = idx; else { console.warn('[serve:auto] 403 directory no index', originalUrl); res.writeHead(403); return res.end('Forbidden'); }
    }
  } catch(e){ console.error('[serve:auto] 500 stat error', e.message); res.writeHead(500); return res.end('Error'); }
  const ext = extname(target).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';
  console.log('[serve:auto] 200', originalUrl, '->', target);
  streamFile(target, mime, res, 200);
}

function streamFile(path, mime, res, code){
  res.writeHead(code, { 'content-type': mime, 'cache-control':'no-cache, no-store, must-revalidate' });
  const rs = createReadStream(path);
  rs.on('error', () => { res.writeHead(500); res.end('Error'); });
  rs.pipe(res);
}

(async function start(){
  // Diagnostics for unexpected exits
  ['exit','beforeExit','uncaughtException','unhandledRejection'].forEach(ev=>{
    process.on(ev, (arg)=>{
      console.warn(`[serve:auto][diag] process event ${ev}`, arg && arg.stack ? arg.stack : arg);
    });
  });

  // Keep the event loop alive (helps detect external forced closes)
  const keepAlive = setInterval(()=>{}, 30000);
  keepAlive.unref?.(); // allow process to still exit if nothing else

  if(BASE_PORT === 0){
    console.log('[serve:auto] Ephemeral port mode (PORT=0) enabled');
    let attempts = 0;
    while(attempts < MAX_TRIES){
      attempts++;
      const startedAt = Date.now();
      const srv = await tryPort(0);
      if(!srv){
        console.warn('[serve:auto] Ephemeral attempt failed', attempts);
        continue;
      }
      const addr = srv.address();
      const chosenPort = addr.port;
      try {
        import('fs').then(fs=>{ fs.writeFileSync('.dev-port', String(chosenPort)); });
      } catch{}
      let closedEarly = true;
      const earlyTimer = setTimeout(()=>{ closedEarly = false; }, 2000);
      srv.on('close', ()=>{
        clearTimeout(earlyTimer);
        if(closedEarly){
          console.warn('[serve:auto] Server closed within 2s, retrying on new ephemeral port...');
          // loop continues
        } else {
          console.warn('[serve:auto] Server closed after running for', Date.now()-startedAt,'ms');
        }
      });
      // Graceful shutdown handlers (re-attach each attempt)
      const shutdown = ()=>{ try { srv.close(()=> process.exit(0)); } catch { process.exit(0); } };
      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
      // Wait for early stability
      await new Promise(r=> setTimeout(r, 2200));
      if(!closedEarly){
        console.log('[serve:auto] Ephemeral server stable on port', chosenPort);
        return; // stay running
      }
      // else try again; loop
    }
    console.error('[serve:auto] Failed to obtain a stable ephemeral port after', MAX_TRIES, 'attempts');
    process.exit(1);
    return;
  }

  let port = BASE_PORT;
  for(let i=0;i<MAX_TRIES;i++){
    const srv = await tryPort(port);
    if(srv){
      const shutdown = ()=>{ try { srv.close(()=> process.exit(0)); } catch { process.exit(0); } };
      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
      try { import('fs').then(fs=> fs.writeFileSync('.dev-port', String(port))); } catch{}
      return;
    }
    port++;
  }
  console.error('[serve:auto] Failed to bind any port after', MAX_TRIES, 'attempts starting at', BASE_PORT);
  console.error('[serve:auto] Hints: check for lingering node/http-server processes, or run `Get-Process -Name node` to list.');
  process.exit(1);
})();
