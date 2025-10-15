import { Router } from 'express';
import { requirePerm } from '../middleware/perm.js';
import { query } from '../lib/db.js';
import { processOne } from '../lib/queue.js';

const r = Router();

// List inbound
r.get('/in', requirePerm('audit:read'), async (req,res)=>{
  const { source='', q='', limit='100', cursor=null } = req.query;
  const cond = []; const args = [];
  if (source){ args.push(source); cond.push(`source=$${args.length}`); }
  if (q){ args.push('%'+q.toLowerCase()+'%'); cond.push(`LOWER(CAST(json_body AS TEXT) || ' ' || CAST(headers AS TEXT)) LIKE $${args.length}`); }
  if (cursor){ args.push(cursor); cond.push(`received_at < (SELECT received_at FROM webhooks_in WHERE id::text=$${args.length})`); }
  const where = cond.length ? ('WHERE ' + cond.join(' AND ')) : '';
  args.push(Math.max(1, Math.min(parseInt(limit,10)||100, 1000)));
  const rows = (await query(`SELECT id, source, received_at, ip, sig_ok, sig_detail, json_body FROM webhooks_in ${where} ORDER BY received_at DESC LIMIT $${args.length}`, args)).rows;
  const nextCursor = rows.length ? rows[rows.length-1].id : null;
  res.json({ rows, nextCursor });
});

// Create a delivery job for an inbound event
r.post('/deliver', requirePerm('settings:write'), async (req,res)=>{
  const { in_id, target_url } = req.body || {};
  if (!in_id || !target_url) return res.status(400).json({ error:'in_id_and_target_url_required' });
  const r1 = await query('INSERT INTO webhook_deliveries(in_id, target_url, status, next_at) VALUES ($1,$2,$3, now()) RETURNING id', [in_id, target_url, 'queued']);
  res.json({ id: r1.rows[0].id });
});

// List deliveries
r.get('/deliveries', requirePerm('audit:read'), async (req,res)=>{
  const { in_id=null, status='', limit='100', cursor=null } = req.query;
  const cond=[]; const args=[];
  if (in_id){ args.push(in_id); cond.push(`in_id=$${args.length}`); }
  if (status){ args.push(status); cond.push(`status=$${args.length}`); }
  if (cursor){ args.push(cursor); cond.push(`created_at < (SELECT created_at FROM webhook_deliveries WHERE id::text=$${args.length})`); }
  const where = cond.length ? ('WHERE ' + cond.join(' AND ')) : '';
  args.push(Math.max(1, Math.min(parseInt(limit,10)||100, 1000)));
  const rows = (await query(`SELECT id, in_id, target_url, status, attempts, next_at, response_status, response_ms, last_error FROM webhook_deliveries ${where} ORDER BY created_at DESC LIMIT $${args.length}`, args)).rows;
  const nextCursor = rows.length ? rows[rows.length-1].id : null;
  res.json({ rows, nextCursor });
});

// Manually process one due job (hook this to a cron)
r.post('/process_once', requirePerm('settings:write'), async (_req,res)=>{
  const result = await processOne();
  res.json(result);
});

export default r;
