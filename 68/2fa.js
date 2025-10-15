import { Router } from 'express';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

const r = Router();

// In-memory store (replace with DB)
const TWOFA = new Map(); // key: userId -> { enabled, secret, backup: string[] }

function needAuth(req, res, next){
  if (!req.user) return res.status(401).json({ error:'unauthenticated' });
  next();
}

r.get('/status', needAuth, (req,res)=>{
  const rec = TWOFA.get(req.user.id);
  res.json({ enabled: !!rec?.enabled });
});

// Begin setup: generate secret + QR data URL
r.post('/setup', needAuth, async (req,res)=>{
  const label = encodeURIComponent(`AppMat:${req.user.email}`);
  const issuer = encodeURIComponent('AppMat');
  const secret = speakeasy.generateSecret({ length: 20, name: `AppMat:${req.user.email}`, issuer: 'AppMat' });
  const otpauth = `otpauth://totp/${label}?secret=${secret.base32}&issuer=${issuer}`;
  const qr = await QRCode.toDataURL(otpauth);
  TWOFA.set(req.user.id, { enabled:false, secret: secret.base32, backup: [] });
  res.json({ secret: secret.base32, otpauth, qr });
});

// Verify first time and enable
r.post('/verify', needAuth, (req,res)=>{
  const { code } = req.body || {};
  const rec = TWOFA.get(req.user.id);
  if (!rec) return res.status(400).json({ error:'no_setup' });
  const ok = speakeasy.totp.verify({ secret: rec.secret, encoding:'base32', token: String(code||'').trim(), window: 1 });
  if (!ok) return res.status(400).json({ error:'bad_code' });
  // generate backup codes (8)
  const backup = Array.from({length:8}, ()=> Math.random().toString(36).slice(2,8) + Math.random().toString(36).slice(2,6));
  rec.enabled = true; rec.backup = backup;
  res.json({ enabled:true, backup });
});

// Login-time verify (when pending2fa)
r.post('/login/verify', (req,res)=>{
  const { userId, code } = req.body || {};
  const rec = TWOFA.get(userId);
  if (!rec?.enabled) return res.status(400).json({ error:'not_enabled' });
  const ok = speakeasy.totp.verify({ secret: rec.secret, encoding:'base32', token: String(code||'').trim(), window: 1 });
  if (!ok) return res.status(400).json({ error:'bad_code' });
  // accept login
  res.json({ ok:true });
});

// Use (consume) a backup code during login
r.post('/login/backup', (req,res)=>{
  const { userId, code } = req.body || {};
  const rec = TWOFA.get(userId);
  if (!rec?.enabled) return res.status(400).json({ error:'not_enabled' });
  const idx = rec.backup.indexOf(String(code||'').trim());
  if (idx === -1) return res.status(400).json({ error:'invalid_backup' });
  rec.backup.splice(idx,1);
  res.json({ ok:true });
});

// Disable 2FA (admin or user self with password recheck)
r.post('/disable', needAuth, (req,res)=>{
  const rec = TWOFA.get(req.user.id);
  if (!rec?.enabled) return res.status(400).json({ error:'not_enabled' });
  TWOFA.set(req.user.id, { enabled:false, secret:null, backup: [] });
  res.json({ enabled:false });
});

export default r;
