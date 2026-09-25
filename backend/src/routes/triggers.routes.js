import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../auth.js";
import { text, latLng, rowId } from "../input.js";

const router = Router();

// Keep in sync with frontend/src/triggers.js.
export const KINDS = ["feeling", "place", "people", "time", "other"];
const MAX_TRIGGERS = 50; // a soft cap against abuse; parallel adds can overshoot it slightly

function shape(body) {
  const b = body && typeof body === "object" ? body : {};
  return {
    label: text(b.label, 60),
    kind: KINDS.includes(b.kind) ? b.kind : "other",
    plan: text(b.plan, 200) || null,
    ...latLng(b.lat, b.lng),
  };
}

const SELECT = `
  SELECT t.id, t.label, t.kind, t.plan, t.lat, t.lng, t.created_at,
         COUNT(c.id)::int      AS cravings,
         MAX(c.occurred_at)    AS last_craving_at
    FROM triggers t
    LEFT JOIN craving_events c ON c.trigger_id = t.id
   WHERE t.user_id = $1`;

// The user's triggers, most-tagged first (feeds the SOS picker + trigger map).
router.get("/", requireAuth, async (req, res) => {
  const { rows } = await query(
    `${SELECT} GROUP BY t.id ORDER BY cravings DESC, t.id DESC`,
    [req.user.id]
  );
  res.json(rows);
});

const findOne = async (userId, id) =>
  (await query(`${SELECT} AND t.id = $2 GROUP BY t.id`, [userId, id])).rows[0];
const findByLabel = async (userId, label) =>
  (await query(`${SELECT} AND lower(t.label) = lower($2) GROUP BY t.id`, [userId, label])).rows[0];

// Add a trigger. Adding one the user already has (same label, any case) returns
// that one with `existed: true` instead of duplicating, so a double tap in SOS
// is harmless and the caller can tell nothing new was saved.
router.post("/", requireAuth, async (req, res) => {
  const t = shape(req.body);
  if (!t.label) return res.status(400).json({ error: "Give your trigger a name" });

  const same = await findByLabel(req.user.id, t.label);
  if (same) return res.json({ ...same, existed: true });

  const { rows: count } = await query(
    "SELECT COUNT(*)::int AS n FROM triggers WHERE user_id = $1",
    [req.user.id]
  );
  if (count[0].n >= MAX_TRIGGERS) {
    return res.status(400).json({ error: `You can keep up to ${MAX_TRIGGERS} triggers` });
  }

  // The unique (user_id, lower(label)) index settles a race with a parallel add.
  const { rows } = await query(
    `INSERT INTO triggers (user_id, label, kind, plan, lat, lng)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, lower(label)) DO NOTHING
     RETURNING id`,
    [req.user.id, t.label, t.kind, t.plan, t.lat, t.lng]
  );
  if (!rows[0]) return res.json({ ...(await findByLabel(req.user.id, t.label)), existed: true });
  res.status(201).json(await findOne(req.user.id, rows[0].id));
});

// Replace a trigger's details. Sending lat/lng as null removes its pin.
router.put("/:id", requireAuth, async (req, res) => {
  const id = rowId(req.params.id);
  if (id == null) return res.status(404).json({ error: "Not found" });
  const t = shape(req.body);
  if (!t.label) return res.status(400).json({ error: "Give your trigger a name" });

  try {
    const { rowCount } = await query(
      `UPDATE triggers SET label = $1, kind = $2, plan = $3, lat = $4, lng = $5
        WHERE id = $6 AND user_id = $7`,
      [t.label, t.kind, t.plan, t.lat, t.lng, id, req.user.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: "Not found" });
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "You already have a trigger with that name" });
    throw err;
  }
  res.json(await findOne(req.user.id, id));
});

// Delete a trigger. Cravings tagged with it stay logged (trigger_id -> NULL).
router.delete("/:id", requireAuth, async (req, res) => {
  const id = rowId(req.params.id);
  if (id == null) return res.status(404).json({ error: "Not found" });
  const { rowCount } = await query(
    "DELETE FROM triggers WHERE id = $1 AND user_id = $2",
    [id, req.user.id]
  );
  if (rowCount === 0) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});

export default router;
