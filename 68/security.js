import { Router } from 'express';
import { requirePerm } from '../middleware/perm.js';
import { rateLimit, _dumpBuckets } from '../middleware/rateLimit.js';
import { checkLocked, recordSuccess, recordFailure, adminView, adminUnlock, adminConfig } from '../middleware/lockout.js';

const r = Router();

r.post('/login-demo',
  rateLimit({ windowMs: 60_000, max: 20, key: req => 'login:'+req.ip }),
  checkLocked,
  (req, res) => {
    const { email, password } = req.body || {};
    const ok = email && password && password === 'correct-password';
    if (ok){
      recordSuccess(req);
      return res.json({ ok:true });
    } else {
      recordFailure(req);
      return res.status(401).json({ error:'invalid_credentials' });
    }
  }
);

r.get('/status', requirePerm('users:admin'), (_req,res)=>{
  res.json({ rate: _dumpBuckets(), lockout: adminView() });
});

r.post('/unlock', requirePerm('users:admin'), (req,res)=>{
  const { key } = req.body || {};
  const ok = adminUnlock(String(key||''));
  res.json({ ok });
});

r.post('/config', requirePerm('users:admin'), (req,res)=>{
  const cfg = adminConfig(req.body || {});
  res.json({ cfg });
});

export default r;
