-- Incoming webhooks + replayable outbound deliveries

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Raw incoming events (one row per HTTP hit)
CREATE TABLE IF NOT EXISTS webhooks_in (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source        TEXT NOT NULL,                    -- 'stripe' | 'github' | 'slack' | 'generic'
  received_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip            TEXT,
  headers       JSONB NOT NULL DEFAULT '{}'::jsonb,
  raw_body      BYTEA NOT NULL,                   -- exact bytes used to verify signature
  json_body     JSONB,                            -- parsed JSON if applicable
  sig_ok        BOOLEAN,
  sig_detail    TEXT                              -- reason if failed
);
CREATE INDEX IF NOT EXISTS idx_webhooks_in_source ON webhooks_in(source);
CREATE INDEX IF NOT EXISTS idx_webhooks_in_time ON webhooks_in(received_at DESC);

-- Deliveries represent attempts to forward an inbound event to a target URL.
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  in_id         UUID REFERENCES webhooks_in(id) ON DELETE CASCADE,
  target_url    TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  status        TEXT NOT NULL DEFAULT 'queued',   -- queued|delivering|ok|error|dead
  attempts      INTEGER NOT NULL DEFAULT 0,
  next_at       TIMESTAMPTZ,                      -- when eligible for retry
  last_error    TEXT,
  response_status INTEGER,
  response_ms   INTEGER,
  response_body TEXT
);
CREATE INDEX IF NOT EXISTS idx_deliv_in_id ON webhook_deliveries(in_id);
CREATE INDEX IF NOT EXISTS idx_deliv_status_next ON webhook_deliveries(status, next_at);

