import { Router } from 'express';
import { requirePerm } from '../middleware/perm.js';
import { getPolicy, setPolicy, peekQuota } from '../lib/ratelimit.js';

const r = Router();

r.get('/policy', requirePerm('settings:read'), (_req,res)=> res.json(getPolicy()));
r.post('/policy', requirePerm('settings:write'), (req,res)=>{ setPolicy(req.body || {}); res.json(getPolicy()); });
r.get('/quota', requirePerm('settings:read'), async (req,res)=>{
  const id = req.query.id; const scope = req.query.scope || 'key';
  if (!id) return res.status(400).json({ error:'id_required' });
  res.json(await peekQuota({ id, scope }));
});

export default r;
