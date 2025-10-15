import { Router } from 'express';
import { AUDIT_STORE } from '../middleware/audit.js';
import { requirePerm } from '../middleware/perm.js';

const r = Router();

// List with filters: ?q=&actor=&action=&ip=&from=ISO&to=ISO&limit=100&cursor=ID
r.get('/', requirePerm('audit:read'), (req, res) => {
  const { q='', actor='', action='', ip='', from='', to='', limit='100', cursor='' } = req.query;
  const lim = Math.max(1, Math.min(parseInt(limit, 10) || 100, 1000));
  const rows = AUDIT_STORE.rows.slice().reverse(); // newest first

  // cursor-based pagination: skip until cursor id encountered
  let startIdx = 0;
  if (cursor) {
    const idx = rows.findIndex(x => x.id === cursor);
    if (idx >= 0) startIdx = idx + 1;
  }

  const fromTs = from ? Date.parse(from) : null;
  const toTs   = to   ? Date.parse(to)   : null;

  const out = [];
  for (let i = startIdx; i < rows.length && out.length < lim; i++){
    const r0 = rows[i];
    if (q && !JSON.stringify(r0).toLowerCase().includes(String(q).toLowerCase())) continue;
    if (actor && r0.email !== actor && r0.userId !== actor) continue;
    if (action && !(r0.action||'').toLowerCase().includes(String(action).toLowerCase())) continue;
    if (ip && r0.ip !== ip) continue;
    const t = Date.parse(r0.ts);
    if (fromTs && t < fromTs) continue;
    if (toTs && t > toTs) continue;
    out.push(r0);
  }

  const nextCursor = out.length ? out[out.length-1].id : null;
  res.json({ rows: out, nextCursor });
});

// Summaries for UI widgets
r.get('/summary', requirePerm('audit:read'), (_req, res) => {
  const rows = AUDIT_STORE.rows;
  const count = rows.length;
  const byAction = {};
  const byRole = {};
  let errors = 0;
  for (const r0 of rows.slice(-10000)){ // sample
    byAction[r0.action] = (byAction[r0.action] || 0) + 1;
    byRole[r0.role || 'unknown'] = (byRole[r0.role || 'unknown'] || 0) + 1;
    if ((r0.status||0) >= 400) errors++;
  }
  res.json({ count, errors, byAction, byRole });
});

// Endpoint to inject a synthetic audit entry (for testing)
r.post('/_inject', requirePerm('audit:read'), (req, res) => {
  const e = req.body || {};
  if (!e.action) e.action = 'test:inject';
  AUDIT_STORE.rows.push({
    id: Math.random().toString(16).slice(2, 10),
    ts: new Date().toISOString(),
    userId: e.userId || null,
    email: e.email || null,
    role: e.role || null,
    ip: e.ip || '127.0.0.1',
    ua: e.ua || 'tester',
    action: e.action,
    method: e.method || 'POST',
    path: e.path || '/api/audit/_inject',
    status: e.status || 200,
    durationMs: e.durationMs || 5,
    meta: e.meta || {}
  });
  res.json({ ok: true });
});

export default r;
