import { Router } from 'express';
import { requirePerm } from '../middleware/perm.js';
import { writeAudit, listAudit, auditSummary } from '../lib/audit_pg.js';

const r = Router();

r.get('/', requirePerm('audit:read'), async (req,res)=>{
  const rows = await listAudit({
    q:req.query.q||'', actor:req.query.actor||'', action:req.query.action||'', ip:req.query.ip||'',
    from:req.query.from||null, to:req.query.to||null, limit: Math.max(1, Math.min(parseInt(req.query.limit||'100',10), 1000)),
    cursor:req.query.cursor||null
  });
  const nextCursor = rows.length ? rows[rows.length-1].id : null;
  res.json({ rows, nextCursor });
});

r.get('/summary', requirePerm('audit:read'), async (_req,res)=> res.json(await auditSummary()));

r.post('/_write', requirePerm('audit:read'), async (req,res)=>{
  await writeAudit(req.body||{}); res.json({ ok:true });
});

export default r;
