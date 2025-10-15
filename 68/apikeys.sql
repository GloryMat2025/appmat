-- API keys / Personal Access Tokens
CREATE TABLE IF NOT EXISTS api_keys (
  id           TEXT PRIMARY KEY,           -- short id (prefix of token)
  hash         TEXT NOT NULL,              -- SHA-256(token) hex
  owner        TEXT NOT NULL,              -- email or user id
  label        TEXT,                       -- human label
  scopes       TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ,
  revoked_at   TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  meta         JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_apikeys_owner ON api_keys(owner);
CREATE INDEX IF NOT EXISTS idx_apikeys_expires ON api_keys(expires_at);
