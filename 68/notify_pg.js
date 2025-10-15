import { Router } from 'express';
import { requirePerm } from '../middleware/perm.js';
import { listSubs, addWebhook, addSlack, addEmail, del } from '../lib/notify_pg.js';
import { publish, configEmail } from '../lib/notifier.js';

const r = Router();

r.get('/subs', requirePerm('settings:read'), async (_req,res)=> res.json(await listSubs()));
r.post('/subs/webhook', requirePerm('settings:write'), async (req,res)=>{ const { url, secret='', events=['*'] } = req.body || {}; if (!url) return res.status(400).json({ error:'url_required' }); res.json(await addWebhook({ url, secret, events })); });
r.post('/subs/slack', requirePerm('settings:write'), async (req,res)=>{ const { url, events=['*'] } = req.body || {}; if (!url) return res.status(400).json({ error:'url_required' }); res.json(await addSlack({ url, events })); });
r.post('/subs/email', requirePerm('settings:write'), async (req,res)=>{ const { to, events=['*'] } = req.body || {}; if (!to) return res.status(400).json({ error:'to_required' }); res.json(await addEmail({ to, events })); });
r.delete('/subs/:kind/:id', requirePerm('settings:write'), async (req,res)=>{ await del(req.params.kind, req.params.id); res.json({ ok:true }); });
r.post('/smtp', requirePerm('settings:write'), (req,res)=>{ const ok = configEmail(req.body || {}); res.json({ ok }); });
r.post('/test', requirePerm('settings:write'), async (req,res)=>{ const { event='test.ping', payload={ ok:true } } = req.body || {}; const results = await publish(event, payload); res.json({ event, sent: results.length }); });

export default r;
