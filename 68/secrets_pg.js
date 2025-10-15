import { query } from './db.js';
import { encryptSecret, decryptSecret } from './crypto_env.js';

export async function listSecrets(){
  const r = await query('SELECT name, version, algo, meta, updated_by, updated_at, created_at FROM app_secrets ORDER BY name');
  return r.rows;
}

export async function upsertSecret(name, plaintext, meta={}, updatedBy=null){
  const { iv, ct, wrap_iv, wrapped_key, algo } = encryptSecret(plaintext);
  const r = await query(`INSERT INTO app_secrets(name, version, cipher, iv, wrapped_key, wrap_iv, algo, meta, updated_by)
                         VALUES ($1, 1, $2, $3, $4, $5, $6, $7, $8)
                         ON CONFLICT (name) DO UPDATE SET
                           version = app_secrets.version + 1,
                           cipher = EXCLUDED.cipher,
                           iv = EXCLUDED.iv,
                           wrapped_key = EXCLUDED.wrapped_key,
                           wrap_iv = EXCLUDED.wrap_iv,
                           algo = EXCLUDED.algo,
                           meta = EXCLUDED.meta,
                           updated_by = EXCLUDED.updated_by,
                           updated_at = now()
                         RETURNING name, version, algo, meta, updated_by, updated_at`, [name, ct, iv, wrapped_key, wrap_iv, algo, meta, updatedBy]);
  return r.rows[0];
}

export async function revealSecret(name){
  const r = await query('SELECT cipher, iv, wrapped_key, wrap_iv FROM app_secrets WHERE name=$1', [name]);
  if (!r.rows.length) return null;
  const row = r.rows[0];
  const pt = decryptSecret(row.iv, row.cipher, row.wrap_iv, row.wrapped_key);
  return pt.toString('utf-8');
}

export async function deleteSecret(name){
  await query('DELETE FROM app_secrets WHERE name=$1', [name]);
  return true;
}

// App KV
export async function listKv(){
  const r = await query('SELECT key, value, is_secret, updated_by, updated_at FROM app_kv ORDER BY key');
  return r.rows;
}
export async function setKv(key, value, is_secret=false, updatedBy=null){
  const r = await query(`INSERT INTO app_kv(key,value,is_secret,updated_by) VALUES ($1,$2,$3,$4)
                         ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, is_secret=EXCLUDED.is_secret, updated_by=EXCLUDED.updated_by, updated_at=now()
                         RETURNING key, value, is_secret, updated_by, updated_at`, [key, value, !!is_secret, updatedBy]);
  return r.rows[0];
}
export async function deleteKv(key){
  await query('DELETE FROM app_kv WHERE key=$1', [key]);
  return true;
}
