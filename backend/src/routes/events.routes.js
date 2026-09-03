import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../auth.js";
import { getUserActivity } from "../activity.js";

const router = Router();

// Log a lightweight product-analytics event (screen view / key action).
// Fire-and-forget from the client; covered by the consent notice.
router.post("/", requireAuth, async (req, res) => {
  const { type, meta } = req.body || {};
  if (!type || typeof type !== "string") {
    return res.status(400).json({ error: "type required" });
  }
  await query(
    "INSERT INTO events (user_id, type, meta) VALUES ($1, $2, $3)",
    [req.user.id, type.slice(0, 60), meta && typeof meta === "object" ? meta : null]
  );
  res.status(201).json({ ok: true });
});

// The user's own participation grid (see activity.js for how a day qualifies).
router.get("/activity", requireAuth, async (req, res) => {
  const activity = await getUserActivity(req.user.id);
  if (!activity) return res.status(404).json({ error: "Not found" });
  res.json(activity);
});

export default router;
