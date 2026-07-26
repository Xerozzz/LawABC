-- Runs automatically on first container startup (empty data volume).
CREATE TABLE IF NOT EXISTS example (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO example (name) VALUES ('hello world')
ON CONFLICT DO NOTHING;
