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
  consentAcceptedAt: u.consent_accepted_at,
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

// Record that the user accepted the privacy notice (blocking consent step).
router.post("/consent", requireAuth, async (req, res) => {
  const { rows } = await query(
    "UPDATE users SET consent_accepted_at = COALESCE(consent_accepted_at, NOW()) WHERE id = $1 RETURNING *",
    [req.user.id]
  );
  res.json(shapeProfile(rows[0]));
});

// Export all of the user's data (privacy / data-portability).
router.get("/export", requireAuth, async (req, res) => {
  const [profile, cravings, reflections, notifications, events] = await Promise.all([
    query("SELECT id, email, quit_date, weekly_spend, savings_goal_label, savings_goal_amount, consent_location, consent_share, consent_accepted_at, created_at FROM users WHERE id = $1", [req.user.id]),
    query("SELECT id, occurred_at, tool_used, outcome, lat, lng, context FROM craving_events WHERE user_id = $1 ORDER BY occurred_at", [req.user.id]),
    query("SELECT id, milestone_id, body, status, created_at FROM reflections WHERE user_id = $1 ORDER BY created_at", [req.user.id]),
    query("SELECT id, type, title, body, created_at, read_at FROM notifications WHERE user_id = $1 ORDER BY created_at", [req.user.id]),
    query("SELECT id, type, meta, created_at FROM events WHERE user_id = $1 ORDER BY created_at", [req.user.id]),
  ]);
  res.json({
    exportedAt: new Date().toISOString(),
    profile: profile.rows[0],
    cravings: cravings.rows,
    reflections: reflections.rows,
    notifications: notifications.rows,
    events: events.rows,
  });
});

// Delete the account and all associated data (ON DELETE CASCADE handles children).
router.delete("/", requireAuth, async (req, res) => {
  await query("DELETE FROM users WHERE id = $1", [req.user.id]);
  res.json({ ok: true });
});

export default router;
