import { Router } from 'express';
import { requirePerm } from '../middleware/perm.js';
import { createKey, listKeys, revokeKey, deleteKey } from '../lib/apikeys_pg.js';

const r = Router();

// Admin: list (optionally filter by owner)
r.get('/', requirePerm('users:read'), async (req,res)=>{
  const owner = req.query.owner || null;
  res.json(await listKeys({ owner }));
});

// Self-service: create for current user
r.post('/create', async (req,res)=>{
  const owner = req.session?.user?.email || req.session?.user?.id;
  if (!owner) return res.status(401).json({ error:'auth_required' });
  const { label='', scopes=[], expiresInDays=null } = req.body || {};
  let expiresAt = null;
  if (expiresInDays) {
    const d = new Date(); d.setUTCDate(d.getUTCDate() + Number(expiresInDays));
    expiresAt = d.toISOString();
  }
  const rec = await createKey({ owner, label, scopes, expiresAt });
  // Only time we ever return the full token is at creation time
  res.json(rec);
});

// Admin: revoke/delete
r.post('/:id/revoke', requirePerm('users:write'), async (req,res)=>{ await revokeKey(req.params.id); res.json({ ok:true }); });
r.delete('/:id', requirePerm('users:write'), async (req,res)=>{ await deleteKey(req.params.id); res.json({ ok:true }); });

export default r;
