// Deterministic percentage rollout + simple targeting evaluation.
import crypto from 'crypto';

export function hashToPct(key, userId){
  const h = crypto.createHash('sha1').update(String(key)+'|'+String(userId)).digest('hex').slice(0,8);
  const n = parseInt(h,16) / 0xffffffff; // 0..1
  return Math.floor(n*100); // 0..99
}

export function getFlag(policy, key){
  return (policy.flags || []).find(f => f.key === key) || null;
}

export function evalFlag(policy, key, env, user){
  const f = getFlag(policy, key);
  if (!f) return { key, on:false, reason:'missing_flag' };
  const cfg = (f.env || {})[env] || (f.env || {}).prod || { on:false, pct:0, allow:[], block:[], attrs:{} };
  if (!cfg.on) return { key, on:false, reason:'off' };

  const uid = user?.id || user?.userId || user?.email || '';
  if (uid && (cfg.block||[]).includes(uid)) return { key, on:false, reason:'blocked' };
  if (uid && (cfg.allow||[]).includes(uid)) return { key, on:true,  reason:'allowlist' };

  if (cfg.attrs && user && typeof user === 'object'){
    for (const [k, arr] of Object.entries(cfg.attrs)){
      if (!arr || !arr.length) continue;
      const v = user[k];
      if (v == null) return { key, on:false, reason:'attr_missing:'+k };
      const values = Array.isArray(v) ? v : [v];
      const ok = values.some(x => arr.includes(String(x)));
      if (!ok) return { key, on:false, reason:'attr_mismatch:'+k };
    }
  }

  const pct = Number(cfg.pct || 0);
  if (pct >= 100) return { key, on:true, reason:'pct=100' };
  if (!uid) return { key, on:false, reason:'no_user_for_pct' };
  const bucket = hashToPct(key, uid);
  return { key, on: bucket < pct, bucket, pct, reason: 'pct_rollout' };
}

export function evalAll(policy, env, user){
  const out = {};
  for (const f of (policy.flags || [])){
    out[f.key] = evalFlag(policy, f.key, env, user).on;
  }
  return out;
}
