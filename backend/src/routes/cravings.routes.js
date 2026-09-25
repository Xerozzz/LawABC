import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../auth.js";
import { text, latLng, rowId } from "../input.js";

const router = Router();

// Log a craving event (EMA data — see TASKS.md E4/E5).
router.post("/", requireAuth, async (req, res) => {
  const b = req.body && typeof req.body === "object" ? req.body : {};
  const { lat, lng } = latLng(b.lat, b.lng);

  // Only tag with a trigger the user owns (checked in the INSERT); otherwise untagged.
  const { rows } = await query(
    `INSERT INTO craving_events (user_id, tool_used, outcome, lat, lng, context, trigger_id)
     VALUES ($1, $2, $3, $4, $5, $6,
             (SELECT id FROM triggers WHERE id = $7 AND user_id = $1))
     RETURNING *`,
    [
      req.user.id,
      text(b.toolUsed, 40) || null,
      text(b.outcome, 20) || "unknown",
      lat,
      lng,
      text(b.context, 500) || null,
      rowId(b.triggerId),
    ]
  );
  res.status(201).json(rows[0]);
});

// List this user's craving events (feeds the trigger map + history).
router.get("/", requireAuth, async (req, res) => {
  const { rows } = await query(
    `SELECT c.id, c.occurred_at, c.tool_used, c.outcome, c.lat, c.lng, c.context,
            c.trigger_id, t.label AS trigger_label
       FROM craving_events c
       LEFT JOIN triggers t ON t.id = c.trigger_id
      WHERE c.user_id = $1
      ORDER BY c.occurred_at DESC
      LIMIT 200`,
    [req.user.id]
  );
  res.json(rows);
});

// Delete one craving event (privacy control).
router.delete("/:id", requireAuth, async (req, res) => {
  const id = rowId(req.params.id);
  if (id == null) return res.status(404).json({ error: "Not found" });
  const { rowCount } = await query(
    "DELETE FROM craving_events WHERE id = $1 AND user_id = $2",
    [id, req.user.id]
  );
  if (rowCount === 0) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});

// Clear ALL craving/location history for the user (privacy control). Pinned
// trigger spots are location history too: the pins go, the triggers stay.
router.delete("/", requireAuth, async (req, res) => {
  const { rowCount } = await query(
    "DELETE FROM craving_events WHERE user_id = $1",
    [req.user.id]
  );
  const { rowCount: unpinned } = await query(
    "UPDATE triggers SET lat = NULL, lng = NULL WHERE user_id = $1 AND (lat IS NOT NULL OR lng IS NOT NULL)",
    [req.user.id]
  );
  res.json({ ok: true, deleted: rowCount, unpinned });
});

// Quick stats for the dashboard.
router.get("/stats", requireAuth, async (req, res) => {
  const { rows } = await query(
    `SELECT
        COUNT(*)::int AS total,
        -- "beaten" = faced a craving and did NOT vape (passed or held on)
        COUNT(*) FILTER (WHERE outcome <> 'vaped')::int AS beaten,
        COUNT(*) FILTER (WHERE outcome = 'passed')::int AS passed,
        COUNT(*) FILTER (WHERE occurred_at > NOW() - INTERVAL '7 days')::int AS last7
       FROM craving_events
      WHERE user_id = $1`,
    [req.user.id]
  );
  res.json(rows[0]);
});

export default router;
