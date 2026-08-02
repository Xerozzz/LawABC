import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../auth.js";

const router = Router();

// Post an anonymous reflection, optionally tagged to a milestone.
router.post("/", requireAuth, async (req, res) => {
  const { body, milestoneId } = req.body || {};
  if (!body || !body.trim()) {
    return res.status(400).json({ error: "Reflection body required" });
  }
  const { rows } = await query(
    `INSERT INTO reflections (user_id, milestone_id, body)
     VALUES ($1, $2, $3)
     RETURNING id, milestone_id, body, created_at`,
    [req.user.id, milestoneId ?? null, body.trim().slice(0, 1000)]
  );
  res.status(201).json(rows[0]);
});

// Anonymous feed. No author identity is ever exposed.
// Optional ?milestoneId= filters to peers at the same stage.
router.get("/", requireAuth, async (req, res) => {
  const { milestoneId } = req.query;
  const params = [];
  let where = "WHERE r.status = 'visible'";
  if (milestoneId) {
    params.push(milestoneId);
    where += ` AND r.milestone_id = $${params.length}`;
  }
  const { rows } = await query(
    `SELECT r.id, r.milestone_id, r.body, r.created_at, m.time_label AS milestone_label
       FROM reflections r
       LEFT JOIN health_milestones m ON m.id = r.milestone_id
       ${where}
      ORDER BY r.created_at DESC
      LIMIT 100`,
    params
  );
  res.json(rows);
});

// Report a reflection -> hidden for moderation review (basic MVP moderation).
router.post("/:id/report", requireAuth, async (req, res) => {
  await query("UPDATE reflections SET status = 'hidden' WHERE id = $1", [req.params.id]);
  res.json({ ok: true });
});

export default router;
