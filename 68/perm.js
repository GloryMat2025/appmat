// Permission middleware backed by Postgres RBAC.
import { permsForUser } from '../lib/rbac_pg.js';

export function requirePerm(perm){
  return async function(req,res,next){
    const user = req.session?.user;
    if (!user) return res.status(401).json({ error:'auth_required' });
    try{
      const perms = await permsForUser(user);
      if (!perms.has(perm)) return res.status(403).json({ error:'forbidden', missing: perm });
      return next();
    } catch (e){
      return res.status(500).json({ error:'rbac_error', message: e.message });
    }
  };
}

// For UIs: attach permissions list to response (not required by routes)
export async function attachPerms(req,res,next){
  res.locals.perms = new Set();
  if (req.session?.user){
    try { res.locals.perms = await permsForUser(req.session.user); } catch {}
  }
  next();
}
