import { findByToken, touchLastUsed } from '../lib/apikeys_pg.js';

export function authApiKey(requiredScopes = []){
  return async function(req,res,next){
    try{
      const hdr = req.get('authorization') || '';
      const token = hdr.startsWith('Bearer ') ? hdr.slice(7).trim() : (req.query.api_key || req.get('x-api-key') || '').trim();
      if (!token) return res.status(401).json({ error:'api_key_required' });
      const rec = await findByToken(token);
      if (!rec) return res.status(401).json({ error:'invalid_api_key' });
      if (rec.revoked_at) return res.status(401).json({ error:'revoked' });
      if (rec.expires_at && new Date(rec.expires_at) < new Date()) return res.status(401).json({ error:'expired' });

      // scope check (all required scopes must be present)
      const scopes = rec.scopes || [];
      const missing = (requiredScopes||[]).filter(s => !scopes.includes(s));
      if (missing.length) return res.status(403).json({ error:'missing_scopes', missing });

      // Attach to req
      req.apiKey = { id: rec.id, owner: rec.owner, scopes };
      touchLastUsed(rec.id).catch(()=>{});
      return next();
    } catch (e){
      return res.status(500).json({ error:'api_key_auth_error', message:e.message });
    }
  };
}
