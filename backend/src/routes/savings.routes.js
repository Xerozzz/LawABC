import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../auth.js";

const router = Router();

// Real-time savings since quitting, plus progress toward the user's goal.
router.get("/", requireAuth, async (req, res) => {
  const { rows } = await query("SELECT * FROM users WHERE id = $1", [req.user.id]);
  const u = rows[0];
  if (!u) return res.status(404).json({ error: "Not found" });

  const weeklySpend = Number(u.weekly_spend) || 0;
  const quitDate = u.quit_date ? new Date(u.quit_date) : null;

  let saved = 0;
  let daysQuit = 0;
  if (quitDate) {
    const ms = Math.max(0, Date.now() - quitDate.getTime());
    daysQuit = ms / (1000 * 60 * 60 * 24);
    saved = (weeklySpend / 7) * daysQuit;
  }

  const goalAmount = u.savings_goal_amount == null ? null : Number(u.savings_goal_amount);
  const goalProgress =
    goalAmount && goalAmount > 0 ? Math.min(1, saved / goalAmount) : null;

  res.json({
    saved: Number(saved.toFixed(2)),
    daysQuit: Math.floor(daysQuit),
    weeklySpend,
    goalLabel: u.savings_goal_label,
    goalAmount,
    goalProgress: goalProgress == null ? null : Number(goalProgress.toFixed(3)),
  });
});

export default router;
