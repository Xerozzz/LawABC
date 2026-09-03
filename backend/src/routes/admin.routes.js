import { Router } from "express";
import { timingSafeEqual } from "node:crypto";
import { query } from "../db.js";
import { getParticipation, getUserActivity, STUDY_TZ } from "../activity.js";

const router = Router();

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

// Shared-secret auth for the study team. Deliberately not tied to a user role:
// there is no admin surface inside the app for a participant to stumble onto.
// With ADMIN_TOKEN unset the whole router is disabled rather than open.
function requireAdmin(req, res, next) {
  if (!ADMIN_TOKEN) {
    return res.status(503).json({ error: "Admin API disabled (set ADMIN_TOKEN)" });
  }
  const header = req.headers.authorization || "";
  const supplied =
    req.get("x-admin-token") || (header.startsWith("Bearer ") ? header.slice(7) : "");
  const a = Buffer.from(supplied);
  const b = Buffer.from(ADMIN_TOKEN);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return res.status(401).json({ error: "Bad admin token" });
  }
  next();
}

router.use(requireAdmin);

// Cohort participation: every user x every study day.
router.get("/participation", async (_req, res) => {
  res.json(await getParticipation());
});

const csvCell = (v) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// Same data as a spreadsheet — this is the one to open on payout day.
router.get("/participation.csv", async (_req, res) => {
  const { participants, studyDays, today, timezone } = await getParticipation();
  const header = [
    "user_id", "email", "nickname", "start_date", "end_date", "window_complete",
    "active_days", "study_days", "opened_days", "total_actions",
    "current_streak", "longest_streak",
    ...Array.from({ length: studyDays }, (_, i) => `day_${i + 1}`),
  ];
  const lines = [header.join(",")];
  for (const p of participants) {
    lines.push([
      p.userId, p.email, p.nickname, p.startDate, p.endDate, p.complete,
      p.activeDays, studyDays, p.openedDays, p.totalActions,
      p.current, p.longest,
      ...p.days.map((d) => d.actions),
    ].map(csvCell).join(","));
  }
  res.type("text/csv").set(
    "Content-Disposition",
    `attachment; filename="clearair-participation-${today}.csv"`
  );
  res.send(`# ClearAir participation as of ${today} (${timezone})\n${lines.join("\n")}\n`);
});

router.get("/users", async (_req, res) => {
  const { rows } = await query(
    `SELECT id, email, nickname, quit_date, onboarded, consent_accepted_at, created_at
       FROM users ORDER BY id`
  );
  res.json({ users: rows });
});

// Everything one participant did, for reading feedback alongside their usage.
router.get("/users/:id/logs", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Bad user id" });

  const [user, events, cravings, reflections, joins, unlocks, notifications] = await Promise.all([
    query("SELECT id, email, nickname, quit_date, weekly_spend, onboarded, consent_accepted_at, created_at FROM users WHERE id = $1", [id]),
    query("SELECT id, type, meta, created_at FROM events WHERE user_id = $1 ORDER BY created_at", [id]),
    query("SELECT id, occurred_at, tool_used, outcome, lat, lng, context FROM craving_events WHERE user_id = $1 ORDER BY occurred_at", [id]),
    query("SELECT id, milestone_id, body, status, channel, prompt_id, created_at FROM reflections WHERE user_id = $1 ORDER BY created_at", [id]),
    query("SELECT reflection_id, created_at FROM reflection_joins WHERE user_id = $1 ORDER BY created_at", [id]),
    query("SELECT item_key, created_at FROM unlocks WHERE user_id = $1 ORDER BY created_at", [id]),
    query("SELECT id, type, title, body, created_at, read_at FROM notifications WHERE user_id = $1 ORDER BY created_at", [id]),
  ]);
  if (!user.rows[0]) return res.status(404).json({ error: "No such user" });

  res.json({
    user: user.rows[0],
    activity: await getUserActivity(id),
    events: events.rows,
    cravings: cravings.rows,
    reflections: reflections.rows,
    joins: joins.rows,
    unlocks: unlocks.rows,
    notifications: notifications.rows,
  });
});

// Raw event stream across the cohort, newest first.
router.get("/events", async (req, res) => {
  const limit = Math.min(5000, Math.max(1, Number(req.query.limit) || 1000));
  const since = req.query.since || null;
  const { rows } = await query(
    `SELECT id, user_id, type, meta, created_at,
            to_char(created_at AT TIME ZONE $3, 'YYYY-MM-DD HH24:MI') AS local_time
       FROM events
      WHERE ($1::timestamptz IS NULL OR created_at >= $1)
      ORDER BY created_at DESC
      LIMIT $2`,
    [since, limit, STUDY_TZ]
  );
  res.json({ timezone: STUDY_TZ, count: rows.length, events: rows });
});

// Daily totals across the cohort — quick "is the study alive" check.
router.get("/summary", async (_req, res) => {
  const { participants, studyDays, today, timezone } = await getParticipation();
  const dist = {};
  for (const p of participants) dist[p.activeDays] = (dist[p.activeDays] || 0) + 1;
  res.json({
    today,
    timezone,
    studyDays,
    participants: participants.length,
    onboardedWithActivity: participants.filter((p) => p.activeDays > 0).length,
    perfectSoFar: participants.filter((p) => p.activeDays >= studyDays).length,
    medianActiveDays: participants.length
      ? participants.map((p) => p.activeDays).sort((a, b) => a - b)[Math.floor(participants.length / 2)]
      : 0,
    activeDaysDistribution: dist,
  });
});

export default router;
