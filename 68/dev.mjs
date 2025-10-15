#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

function run(cmd, args, name, opts={}){
  console.log(`[dev] Spawning ${name}:`, cmd, args.join(' '));
  const child = spawn(cmd, args, { stdio:'inherit', shell:false, ...opts });
  child.on('exit', (code, signal)=>{
    console.warn(`[dev] Process ${name} exit event code=${code} signal=${signal}`);
    onChildExit(name, code, signal);
  });
  child.on('close', (code, signal)=>{
    console.warn(`[dev] Process ${name} close event code=${code} signal=${signal}`);
  });
  child.on('error', (err)=>{
    console.error(`[dev] Failed to start ${name}:`, err.message);
    if(name === 'tailwind') console.error('[dev] Hint: ensure devDependencies installed (run `npm install`).');
  });
  return child;
}

let serverRestartAttempts = 0;
const MAX_SERVER_RESTARTS = 5;

function onChildExit(name, code, signal){
  if(closing) return; // ignore during shutdown
  if(name === 'server'){
    // Treat any non-intentional exit as crash & attempt restart if tailwind still alive
    const tailwindAlive = children.find(c=>c.__name==='tailwind' && !c.killed && c.exitCode == null);
    if(tailwindAlive && serverRestartAttempts < MAX_SERVER_RESTARTS){
      serverRestartAttempts++;
      const delay = 500 * serverRestartAttempts;
      console.warn(`[dev] Server exited (code=${code}, signal=${signal}). Restart attempt ${serverRestartAttempts} in ${delay}ms…`);
      setTimeout(()=> startServer(), delay);
      return;
    }
    if(serverRestartAttempts >= MAX_SERVER_RESTARTS){
      console.error('[dev] Max server restart attempts reached. Shutting down.');
      return shutdown(code||1);
    }
  } else if(name === 'tailwind') {
    console.error('[dev] Tailwind watcher exited – shutting down dev environment.');
    return shutdown(code||1);
  }
}

let closing = false;
const children = [];
function shutdown(code=0){
  if(closing) return; closing = true;
  console.log('[dev] Shutting down...');
  children.forEach(c=>{ try { if(!c.killed) c.kill('SIGINT'); } catch{} });
  setTimeout(()=> process.exit(code), 500);
}
process.on('SIGINT', ()=> shutdown(0));
process.on('SIGTERM', ()=> shutdown(0));

// Directly invoke Tailwind CLI JS via Node to avoid shell path/space issues
const tailwindCLI = resolve(__dirname,'..','node_modules','tailwindcss','lib','cli.js');
if(!existsSync(tailwindCLI)){
  console.error('[dev] Tailwind CLI not found at', tailwindCLI);
  console.error('[dev] Run `npm install` to install dependencies.');
  shutdown(1);
}
const tailwindArgs = [tailwindCLI,'-i','./src/styles.css','-o','./public/assets/tailwind.css','--watch'];
if(process.env.TAILWIND_VERBOSE) tailwindArgs.push('--verbose');
const tw = run(process.execPath, tailwindArgs, 'tailwind');
tw.__name = 'tailwind';
children.push(tw);

function startServer(){
  const srv = run(process.execPath, [resolve(__dirname,'serve-auto.mjs')], 'server');
  srv.__name = 'server';
  children.push(srv);
}
startServer();
