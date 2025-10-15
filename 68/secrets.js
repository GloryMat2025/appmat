import { Router } from 'express';
import { requirePerm } from '../middleware/perm.js';
import { listSecrets, upsertSecret, revealSecret, deleteSecret, listKv, setKv, deleteKv } from '../lib/secrets_pg.js';

const r = Router();

r.get('/', requirePerm('secrets:read'), async (_req,res)=> res.json(await listSecrets()));
r.post('/', requirePerm('secrets:write'), async (req,res)=>{
  const { name, value, meta={} } = req.body || {};
  if (!name || value==null) return res.status(400).json({ error:'name_and_value_required' });
  const rec = await upsertSecret(String(name), String(value), meta, req.user?.email || req.session?.user?.email || 'system');
  res.json(rec);
});
r.post('/:name/reveal', requirePerm('secrets:write'), async (req,res)=>{
  if (!('confirm' in (req.body||{}))) return res.status(400).json({ error:'confirm_required' });
  const pt = await revealSecret(req.params.name);
  if (pt == null) return res.status(404).json({ error:'not_found' });
  res.json({ name: req.params.name, value: pt });
});
r.delete('/:name', requirePerm('secrets:write'), async (req,res)=>{
  await deleteSecret(req.params.name);
  res.json({ ok:true });
});

// KV
r.get('/kv/all', requirePerm('settings:read'), async (_req,res)=> res.json(await listKv()));
r.post('/kv/set', requirePerm('settings:write'), async (req,res)=>{
  const { key, value, is_secret=false } = req.body || {};
  if (!key) return res.status(400).json({ error:'key_required' });
  const rec = await setKv(String(key), value==null?'':String(value), !!is_secret, req.user?.email || req.session?.user?.email || 'system');
  res.json(rec);
});
r.delete('/kv/:key', requirePerm('settings:write'), async (req,res)=>{
  await deleteKv(req.params.key);
  res.json({ ok:true });
});

export default r;
