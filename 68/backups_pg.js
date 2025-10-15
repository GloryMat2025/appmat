import { Router } from 'express';
import { requirePerm } from '../middleware/perm.js';
import { addBackup, listBackups, deleteBackup, addSchedule, listSchedules, setScheduleEnabled, removeSchedule } from '../lib/backups_pg.js';

const r = Router();

r.get('/', requirePerm('backups:read'), async (_req,res)=> res.json(await listBackups()));
r.post('/run', requirePerm('backups:write'), async (req,res)=>{ const b = await addBackup({ type: req.body?.type || 'full' }); res.json({ id: b.id, created: b.created_at }); });
r.delete('/:id', requirePerm('backups:write'), async (req,res)=>{ await deleteBackup(req.params.id); res.json({ ok:true }); });
r.get('/schedules', requirePerm('backups:read'), async (_req,res)=> res.json(await listSchedules()));
r.post('/schedules', requirePerm('backups:write'), async (req,res)=>{ const s = await addSchedule({ everyMinutes: Math.max(5, Math.min(24*60, Number(req.body?.everyMinutes)||60)), type: req.body?.type || 'full' }); res.json(s); });
r.post('/schedules/:id/toggle', requirePerm('backups:write'), async (req,res)=>{ await setScheduleEnabled(req.params.id, !!req.body?.enabled); res.json({ ok:true }); });
r.delete('/schedules/:id', requirePerm('backups:write'), async (req,res)=>{ await removeSchedule(req.params.id); res.json({ ok:true }); });

export default r;
