// Optional demo content for user-testing prototypes. Enabled with DEMO_SEED=true.
// Seeds a handful of anonymous community reflections so the feed isn't empty
// when the first testers open the app. Safe to leave off in real deployments.

import { query } from "./db.js";

const DEMO_REFLECTIONS = [
  "Day 3 was the worst but it does get easier. Hang in there 💪",
  "The breathing thing actually works when a craving hits, not gonna lie.",
  "Saved enough to buy new earbuds this month instead of pods. Worth it.",
  "Nights are the hardest for me. Anyone else? You're not alone.",
  "One week today. Never thought I'd make it this far.",
  "My chest already feels less tight when I run. Small wins count.",
  "Deleted the vape apps and unfollowed the accounts. Out of sight helps.",
  "Told my best friend I'm quitting so they'd keep me accountable. Recommend it.",
];

export async function seedDemoContent() {
  if (process.env.DEMO_SEED !== "true") return;

  // A dedicated demo account owns the seed reflections (identity is never shown).
  const { rows } = await query(
    `INSERT INTO users (email, password_hash, onboarded)
       VALUES ('demo-seed@clearair.local', 'x', TRUE)
     ON CONFLICT (email) DO NOTHING
     RETURNING id`
  );
  let demoId = rows[0]?.id;
  if (!demoId) {
    const found = await query("SELECT id FROM users WHERE email = 'demo-seed@clearair.local'");
    demoId = found.rows[0].id;
  }

  const { rows: existing } = await query(
    "SELECT COUNT(*)::int AS n FROM reflections WHERE user_id = $1",
    [demoId]
  );
  if (existing[0].n > 0) return; // already seeded

  for (let i = 0; i < DEMO_REFLECTIONS.length; i++) {
    await query(
      `INSERT INTO reflections (user_id, body, created_at)
       VALUES ($1, $2, NOW() - ($3 || ' hours')::interval)`,
      [demoId, DEMO_REFLECTIONS[i], i * 7]
    );
  }
  console.log(`Seeded ${DEMO_REFLECTIONS.length} demo reflections.`);
}
