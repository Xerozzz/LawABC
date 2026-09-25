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
  consent_accepted_at  TIMESTAMPTZ,
  avatar          TEXT DEFAULT '🌱',
  theme           TEXT DEFAULT 'default',
  onboarded       BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Migrations for columns added after initial launch.
ALTER TABLE users ADD COLUMN IF NOT EXISTS consent_accepted_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT '🌱';
ALTER TABLE users ADD COLUMN IF NOT EXISTS theme  TEXT DEFAULT 'default';
-- Optional display name for community posts (still no real identity exposed).
ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname TEXT;
-- Longest check-in streak ever reached (high-water mark, see streak.js).
ALTER TABLE users ADD COLUMN IF NOT EXISTS best_streak INT NOT NULL DEFAULT 0;
-- Streak gems already earned under the old days-since-quit rule, kept when
-- streak gems moved to check-ins (set once by db.js, see rewards.routes.js).
ALTER TABLE users ADD COLUMN IF NOT EXISTS legacy_streak_gems INT NOT NULL DEFAULT 0;

-- Cosmetic items a user has unlocked with gems (avatars, themes).
CREATE TABLE IF NOT EXISTS unlocks (
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_key   TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, item_key)
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
-- A short, encouraging line shown with the milestone (kept in sync by db.js).
ALTER TABLE health_milestones ADD COLUMN IF NOT EXISTS affirmation TEXT;

-- Small key/value store for app metadata (e.g. seed version, VAPID keys).
CREATE TABLE IF NOT EXISTS app_meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Web Push subscriptions (one per browser/device).
CREATE TABLE IF NOT EXISTS push_subscriptions (
  endpoint     TEXT PRIMARY KEY,
  user_id      INT REFERENCES users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

-- The user's own triggers (feelings, places, people, times) and their plan for
-- each. A trigger can optionally be pinned to a spot on the trigger map.
CREATE TABLE IF NOT EXISTS triggers (
  id              SERIAL PRIMARY KEY,
  user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label           TEXT NOT NULL,
  kind            TEXT NOT NULL DEFAULT 'other',  -- 'feeling' | 'place' | 'people' | 'time' | 'other'
  plan            TEXT,                           -- "when this happens, I'll…"
  lat             DOUBLE PRECISION,
  lng             DOUBLE PRECISION,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- One trigger per name per user (case-insensitive); also the per-user lookup index.
CREATE UNIQUE INDEX IF NOT EXISTS triggers_user_label_uq ON triggers (user_id, lower(label));
-- Which of the user's triggers set a craving off (optional, tagged in Craving SOS).
ALTER TABLE craving_events ADD COLUMN IF NOT EXISTS trigger_id INT REFERENCES triggers(id) ON DELETE SET NULL;
-- Per-user history lookups (streak, trigger map, participation), and per-trigger counts.
CREATE INDEX IF NOT EXISTS craving_events_user_time_idx ON craving_events (user_id, occurred_at);
CREATE INDEX IF NOT EXISTS craving_events_trigger_idx ON craving_events (trigger_id);

CREATE TABLE IF NOT EXISTS reflections (
  id              SERIAL PRIMARY KEY,
  user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  milestone_id    INT REFERENCES health_milestones(id) ON DELETE SET NULL,
  body            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'visible',  -- 'visible' | 'hidden'
  channel         TEXT NOT NULL DEFAULT 'general',  -- topic channel
  prompt_id       TEXT,                             -- daily-prompt id if a response
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE reflections ADD COLUMN IF NOT EXISTS channel   TEXT NOT NULL DEFAULT 'general';
ALTER TABLE reflections ADD COLUMN IF NOT EXISTS prompt_id TEXT;

-- "I'm in!" sign-ups on community posts (sports jios, events).
CREATE TABLE IF NOT EXISTS reflection_joins (
  reflection_id INT NOT NULL REFERENCES reflections(id) ON DELETE CASCADE,
  user_id       INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (reflection_id, user_id)
);

-- Lightweight product analytics (screen views + key actions) for the pilot.
CREATE TABLE IF NOT EXISTS events (
  id          SERIAL PRIMARY KEY,
  user_id     INT REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  meta        JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS events_type_time_idx ON events (type, created_at);
CREATE INDEX IF NOT EXISTS events_user_time_idx ON events (user_id, created_at);

-- Event-based notifications (milestone reached, savings goal, streaks).
-- ref_key makes generation idempotent: we only insert a given notification once.
CREATE TABLE IF NOT EXISTS notifications (
  id              SERIAL PRIMARY KEY,
  user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,        -- 'milestone' | 'streak' | 'goal'
  ref_key         TEXT NOT NULL,        -- e.g. 'milestone:5', 'streak:7:2026-09-01', 'goal'
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at         TIMESTAMPTZ,
  UNIQUE (user_id, ref_key)
);
