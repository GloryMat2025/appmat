import { Router } from 'express';
import { requirePerm } from '../middleware/perm.js';
const r = Router();

r.get('/overview', requirePerm('metrics:read'), (req,res)=>{
  const base = 430000;
  const requests = base + Math.floor(Math.random()*base*0.1);
  const errorPct = +(Math.random()*2 + 0.3).toFixed(2);
  const p95 = Math.floor(250 + Math.random()*180);
  const uptime = +(99.5 + Math.random()*0.4).toFixed(3);
  res.json({ requests, errorPct, p95, uptime, reqDelta: +(Math.random()*5-2.5).toFixed(2), errDelta:+(Math.random()*1-0.5).toFixed(2), p95Delta:+(Math.random()*10-5).toFixed(1) });
});

r.get('/timeseries', requirePerm('metrics:read'), (req,res)=>{
  const n = 24;
  const labels = Array.from({length:n}, (_,i)=>i+1);
  const p50 = labels.map(()=> Math.floor(80 + Math.random()*60));
  const p95 = labels.map(()=> Math.floor(220 + Math.random()*180));
  res.json({ labels, p50, p95 });
});

r.get('/endpoints', requirePerm('metrics:read'), (req,res)=>{
  const eps = ['/api/login','/api/orders','/api/orders/:id','/api/settings','/api/backups','/api/metrics'];
  const table = eps.map(ep => ({
    endpoint: ep,
    rps: +(Math.random()*20).toFixed(2),
    errorPct: +(Math.random()*3).toFixed(2),
    p50: Math.floor(80 + Math.random()*70),
    p95: Math.floor(200 + Math.random()*220),
    p99: Math.floor(400 + Math.random()*250),
  }));
  const bars = table.map(t => ({ endpoint:t.endpoint, req: Math.floor(t.rps * 86400) }));
  res.json({ table, bars });
});

export default r;
