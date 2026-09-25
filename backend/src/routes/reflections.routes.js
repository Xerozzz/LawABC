import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../auth.js";
import { requireFeature } from "../features.js";

const router = Router();

// The whole community (feed, posts, joins, reports, prompt) is switchable.
router.use(requireFeature("community"));

// Topic channels (online-only). Keep this list in sync with the frontend.
export const CHANNELS = ["general", "sports", "events", "cravings", "wins", "advice", "vent"];

// Rotating daily prompts. Deterministic by date so everyone sees the same one.
const PROMPTS = [
  "What's one thing that's been easier since you cut down?",
  "What triggers your cravings the most — and what helps?",
  "Who or what are you doing this for?",
  "Share a small win from this week, however tiny.",
  "What would you tell someone on day 1?",
  "What do you do instead of vaping now?",
  "What's the hardest time of day, and how do you get through it?",
];

// Today's prompt id (YYYY-MM-DD) + text, based on the server date.
function todaysPrompt() {
  const d = new Date();
  const id = d.toISOString().slice(0, 10);
  const dayNum = Math.floor(d.getTime() / 86400000);
  return { id, text: PROMPTS[dayNum % PROMPTS.length] };
}

router.get("/prompt", requireAuth, (_req, res) => {
  res.json(todaysPrompt());
});

// Post an anonymous reflection, optionally to a channel or as a prompt response.
router.post("/", requireAuth, async (req, res) => {
  const { body, milestoneId, channel, promptId } = req.body || {};
  if (!body || !body.trim()) {
    return res.status(400).json({ error: "Reflection body required" });
  }
  const chan = CHANNELS.includes(channel) ? channel : "general";
  const { rows } = await query(
    `INSERT INTO reflections (user_id, milestone_id, body, channel, prompt_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, milestone_id, body, channel, prompt_id, created_at`,
    [req.user.id, milestoneId ?? null, body.trim().slice(0, 1000), chan, promptId ?? null]
  );
  res.status(201).json(rows[0]);
});

// Anonymous feed. Author identity is never exposed (only their chosen avatar).
// Optional filters: ?channel= , ?promptId= , ?milestoneId=
router.get("/", requireAuth, async (req, res) => {
  const { milestoneId, channel, promptId } = req.query;
  const params = [];
  let where = "WHERE r.status = 'visible'";
  if (milestoneId) { params.push(milestoneId); where += ` AND r.milestone_id = $${params.length}`; }
  if (channel) { params.push(channel); where += ` AND r.channel = $${params.length}`; }
  if (promptId) { params.push(promptId); where += ` AND r.prompt_id = $${params.length}`; }
  const { rows } = await query(
    `SELECT r.id, r.milestone_id, r.body, r.channel, r.prompt_id, r.created_at,
            m.time_label AS milestone_label, u.avatar AS author_avatar, u.nickname AS author_name,
            FLOOR(EXTRACT(EPOCH FROM (NOW() - u.quit_date)) / 86400)::int AS author_day,
            (SELECT COUNT(*)::int FROM reflection_joins j WHERE j.reflection_id = r.id) AS joins,
            EXISTS(SELECT 1 FROM reflection_joins j
                    WHERE j.reflection_id = r.id AND j.user_id = $${params.length + 1}) AS joined
       FROM reflections r
       LEFT JOIN health_milestones m ON m.id = r.milestone_id
       JOIN users u ON u.id = r.user_id
       ${where}
      ORDER BY r.created_at DESC
      LIMIT 100`,
    [...params, req.user.id]
  );
  res.json(rows);
});

// Toggle "I'm in!" on a post (sports jios / community events).
router.post("/:id/join", requireAuth, async (req, res) => {
  const { rowCount } = await query(
    "DELETE FROM reflection_joins WHERE reflection_id = $1 AND user_id = $2",
    [req.params.id, req.user.id]
  );
  if (rowCount === 0) {
    const { rows } = await query(
      "SELECT id FROM reflections WHERE id = $1 AND status = 'visible'",
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Not found" });
    await query(
      "INSERT INTO reflection_joins (reflection_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [req.params.id, req.user.id]
    );
  }
  const { rows: c } = await query(
    "SELECT COUNT(*)::int AS joins FROM reflection_joins WHERE reflection_id = $1",
    [req.params.id]
  );
  res.json({ joined: rowCount === 0, joins: c[0].joins });
});

// Report a reflection -> hidden for moderation review (basic MVP moderation).
router.post("/:id/report", requireAuth, async (req, res) => {
  await query("UPDATE reflections SET status = 'hidden' WHERE id = $1", [req.params.id]);
  res.json({ ok: true });
});

export default router;
