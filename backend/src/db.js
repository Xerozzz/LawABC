import pg from "pg";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { milestones, MILESTONE_SOURCE } from "./milestones.seed.js";

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

  const { rows } = await query("SELECT COUNT(*)::int AS n FROM health_milestones");
  if (rows[0].n === 0) {
    for (let i = 0; i < milestones.length; i++) {
      const m = milestones[i];
      await query(
        `INSERT INTO health_milestones
           (minutes_after_quit, time_label, title, description, source_citation, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [m.minutes, m.time_label, m.title, m.description, MILESTONE_SOURCE, i]
      );
    }
    console.log(`Seeded ${milestones.length} health milestones.`);
  }
}
