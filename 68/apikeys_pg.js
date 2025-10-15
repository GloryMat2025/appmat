import { query } from './db.js';
import crypto from 'crypto';

function sha256hex(s){ return crypto.createHash('sha256').update(s).digest('hex'); }
function newId(){ return Math.random().toString(36).slice(2,10); }

export function tokenToId(token){
  // Expect "ak_<id>_<secret>"
  const parts = String(token||'').split('_');
  return parts.length >= 3 ? parts[1] : null;
}

export async function createKey({ owner, label='', scopes=[], expiresAt=null }){
  const id = newId();
  const secret = crypto.randomBytes(24).toString('base64url');
  const token = `ak_${id}_${secret}`;
  const hash = sha256hex(token);
  await query(`INSERT INTO api_keys(id, hash, owner, label, scopes, expires_at) VALUES ($1,$2,$3,$4,$5,$6)`,
    [id, hash, owner, label, scopes, expiresAt]);
  return { id, token, owner, label, scopes, expiresAt };
}

export async function listKeys({ owner=null }){
  const r = owner ? await query('SELECT * FROM api_keys WHERE owner=$1 ORDER BY created_at DESC', [owner])
                  : await query('SELECT * FROM api_keys ORDER BY created_at DESC');
  return r.rows;
}

export async function revokeKey(id){
  await query('UPDATE api_keys SET revoked_at=now() WHERE id=$1 AND revoked_at IS NULL', [id]);
  return true;
}

export async function deleteKey(id){
  await query('DELETE FROM api_keys WHERE id=$1', [id]);
  return true;
}

export async function touchLastUsed(id){
  await query('UPDATE api_keys SET last_used_at=now() WHERE id=$1', [id]);
}

export async function findByToken(token){
  const id = tokenToId(token);
  if (!id) return null;
  const hash = sha256hex(token);
  const r = await query('SELECT * FROM api_keys WHERE id=$1 AND hash=$2', [id, hash]);
  return r.rows[0] || null;
}
