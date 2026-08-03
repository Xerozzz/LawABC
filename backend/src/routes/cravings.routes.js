import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../auth.js";

const router = Router();

// Log a craving event (EMA data — see TASKS.md E4/E5).
router.post("/", requireAuth, async (req, res) => {
  const { toolUsed, outcome, lat, lng, context } = req.body || {};
  const { rows } = await query(
    `INSERT INTO craving_events (user_id, tool_used, outcome, lat, lng, context)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [req.user.id, toolUsed ?? null, outcome ?? "unknown", lat ?? null, lng ?? null, context ?? null]
  );
  res.status(201).json(rows[0]);
});

// List this user's craving events (feeds the trigger map + history).
router.get("/", requireAuth, async (req, res) => {
  const { rows } = await query(
    `SELECT id, occurred_at, tool_used, outcome, lat, lng, context
       FROM craving_events
      WHERE user_id = $1
      ORDER BY occurred_at DESC
      LIMIT 200`,
    [req.user.id]
  );
  res.json(rows);
});

// Delete one craving event (privacy control).
router.delete("/:id", requireAuth, async (req, res) => {
  const { rowCount } = await query(
    "DELETE FROM craving_events WHERE id = $1 AND user_id = $2",
    [req.params.id, req.user.id]
  );
  if (rowCount === 0) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});

// Clear ALL craving/location history for the user (privacy control).
router.delete("/", requireAuth, async (req, res) => {
  const { rowCount } = await query(
    "DELETE FROM craving_events WHERE user_id = $1",
    [req.user.id]
  );
  res.json({ ok: true, deleted: rowCount });
});

// Quick stats for the dashboard.
router.get("/stats", requireAuth, async (req, res) => {
  const { rows } = await query(
    `SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE outcome = 'passed')::int AS passed,
        COUNT(*) FILTER (WHERE occurred_at > NOW() - INTERVAL '7 days')::int AS last7
       FROM craving_events
      WHERE user_id = $1`,
    [req.user.id]
  );
  res.json(rows[0]);
});

export default router;
