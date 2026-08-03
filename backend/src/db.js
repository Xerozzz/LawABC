import pg from "pg";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { milestones, MILESTONE_VERSION } from "./milestones.seed.js";
import { seedDemoContent } from "./demo.seed.js";

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

// Apply schema and seed reference data. Safe to run on every startup.
export async function initDb() {
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
           (minutes_after_quit, time_label, title, description, source_citation, inferred, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [m.minutes, m.time_label, m.title, m.description, m.source, !!m.inferred, i]
      );
    }
    await query(
      `INSERT INTO app_meta (key, value) VALUES ('milestone_version', $1)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [MILESTONE_VERSION]
    );
    console.log(`Seeded ${milestones.length} health milestones (version ${MILESTONE_VERSION}).`);
  }

  await seedDemoContent();
}
