import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../auth.js";

const router = Router();

const shapeProfile = (u) => ({
  id: u.id,
  email: u.email,
  quitDate: u.quit_date,
  weeklySpend: u.weekly_spend == null ? null : Number(u.weekly_spend),
  savingsGoalLabel: u.savings_goal_label,
  savingsGoalAmount:
    u.savings_goal_amount == null ? null : Number(u.savings_goal_amount),
  consentLocation: u.consent_location,
  consentShare: u.consent_share,
  onboarded: u.onboarded,
});

router.get("/", requireAuth, async (req, res) => {
  const { rows } = await query("SELECT * FROM users WHERE id = $1", [req.user.id]);
  if (!rows[0]) return res.status(404).json({ error: "Not found" });
  res.json(shapeProfile(rows[0]));
});

// Update profile / complete onboarding.
router.put("/", requireAuth, async (req, res) => {
  const {
    quitDate,
    weeklySpend,
    savingsGoalLabel,
    savingsGoalAmount,
    consentLocation,
    consentShare,
  } = req.body || {};

  const { rows } = await query(
    `UPDATE users SET
        quit_date           = COALESCE($1, quit_date),
        weekly_spend        = COALESCE($2, weekly_spend),
        savings_goal_label  = COALESCE($3, savings_goal_label),
        savings_goal_amount = COALESCE($4, savings_goal_amount),
        consent_location    = COALESCE($5, consent_location),
        consent_share       = COALESCE($6, consent_share),
        onboarded           = TRUE
     WHERE id = $7
     RETURNING *`,
    [
      quitDate ?? null,
      weeklySpend ?? null,
      savingsGoalLabel ?? null,
      savingsGoalAmount ?? null,
      consentLocation ?? null,
      consentShare ?? null,
      req.user.id,
    ]
  );
  res.json(shapeProfile(rows[0]));
});

export default router;
