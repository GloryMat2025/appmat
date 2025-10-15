#!/usr/bin/env node
/**
 * synthetic-validate.js
 * Run slot-validation matrix headlessly from Node.
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 \
 *   TENANT=mybrand \
 *   START_ISO=2025-10-12T16:00:00 \
 *   OUTLETS=damansara,puchong \
 *   MODES=pickup,delivery \
 *   SKUSETS="SKU-CAKE-6IN,SKU-BURGER;SKU-CATER-SET-A" \
 *   node server/tools/synthetic-validate.js
 *
 * Optional:
 *   AUTH_COOKIE="sid=..."   (sent as Cookie header)
 *   DURATION=30
 */
import fs from 'fs';
import path from 'path';
import process from 'process';
import fetch from 'node-fetch';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TENANT = process.env.TENANT || '';
const AUTH_COOKIE = process.env.AUTH_COOKIE || '';
const START_ISO = process.env.START_ISO || '';
const OUTLETS = (process.env.OUTLETS||'').split(',').map(s=>s.trim()).filter(Boolean);
const MODES = (process.env.MODES||'pickup').split(',').map(s=>s.trim()).filter(Boolean);
const SKUSETS = (process.env.SKUSETS||'').split(';').map(g=>g.trim()).filter(Boolean).map(g=>g.split(',').map(s=>s.trim()).filter(Boolean));
const DURATION = parseInt(process.env.DURATION || '30', 10);

if (!START_ISO || OUTLETS.length===0 || SKUSETS.length===0){
  console.error('Missing required inputs: START_ISO, OUTLETS, SKUSETS');
  process.exit(2);
}

function hdrs(){
  const h = { 'Content-Type': 'application/json' };
  if (TENANT) h['X-Tenant-ID'] = TENANT;
  if (AUTH_COOKIE) h['Cookie'] = AUTH_COOKIE;
  return h;
}

async function getSkuMap(){
  const r = await fetch(`${BASE_URL}/config/sku-categories.json`, { headers: hdrs() });
  if (!r.ok) return { map:{} };
  return r.json();
}

function catsForSkus(cfg){
  const globalMap = cfg.map || {};
  return (skus)=>{
    const set = new Set();
    for (const s of skus){
      const c = globalMap[s];
      if (c) set.add(String(c));
    }
    return Array.from(set);
  };
}

(async ()=>{
  const cfg = await getSkuMap();
  const results = [];
  for (const outlet of OUTLETS){
    const catsFn = catsForSkus(cfg);
    for (const mode of MODES){
      for (const skus of SKUSETS){
        const cats = catsFn(skus);
        const body = { outletId: outlet, mode, startISO: START_ISO, durationMinutes: DURATION, categories: cats };
        const r = await fetch(`${BASE_URL}/api/validate-slot`, { method:'POST', headers: hdrs(), body: JSON.stringify(body) });
        let j = {}; try{ j = await r.json(); }catch{ j = {}; }
        results.push({ outlet, mode, startISO: START_ISO, duration: DURATION, skus: skus.join('|'), cats: cats.join('|'), ok: !!j.ok, status: r.status, error: j.error||'' });
        console.log(`${outlet},${mode},${START_ISO},${DURATION},${skus.join('|')},${cats.join('|')},${j.ok?'OK':'FAIL'},${r.status},${j.error||''}`);
      }
    }
  }
  const header = 'outlet,mode,startISO,duration,skus,categories,ok,status,error\n';
  const csv = header + results.map(r => [r.outlet,r.mode,r.startISO,r.duration,r.skus,r.cats,r.ok,r.status,JSON.stringify(r.error||'')].join(',')).join('\n');
  fs.writeFileSync(path.resolve('synthetic-slot-tests.csv'), csv);
  console.log('Wrote synthetic-slot-tests.csv');
})().catch(e=>{ console.error('Synthetic test failed', e); process.exit(1); });
