import { Router } from 'express';
import { requirePerm } from '../middleware/perm.js';
import { addBackup, listBackups, findBackup, deleteBackup, addSchedule, listSchedules, setScheduleEnabled, removeSchedule, signUrl, verifySig } from '../lib/backupsStore.js';

const r = Router();

r.get('/', requirePerm('backups:read'), (_req,res)=> res.json(listBackups()));

r.post('/run', requirePerm('backups:write'), (req,res)=>{
  const type = req.body?.type || 'full';
  const b = addBackup({ type });
  res.json({ id: b.id, created: b.created });
});

r.delete('/:id', requirePerm('backups:write'), (req,res)=>{
  const ok = deleteBackup(req.params.id);
  res.json({ ok });
});

r.post('/download/:id', requirePerm('backups:read'), (req,res)=>{
  const id = req.params.id;
  const item = findBackup(id);
  if (!item) return res.status(404).json({ error:'not_found' });
  const ttl = Math.max(60, Math.min(3600, Number(req.body?.ttlSec) || 300));
  const base = process.env.OAUTH_REDIRECT_BASE || (req.protocol + '://' + req.get('host'));
  const url = signUrl(base, id, process.env.SESSION_SECRET, ttl);
  res.json({ url, expires_in: ttl });
});

r.get('/download/:id', requirePerm('backups:read'), (req,res)=>{
  const { id } = req.params;
  const { exp, sig } = req.query;
  if (!verifySig(id, exp, sig, process.env.SESSION_SECRET)) return res.status(403).send('bad_signature_or_expired');
  const b = findBackup(id);
  if (!b) return res.status(404).send('not_found');
  res.set('Content-Disposition', `attachment; filename="${id}.txt"`);
  res.type('text/plain').send(`Demo backup ${id} created ${b.created} type=${b.type} size=${b.sizeBytes}`);
});

r.get('/schedules', requirePerm('backups:read'), (_req,res)=> res.json(listSchedules()));
r.post('/schedules', requirePerm('backups:write'), (req,res)=>{
  const everyMinutes = Math.max(5, Math.min(24*60, Number(req.body?.everyMinutes) || 60));
  const type = req.body?.type || 'full';
  const s = addSchedule({ everyMinutes, type });
  res.json(s);
});
r.post('/schedules/:id/toggle', requirePerm('backups:write'), (req,res)=>{
  const ok = setScheduleEnabled(req.params.id, !!req.body?.enabled);
  res.json({ ok });
});
r.delete('/schedules/:id', requirePerm('backups:write'), (req,res)=>{
  const ok = removeSchedule(req.params.id);
  res.json({ ok });
});

export default r;
