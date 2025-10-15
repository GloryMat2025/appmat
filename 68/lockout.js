// Account lockout helper for login endpoints.
// Tracks failures per identity (email) + IP. Use exponential backoff locks.
const ACCOUNTS = new Map(); // email -> { fails, lockedUntil }
const IPS = new Map();       // ip    -> { fails, lockedUntil }

function get(map, key){
  let r = map.get(key);
  if (!r) { r = { fails:0, lockedUntil:0 }; map.set(key, r); }
  return r;
}

export const LOCK_CFG = {
  baseThreshold: 5,     // failures before first lock
  windowMinutes: 15,    // failure counter rolling window (not enforced here; for demo keep simple)
  lockMsMin: 5*60*1000, // 5m
  lockMsMax: 24*60*60*1000, // 24h
};

function backoffMs(fails){
  // After baseThreshold: lock duration doubles up to max
  const n = Math.max(0, fails - LOCK_CFG.baseThreshold + 1);
  const ms = LOCK_CFG.lockMsMin * Math.pow(2, Math.min(8, n-1));
  return Math.min(ms, LOCK_CFG.lockMsMax);
}

export function checkLocked(req, res, next){
  const ip = (req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim()) || req.socket?.remoteAddress || '';
  const email = (req.body?.email || '').toLowerCase();
  const a = get(ACCOUNTS, email);
  const i = get(IPS, ip);
  const now = Date.now();
  if (a.lockedUntil && a.lockedUntil > now){
    const secs = Math.ceil((a.lockedUntil - now)/1000);
    return res.status(423).json({ error:'account_locked', retry_after: secs });
  }
  if (i.lockedUntil && i.lockedUntil > now){
    const secs = Math.ceil((i.lockedUntil - now)/1000);
    return res.status(429).json({ error:'ip_locked', retry_after: secs });
  }
  next();
}

export function recordSuccess(req){
  const ip = (req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim()) || req.socket?.remoteAddress || '';
  const email = (req.body?.email || '').toLowerCase();
  const a = get(ACCOUNTS, email); a.fails = 0; a.lockedUntil = 0;
  const i = get(IPS, ip); i.fails = 0; i.lockedUntil = 0;
}

export function recordFailure(req){
  const ip = (req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim()) || req.socket?.remoteAddress || '';
  const email = (req.body?.email || '').toLowerCase();
  const a = get(ACCOUNTS, email);
  const i = get(IPS, ip);
  a.fails++; i.fails++;
  if (a.fails >= LOCK_CFG.baseThreshold){
    a.lockedUntil = Date.now() + backoffMs(a.fails);
  }
  if (i.fails >= LOCK_CFG.baseThreshold + 3){ // IP has a slightly higher threshold
    i.lockedUntil = Date.now() + backoffMs(i.fails-3);
  }
}

export function adminView(){
  const toObj = (map) => Array.from(map.entries()).map(([k,v]) => ({ key:k, fails:v.fails, lockedUntil:v.lockedUntil })).sort((a,b)=> (b.lockedUntil||0)-(a.lockedUntil||0));
  return { accounts: toObj(ACCOUNTS).slice(0,200), ips: toObj(IPS).slice(0,200), cfg: LOCK_CFG };
}

export function adminUnlock(key){
  const a = ACCOUNTS.get(key);
  if (a){ a.fails=0; a.lockedUntil=0; return true; }
  const i = IPS.get(key);
  if (i){ i.fails=0; i.lockedUntil=0; return true; }
  return false;
}

export function adminConfig(patch){
  Object.assign(LOCK_CFG, patch || {});
  return LOCK_CFG;
}
