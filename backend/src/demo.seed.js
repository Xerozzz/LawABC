// Optional demo content for user-testing prototypes. Enabled with DEMO_SEED=true.
// Seeds a handful of anonymous community reflections so the feed isn't empty
// when the first testers open the app. Safe to leave off in real deployments.

import { query } from "./db.js";

const DEMO_REFLECTIONS = [
  { body: "Day 3 was the worst but it does get easier. Hang in there 💪", channel: "advice" },
  { body: "The breathing thing actually works when a craving hits, not gonna lie.", channel: "cravings" },
  { body: "Saved enough to buy new earbuds this month instead of pods. Worth it.", channel: "wins" },
  { body: "Nights are the hardest for me. Anyone else? You're not alone.", channel: "vent" },
  { body: "One week today. Never thought I'd make it this far.", channel: "wins" },
  { body: "My chest already feels less tight when I run. Small wins count.", channel: "general" },
  { body: "Deleted the vape apps and unfollowed the accounts. Out of sight helps.", channel: "advice" },
  { body: "Told my best friend I'm quitting so they'd keep me accountable. Recommend it.", channel: "advice" },
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
    const r = DEMO_REFLECTIONS[i];
    await query(
      `INSERT INTO reflections (user_id, body, channel, created_at)
       VALUES ($1, $2, $3, NOW() - ($4 || ' hours')::interval)`,
      [demoId, r.body, r.channel, i * 7]
    );
  }
  console.log(`Seeded ${DEMO_REFLECTIONS.length} demo reflections.`);
}
