import { Router } from 'express';
import { requirePerm } from '../middleware/perm.js';
import { listFlags, upsertFlag, deleteFlag } from '../lib/flags_pg.js';
import { evalFlag, evalAll } from '../lib/flagEval.js';

const r = Router();

r.get('/', requirePerm('settings:read'), async (_req,res)=>{
  const flags = await listFlags(); res.json(flags);
});

r.post('/', requirePerm('settings:write'), async (req,res)=>{
  const f = req.body || {}; if (!f.key) return res.status(400).json({ error:'key_required' });
  const rec = await upsertFlag(f, req.user?.email || 'system'); res.json(rec);
});

r.delete('/:key', requirePerm('settings:write'), async (req,res)=>{
  await deleteFlag(req.params.key); res.json({ ok:true });
});

r.get('/eval', async (req,res)=>{
  const { key, env='prod' } = req.query; if (!key) return res.status(400).json({ error:'key_required' });
  const flags = await listFlags();
  const user = { id: req.query.userId || '', email: req.query.email || '' };
  Object.keys(req.query).forEach(k => { if (k.startsWith('attr.')) user[k.slice(5)] = req.query[k]; });
  res.json(evalFlag({ flags }, String(key), String(env), user));
});

r.post('/eval_all', async (req,res)=>{
  const env = req.body?.env || 'prod'; const user = req.body?.user || {};
  const flags = await listFlags(); res.json(evalAll({ flags }, String(env), user));
});

export default r;
