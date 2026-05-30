-- ============================================================
-- Stratos Hub — Supabase / PostgreSQL schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Tables ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS companies (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  email       TEXT        NOT NULL UNIQUE,
  phone       TEXT,
  plan        TEXT        NOT NULL DEFAULT 'starter',
  credits     INTEGER     NOT NULL DEFAULT 1000,
  renews_at   TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL UNIQUE,
  name        TEXT        NOT NULL,
  password    TEXT        NOT NULL,
  role        TEXT        NOT NULL DEFAULT 'admin',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  company_id       UUID PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  openai_key_enc   TEXT,
  openai_key_iv    TEXT,
  openai_key_tag   TEXT,
  whatsapp_phone_id     TEXT,
  whatsapp_business_id  TEXT,
  whatsapp_token        TEXT,
  whatsapp_verify_token TEXT
);

CREATE TABLE IF NOT EXISTS files (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  size        INTEGER     NOT NULL,
  mime_type   TEXT        NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'processing'
              CHECK (status IN ('processing', 'ready', 'failed')),
  path        TEXT        NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_sessions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL DEFAULT 'New conversation',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID        NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  company_id  UUID        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role        TEXT        NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL DEFAULT '',
  phone         TEXT        NOT NULL DEFAULT '',
  budget        INTEGER     NOT NULL DEFAULT 0,
  city          TEXT        NOT NULL DEFAULT '',
  property_type TEXT        NOT NULL DEFAULT '',
  source        TEXT        NOT NULL DEFAULT 'Chat',
  status        TEXT        NOT NULL DEFAULT 'new'
                CHECK (status IN ('new', 'contacted', 'qualified', 'won', 'lost')),
  session_id    UUID        REFERENCES chat_sessions(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usage (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID    NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  date        DATE    NOT NULL,
  credits     INTEGER NOT NULL DEFAULT 0,
  chats       INTEGER NOT NULL DEFAULT 0,
  UNIQUE (company_id, date)
);

-- Full-text search table for uploaded file content (replaces SQLite FTS5)
CREATE TABLE IF NOT EXISTS file_chunks (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id     UUID    NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  company_id  UUID    NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  content     TEXT    NOT NULL
);

-- GIN index for fast full-text search on file chunks
CREATE INDEX IF NOT EXISTS idx_file_chunks_fts
  ON file_chunks USING GIN (to_tsvector('english', content));

CREATE INDEX IF NOT EXISTS idx_file_chunks_company
  ON file_chunks (company_id);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_messages_session    ON messages (session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_leads_company       ON leads (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_company    ON chat_sessions (company_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_files_company       ON files (company_id, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_company_date  ON usage (company_id, date);

-- ── Updated_at trigger for chat_sessions ─────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sessions_updated_at ON chat_sessions;
CREATE TRIGGER trg_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── RPC: increment_usage (atomic credit deduction + usage upsert) ─────────────

CREATE OR REPLACE FUNCTION increment_usage(p_company_id UUID, p_credits INT)
RETURNS VOID AS $$
BEGIN
  -- Deduct credits from company (floor at 0)
  UPDATE companies
    SET credits = GREATEST(0, credits - p_credits)
    WHERE id = p_company_id;

  -- Upsert today's usage row
  INSERT INTO usage (id, company_id, date, credits, chats)
  VALUES (gen_random_uuid(), p_company_id, CURRENT_DATE, p_credits, 1)
  ON CONFLICT (company_id, date)
  DO UPDATE SET
    credits = usage.credits + p_credits,
    chats   = usage.chats   + 1;
END;
$$ LANGUAGE plpgsql;

-- ── Row Level Security (disabled — backend uses service role key) ─────────────
-- RLS is intentionally OFF. The Bun backend authenticates with the service role
-- key and handles all authorization in application code.

ALTER TABLE companies     DISABLE ROW LEVEL SECURITY;
ALTER TABLE users         DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings      DISABLE ROW LEVEL SECURITY;
ALTER TABLE files         DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages      DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads         DISABLE ROW LEVEL SECURITY;
ALTER TABLE usage         DISABLE ROW LEVEL SECURITY;
ALTER TABLE file_chunks   DISABLE ROW LEVEL SECURITY;

-- Add widget_config to settings table if it doesn't exist
ALTER TABLE settings ADD COLUMN IF NOT EXISTS widget_config JSONB;

-- Added for AI Persona & Lead Scoring
ALTER TABLE settings ADD COLUMN IF NOT EXISTS system_prompt TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS score INTEGER NOT NULL DEFAULT 0;
