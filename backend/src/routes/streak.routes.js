import { Router } from "express";
import { requireAuth } from "../auth.js";
import { getStreak } from "../streak.js";

const router = Router();

// The 🔥 check-in streak + days vape-free (see streak.js for the rules).
router.get("/", requireAuth, async (req, res) => {
  const streak = await getStreak(req.user.id);
  if (!streak) return res.status(404).json({ error: "Not found" });
  res.json(streak);
});

export default router;
