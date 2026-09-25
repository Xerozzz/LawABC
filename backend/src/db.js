import pg from "pg";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { milestones, MILESTONE_VERSION } from "./milestones.seed.js";
import { seedDemoContent } from "./demo.seed.js";
import { STREAK_GEMS } from "./rewards.catalog.js";

const { Pool } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgres://lawabc:lawabc_password@localhost:5432/lawabc",
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle Postgres client", err);
});

export const query = (text, params) => pool.query(text, params);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Wait until Postgres accepts connections. On a cold start (e.g. the whole
// stack restarting) the DB can still be "starting up" when the app boots, so
// retry instead of crashing.
async function waitForDb({ retries = 30, delayMs = 2000 } = {}) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await query("SELECT 1");
      return;
    } catch (err) {
      if (attempt === retries) throw err;
      console.log(`Database not ready (${err.code || err.message}); retry ${attempt}/${retries} in ${delayMs}ms…`);
      await sleep(delayMs);
    }
  }
}

// Apply schema and seed reference data. Safe to run on every startup.
export async function initDb() {
  await waitForDb();
  const schema = readFileSync(join(__dirname, "schema.sql"), "utf8");
  await query(schema);

  // Re-seed milestones whenever the seed version changes (also covers first run).
  const { rows: meta } = await query(
    "SELECT value FROM app_meta WHERE key = 'milestone_version'"
  );
  const current = meta[0]?.value;
  if (current !== MILESTONE_VERSION) {
    // Milestone ids change on re-seed, so drop stale milestone notifications too.
    await query("DELETE FROM notifications WHERE type = 'milestone'");
    await query("DELETE FROM health_milestones");
    for (let i = 0; i < milestones.length; i++) {
      const m = milestones[i];
      await query(
        `INSERT INTO health_milestones
           (minutes_after_quit, time_label, title, description, source_citation, inferred, sort_order, affirmation)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [m.minutes, m.time_label, m.title, m.description, m.source, !!m.inferred, i, m.affirmation ?? null]
      );
    }
    await query(
      `INSERT INTO app_meta (key, value) VALUES ('milestone_version', $1)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [MILESTONE_VERSION]
    );
    console.log(`Seeded ${milestones.length} health milestones (version ${MILESTONE_VERSION}).`);
  }

  // Affirmations are copy, not data: update them in place so existing milestone
  // ids (and the notifications that point at them) survive a wording change.
  for (let i = 0; i < milestones.length; i++) {
    await query(
      `UPDATE health_milestones SET affirmation = $1
        WHERE sort_order = $2 AND affirmation IS DISTINCT FROM $1`,
      [milestones[i].affirmation ?? null, i]
    );
  }

  // One-off, when streak gems moved from days-since-quit to the check-in streak:
  // keep the streak gems everyone had already earned, so no balance drops (or
  // goes into a hidden debt that swallows the gems they earn next).
  const { rows: gemsDone } = await query("SELECT 1 FROM app_meta WHERE key = 'legacy_streak_gems'");
  if (!gemsDone[0]) {
    const values = STREAK_GEMS.map((_, i) => `($${2 * i + 1}::int, $${2 * i + 2}::int)`).join(", ");
    await query(
      `UPDATE users u SET legacy_streak_gems = (
         SELECT COALESCE(SUM(g.gems), 0)::int FROM (VALUES ${values}) AS g(days, gems)
          WHERE FLOOR(EXTRACT(EPOCH FROM (NOW() - u.quit_date)) / 86400) >= g.days)
        WHERE u.quit_date IS NOT NULL`,
      STREAK_GEMS.flatMap((s) => [s.days, s.gems])
    );
    await query("INSERT INTO app_meta (key, value) VALUES ('legacy_streak_gems', 'done') ON CONFLICT (key) DO NOTHING");
  }

  await seedDemoContent();
}
