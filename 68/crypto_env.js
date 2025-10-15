// Envelope encryption using a master key from env.
// Uses AES-256-GCM for both data encryption and key wrapping.

import crypto from 'crypto';

function rand(n){ return crypto.randomBytes(n); }

function getLocalMasterKey(){
  const b64 = process.env.SECRET_MASTER_KEY || '';
  if (!b64) throw new Error('SECRET_MASTER_KEY is required for local secrets');
  const key = Buffer.from(b64, 'base64');
  if (key.length !== 32) throw new Error('SECRET_MASTER_KEY must be 32 bytes base64');
  return key;
}

export function aesGcmEncrypt(key, plaintext, aad=undefined){
  const iv = rand(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  if (aad) cipher.setAAD(Buffer.isBuffer(aad) ? aad : Buffer.from(String(aad)));
  const enc = Buffer.concat([cipher.update(Buffer.isBuffer(plaintext)?plaintext:Buffer.from(String(plaintext))), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { iv, ct: Buffer.concat([enc, tag]) };
}
export function aesGcmDecrypt(key, iv, ctAndTag, aad=undefined){
  const ct = ctAndTag.slice(0, -16);
  const tag = ctAndTag.slice(-16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  if (aad) decipher.setAAD(Buffer.isBuffer(aad) ? aad : Buffer.from(String(aad)));
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(ct), decipher.final()]);
  return dec;
}

export function wrapDataKey(dataKey){
  const master = getLocalMasterKey();
  const { iv, ct } = aesGcmEncrypt(master, dataKey);
  return { wrap_iv: iv, wrapped_key: ct };
}
export function unwrapDataKey(wrap_iv, wrapped_key){
  const master = getLocalMasterKey();
  return aesGcmDecrypt(master, wrap_iv, wrapped_key);
}

export function encryptSecret(plaintext){
  const dataKey = rand(32);
  const { iv, ct } = aesGcmEncrypt(dataKey, plaintext);
  const { wrap_iv, wrapped_key } = wrapDataKey(dataKey);
  return { iv, ct, wrap_iv, wrapped_key, algo: 'aes-256-gcm' };
}

export function decryptSecret(iv, ct, wrap_iv, wrapped_key){
  const dataKey = unwrapDataKey(wrap_iv, wrapped_key);
  const pt = aesGcmDecrypt(dataKey, iv, ct);
  return pt;
}
