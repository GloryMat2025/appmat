-- AppMat Postgres schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS app_users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  name          TEXT,
  role          TEXT DEFAULT 'staff',
  attrs         JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_sessions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES app_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  data       JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON app_sessions(user_id);

CREATE TABLE IF NOT EXISTS feature_flags (
  key         TEXT PRIMARY KEY,
  note        TEXT,
  env_prod    JSONB NOT NULL DEFAULT '{}'::jsonb,
  env_staging JSONB NOT NULL DEFAULT '{}'::jsonb,
  env_dev     JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by  TEXT
);

CREATE TABLE IF NOT EXISTS audit_log (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ts         TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id    UUID,
  email      TEXT,
  role       TEXT,
  ip         TEXT,
  ua         TEXT,
  action     TEXT,
  method     TEXT,
  path       TEXT,
  status     INTEGER,
  duration_ms INTEGER,
  meta       JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit_log(ts DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_email ON audit_log(email);

CREATE TABLE IF NOT EXISTS backups (
  id         TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  type       TEXT NOT NULL,
  size_bytes BIGINT,
  checksum   TEXT
);

CREATE TABLE IF NOT EXISTS backup_schedules (
  id            TEXT PRIMARY KEY,
  type          TEXT NOT NULL,
  every_minutes INTEGER NOT NULL,
  enabled       BOOLEAN NOT NULL DEFAULT TRUE,
  last_run_at   TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS notify_webhooks (
  id     TEXT PRIMARY KEY,
  url    TEXT NOT NULL,
  secret TEXT,
  events TEXT[] NOT NULL DEFAULT ARRAY['*']
);
CREATE TABLE IF NOT EXISTS notify_slack (
  id     TEXT PRIMARY KEY,
  url    TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT ARRAY['*']
);
CREATE TABLE IF NOT EXISTS notify_email (
  id     TEXT PRIMARY KEY,
  addr   TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT ARRAY['*']
);
