// src/utils/sign.js
// Simple client-side HMAC signing (demo). For production, put signing server-side.

const APP_SECRET = "myapp-local-demo-secret-v1"; // replace if you like

function base64urlEncode(bytes) {
  const bin = Array.from(new Uint8Array(bytes), b => String.fromCharCode(b)).join("");
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/,"");
}
function base64urlDecode(str) {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
  const bin = atob(b64 + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

async function importKey(secret = APP_SECRET) {
  const enc = new TextEncoder().encode(secret);
  return crypto.subtle.importKey("raw", enc, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

/** Returns "<payload_b64url>.<sig_b64url>" */
export async function signSharePayload(obj, secret = APP_SECRET) {
  const json = JSON.stringify(obj);
  const payloadB64 = base64urlEncode(new TextEncoder().encode(encodeURIComponent(json)));
  const key = await importKey(secret);
  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  const sigB64 = base64urlEncode(sigBuf);
  return `${payloadB64}.${sigB64}`;
}

/** Verify & decode; supports old unsigned tokens (single segment) for backward compatibility */
export async function verifyAndDecodeShareToken(token, secret = APP_SECRET) {
  if (!token) return { ok: false, reason: "Missing token" };
  const parts = token.split(".");
  if (parts.length === 1) {
    // Legacy (unsigned) token: decode only
    try {
      const buf = base64urlDecode(parts[0]);
      const json = decodeURIComponent(new TextDecoder().decode(new Uint8Array(buf)));
      return { ok: true, payload: JSON.parse(json), legacy: true, verified: false };
    } catch {
      return { ok: false, reason: "Invalid legacy token" };
    }
  }
  if (parts.length !== 2) return { ok: false, reason: "Malformed token" };
  const [payloadB64, sigB64] = parts;
  try {
    const key = await importKey(secret);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64urlDecode(sigB64),
      new TextEncoder().encode(payloadB64)
    );
    if (!valid) return { ok: false, reason: "Signature invalid" };
    const buf = base64urlDecode(payloadB64);
    const json = decodeURIComponent(new TextDecoder().decode(new Uint8Array(buf)));
    return { ok: true, payload: JSON.parse(json), verified: true, legacy: false };
  } catch {
    return { ok: false, reason: "Token decode error" };
  }
}
