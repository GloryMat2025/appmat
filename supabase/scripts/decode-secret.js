// supabase/scripts/decode-secret.js
// Small helpers to safely decode Base64-encoded secrets from environment variables.
// Exported helpers:
//  - decodeEnvBase64(name): returns decoded string or throws on missing/malformed value
//  - tryDecodeEnvBase64(name): returns decoded string or null on missing/malformed

function isLikelyBase64(s) {
  if (typeof s !== 'string' || s.length === 0) return false;
  const trimmed = s.trim();

  // Only valid base64 chars plus optional padding (=)
  if (!/^[A-Za-z0-9+/=]+$/.test(trimmed)) return false;

  // Length must be multiple of 4 once padded; add padding if needed for validation
  const pad = trimmed.length % 4;
  const normalized = pad === 0 ? trimmed : trimmed + '='.repeat(4 - pad);

  // Try decode/encode roundtrip to verify it's real base64
  try {
    const buf = Buffer.from(normalized, 'base64');
    // Re-encode and compare ignoring trailing '=' padding
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
    const buf = Buffer.from(raw, 'base64');
    return buf.toString('utf8');
  } catch (err) {
    throw new Error(`Failed to decode ${name} as base64: ${err.message || err}`);
  }
}

function tryDecodeEnvBase64(name) {
  const raw = process.env[name];
  if (!raw) return null;
  if (!isLikelyBase64(raw)) return null;
  try {
    const buf = Buffer.from(raw, 'base64');
    return buf.toString('utf8');
  } catch {
    return null;
  }
}

module.exports = {
  decodeEnvBase64,
  tryDecodeEnvBase64,
};
