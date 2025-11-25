// supabase/scripts/decode-secret.js
// Small helpers to safely decode Base64-encoded secrets from environment variables.

function isLikelyBase64(s) {
  if (typeof s !== 'string' || s.length === 0) return false;
  const trimmed = s.trim();

  // Only valid base64 chars + optional padding
  if (!/^[A-Za-z0-9+/=]+$/.test(trimmed)) return false;

  // Normalize padding to validate correctly
  const pad = trimmed.length % 4;
  const normalized = pad === 0 ? trimmed : trimmed + '='.repeat(4 - pad);

  try {
    const buf = Buffer.from(normalized, 'base64');
    const re = buf.toString('base64').replace(/=+$/, '');
    const orig = trimmed.replace(/=+$/, '');
    return re === orig;
  } catch {
    return false;
  }
}

function decodeEnvBase64(name) {
  const raw = process.env[name];
  if (!raw) throw new Error(`Missing environment variable: ${name}`);
  if (!isLikelyBase64(raw)) throw new Error(`Environment variable ${name} is not valid base64`);

  try {
    return Buffer.from(raw, 'base64').toString('utf8');
  } catch (err) {
    throw new Error(`Failed to decode ${name}: ${err.message || err}`);
  }
}

function tryDecodeEnvBase64(name) {
  const raw = process.env[name];
  if (!raw) return null;
  if (!isLikelyBase64(raw)) return null;

  try {
    return Buffer.from(raw, 'base64').toString('utf8');
  } catch {
    return null;
  }
}

export { decodeEnvBase64, tryDecodeEnvBase64 };
