import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../auth.js";

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

export default router;
