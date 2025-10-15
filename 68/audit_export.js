import { Router } from 'express';
import { requirePerm } from '../middleware/perm.js';
import { listAudit } from '../lib/audit_pg.js';

function toCsv(rows){
  const header = ['id','ts','email','role','ip','ua','action','method','path','status','duration_ms','meta'];
  const esc = v => {
    if (v == null) return '';
    const s = typeof v === 'string' ? v : JSON.stringify(v);
    const needs = /[",\n]/.test(s);
    return needs ? '"' + s.replace(/"/g,'""') + '"' : s;
  };
  const lines = [header.join(',')];
  for (const r of rows){
    lines.push([r.id, r.ts, r.email, r.role, r.ip, r.ua, r.action, r.method, r.path, r.status, r.duration_ms, r.meta].map(esc).join(','));
  }
  return lines.join('\n');
}

const r = Router();

r.get('/export.csv', requirePerm('audit:read'), async (req,res)=>{
  const rows = await listAudit({
    q:req.query.q||'', actor:req.query.actor||'', action:req.query.action||'', ip:req.query.ip||'',
    from:req.query.from||null, to:req.query.to||null, limit: Math.min(5000, parseInt(req.query.limit||'2000',10)||2000)
  });
  const csv = toCsv(rows);
  res.setHeader('content-type','text/csv; charset=utf-8');
  res.setHeader('content-disposition', 'attachment; filename="audit_export.csv"');
  res.send(csv);
});

export default r;
