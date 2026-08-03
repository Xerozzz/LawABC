import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../auth.js";

const router = Router();

const STREAKS = [
  { days: 1, title: "Day 1 done! 🎉", body: "The hardest step is starting — and you took it." },
  { days: 3, title: "3 days vape-free 💪", body: "Nicotine is clearing your system. Cravings will start to ease." },
  { days: 7, title: "One week strong! 🌟", body: "A full week. Your body is already thanking you." },
  { days: 14, title: "Two weeks! 🔥", body: "Two weeks in — this is becoming your new normal." },
  { days: 30, title: "A whole month! 🏆", body: "30 days vape-free. That's a massive milestone." },
  { days: 60, title: "Two months! 🚀", body: "Your resilience is paying off. Keep going." },
  { days: 100, title: "100 days! 💯", body: "Triple digits. You're proof it can be done." },
  { days: 365, title: "One year vape-free! 🎂", body: "A full year. Incredible — celebrate this." },
];

// Build the set of notifications the user *should* have, then insert any missing.
// Idempotent thanks to the UNIQUE (user_id, ref_key) constraint.
async function syncNotifications(userId) {
  const { rows: users } = await query("SELECT * FROM users WHERE id = $1", [userId]);
  const u = users[0];
  if (!u || !u.quit_date) return;

  const daysQuit = Math.floor((Date.now() - new Date(u.quit_date).getTime()) / 86400000);
  const pending = [];

  // Streak notifications
  for (const s of STREAKS) {
    if (daysQuit >= s.days) {
      pending.push({ type: "streak", ref_key: `streak:${s.days}`, title: s.title, body: s.body });
    }
  }

  // Milestone-reached notifications
  const minutesQuit = Math.max(0, (Date.now() - new Date(u.quit_date).getTime()) / 60000);
  const { rows: milestones } = await query(
    "SELECT * FROM health_milestones ORDER BY sort_order ASC"
  );
  for (const m of milestones) {
    if (minutesQuit >= Number(m.minutes_after_quit)) {
      pending.push({
        type: "milestone",
        ref_key: `milestone:${m.id}`,
        title: `Health win: ${m.title} ❤️`,
        body: `${m.time_label} milestone reached — ${m.description}`,
      });
    }
  }

  // Savings goal reached
  if (u.savings_goal_amount && Number(u.savings_goal_amount) > 0) {
    const saved = (Number(u.weekly_spend) / 7) * daysQuit;
    if (saved >= Number(u.savings_goal_amount)) {
      pending.push({
        type: "goal",
        ref_key: "goal",
        title: "Savings goal reached! 💰",
        body: `You saved enough for "${u.savings_goal_label || "your goal"}". Treat yourself!`,
      });
    }
  }

  for (const n of pending) {
    await query(
      `INSERT INTO notifications (user_id, type, ref_key, title, body)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, ref_key) DO NOTHING`,
      [userId, n.type, n.ref_key, n.title, n.body]
    );
  }
}

router.get("/", requireAuth, async (req, res) => {
  await syncNotifications(req.user.id);
  const { rows } = await query(
    `SELECT id, type, title, body, created_at, read_at
       FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC, id DESC
      LIMIT 100`,
    [req.user.id]
  );
  const unread = rows.filter((r) => !r.read_at).length;
  res.json({ unread, notifications: rows });
});

// Mark all as read.
router.post("/read", requireAuth, async (req, res) => {
  await query(
    "UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL",
    [req.user.id]
  );
  res.json({ ok: true });
});

export default router;
