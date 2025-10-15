-- Secrets & App KV schema

CREATE TABLE IF NOT EXISTS app_secrets (
  name        TEXT PRIMARY KEY,
  version     INTEGER NOT NULL DEFAULT 1,
  cipher      BYTEA NOT NULL,     -- ciphertext (data encrypted with data_key) (ct||tag)
  iv          BYTEA NOT NULL,     -- iv for data cipher (12 bytes)
  wrapped_key BYTEA NOT NULL,     -- data_key wrapped by master key (ct||tag)
  wrap_iv     BYTEA NOT NULL,     -- iv for wrapping (12 bytes)
  algo        TEXT NOT NULL DEFAULT 'aes-256-gcm',
  meta        JSONB DEFAULT '{}'::jsonb,
  updated_by  TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_kv (
  key         TEXT PRIMARY KEY,
  value       TEXT,
  is_secret   BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by  TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
