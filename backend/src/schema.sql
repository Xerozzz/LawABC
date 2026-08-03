-- ClearAir schema. Applied idempotently on server startup (see db.js initDb()).

CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  quit_date       TIMESTAMPTZ,
  -- how much the user used to spend on vaping, per week, in dollars
  weekly_spend    NUMERIC(10, 2) DEFAULT 0,
  savings_goal_label   TEXT,
  savings_goal_amount  NUMERIC(10, 2),
  consent_location     BOOLEAN DEFAULT FALSE,
  consent_share        BOOLEAN DEFAULT FALSE,
  onboarded       BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reference data: researched health-recovery milestones.
-- NOTE: currently seeded with SMOKING cessation data as a placeholder.
-- Swap for vaping-specific milestones when confirmed (see TASKS.md E7).
CREATE TABLE IF NOT EXISTS health_milestones (
  id              SERIAL PRIMARY KEY,
  minutes_after_quit  BIGINT NOT NULL,
  time_label      TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  source_citation TEXT,
  inferred        BOOLEAN DEFAULT FALSE,
  sort_order      INT NOT NULL
);
-- Migration for DBs created before `inferred` existed.
ALTER TABLE health_milestones ADD COLUMN IF NOT EXISTS inferred BOOLEAN DEFAULT FALSE;

-- Small key/value store for app metadata (e.g. seed version).
CREATE TABLE IF NOT EXISTS app_meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS craving_events (
  id              SERIAL PRIMARY KEY,
  user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tool_used       TEXT,          -- 'breathing' | 'game' | 'story' | null
  outcome         TEXT,          -- 'passed' | 'vaped' | 'unknown'
  lat             DOUBLE PRECISION,
  lng             DOUBLE PRECISION,
  context         TEXT
);

CREATE TABLE IF NOT EXISTS reflections (
  id              SERIAL PRIMARY KEY,
  user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  milestone_id    INT REFERENCES health_milestones(id) ON DELETE SET NULL,
  body            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'visible',  -- 'visible' | 'hidden'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Event-based notifications (milestone reached, savings goal, streaks).
-- ref_key makes generation idempotent: we only insert a given notification once.
CREATE TABLE IF NOT EXISTS notifications (
  id              SERIAL PRIMARY KEY,
  user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,        -- 'milestone' | 'streak' | 'goal'
  ref_key         TEXT NOT NULL,        -- e.g. 'milestone:5', 'streak:7', 'goal'
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at         TIMESTAMPTZ,
  UNIQUE (user_id, ref_key)
);
