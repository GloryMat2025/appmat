import { Router } from 'express';
import { requirePerm } from '../middleware/perm.js';
import { nanoid } from 'nanoid';
import { publish } from '../lib/notifier.js';
const r = Router();

let BACKUPS = [];

r.get('/', requirePerm('backups:read'), (_req,res)=>{
  res.json(BACKUPS.slice().reverse());
});

r.post('/run', requirePerm('backups:write'), async (req,res)=>{
  const type = req.body?.type || 'full';
  const id = 'bkp_'+nanoid(8);
  const createdAt = new Date().toISOString();
  const sizeBytes = type === 'data' ? 250*1024*1024 : 2*1024*1024*1024; // demo
  const item = { id, created: createdAt, type, sizeBytes, checksum: 'sha256:'+nanoid(8) };
  BACKUPS.push(item);
  await publish('backup.completed', { id, createdAt });
  res.json({ id });
});

r.post('/restore', requirePerm('backups:write'), (req,res)=>{
  const { id } = req.body || {};
  if (!BACKUPS.some(b=>b.id===id)) return res.status(404).json({ error:'not_found' });
  res.json({ ok: true });
});

r.delete('/:id', requirePerm('backups:write'), (req,res)=>{
  const { id } = req.params;
  BACKUPS = BACKUPS.filter(b=>b.id!==id);
  res.json({ ok: true });
});

export default r;
