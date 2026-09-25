import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../auth.js";
import { getStreak, vapeFreeStart } from "../streak.js";
import { addDays } from "../activity.js";

const router = Router();

// Check-in streak celebrations (streak.js). About showing up, not physiology —
// the health milestones cover that.
const STREAKS = [
  { days: 1, title: "Streak started! 🎉", body: "Your first check-in is in. Check in each day to keep it going." },
  { days: 3, title: "3-day streak 💪", body: "Three days in a row of showing up for yourself." },
  { days: 7, title: "One-week streak! 🌟", body: "A full week of check-ins. That's real commitment." },
  { days: 14, title: "Two-week streak! 🔥", body: "Two weeks in a row — this is becoming your new normal." },
  { days: 30, title: "30-day streak! 🏆", body: "A whole month of showing up. That's a massive milestone." },
  { days: 60, title: "60-day streak! 🚀", body: "Your consistency is paying off. Keep going." },
  { days: 100, title: "100-day streak! 💯", body: "Triple digits. You're proof it can be done." },
  { days: 365, title: "365-day streak! 🎂", body: "A full year of showing up for yourself. Celebrate this." },
];

// Build the set of notifications the user *should* have, then insert any missing.
// Idempotent thanks to the UNIQUE (user_id, ref_key) constraint.
async function syncNotifications(userId) {
  const [{ rows: users }, streak] = await Promise.all([
    query("SELECT * FROM users WHERE id = $1", [userId]),
    getStreak(userId),
  ]);
  const u = users[0];
  if (!u || !streak) return;
  const pending = [];

  // Streak notifications follow the check-in streak (streak.js). Keyed by the
  // day the run started, so a new run after a slip gets celebrated again — but
  // only on (or the day after) the day a threshold is actually reached, so runs
  // rebuilt from history (e.g. a deleted vape joining two runs) don't send a
  // burst of old ones. "Streak started" is sent once, ever.
  const { rows: sent } = await query(
    "SELECT ref_key FROM notifications WHERE user_id = $1 AND type = 'streak'",
    [userId]
  );
  for (const s of STREAKS) {
    if (streak.current < s.days) continue;
    if (addDays(streak.runStart, s.days - 1) < addDays(streak.today, -1)) continue;
    // Already celebrated inside this same run (its start moved because a craving
    // was deleted): don't send it twice.
    const again = sent.some(({ ref_key }) => {
      const [, n, start] = ref_key.split(":");
      return Number(n) === s.days && start && addDays(start, s.days - 1) >= streak.runStart;
    });
    if (again) continue;
    const ref_key = s.days === 1 ? "streak:1" : `streak:${s.days}:${streak.runStart}`;
    pending.push({ type: "streak", ref_key, title: s.title, body: s.body });
  }

  if (u.quit_date) await quitDateNotifications(u, streak, pending);

  for (const n of pending) {
    await query(
      `INSERT INTO notifications (user_id, type, ref_key, title, body)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, ref_key) DO NOTHING`,
      [userId, n.type, n.ref_key, n.title, n.body]
    );
  }
}

// The savings goal runs off the quit date; health milestones off the current
// vape-free stretch (as on Progress), so none is claimed right after a slip.
async function quitDateNotifications(u, streak, pending) {
  const daysQuit = Math.floor((Date.now() - new Date(u.quit_date).getTime()) / 86400000);

  // Milestone-reached notifications (each sent once, ever)
  const { since } = vapeFreeStart(u.quit_date, streak.lastVapedAt);
  const minutesQuit = Math.max(0, (Date.now() - since.getTime()) / 60000);
  const { rows: milestones } = await query(
    "SELECT * FROM health_milestones ORDER BY sort_order ASC"
  );
  for (const m of milestones) {
    if (minutesQuit >= Number(m.minutes_after_quit)) {
      // Lead with the affirmation — that's the part worth sending.
      pending.push({
        type: "milestone",
        ref_key: `milestone:${m.id}`,
        title: `Health win: ${m.title} ❤️`,
        body: `${m.affirmation ? `${m.affirmation}\n` : ""}${m.time_label} milestone reached — ${m.description}`,
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
