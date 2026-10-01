import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { query } from "../db.js";
import { JWT_SECRET } from "../auth.js";
import { ADMIN_ACCOUNTS } from "../admins.js";
import { getParticipation, getUserActivity, STUDY_TZ } from "../activity.js";

const router = Router();

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

// Two ways in, neither tied to a participant account:
//   - an admin account from admins.js, signed in on the /admin page;
//   - the shared ADMIN_TOKEN, for scripts and curl (see STUDY.md).
// With no accounts and no token the whole router is disabled rather than open.

// Admin sessions are signed with a key derived from JWT_SECRET, so a
// participant's token can never pass as an admin's, or the reverse.
const SESSION_KEY = createHmac("sha256", JWT_SECRET).update("clearair-admin-session").digest();
const SESSION_TTL = "12h";

const findAccount = (username) => ADMIN_ACCOUNTS.find((a) => a.username === username);

// Changes whenever the account's password does, which signs out old sessions.
const passwordVersion = (account) =>
  createHash("sha256").update(account.passwordHash).digest("hex").slice(0, 16);

// The account behind a session token, if it's valid and the account still exists.
function sessionAccount(token) {
  if (!token) return null;
  try {
    const { sub, pwv } = jwt.verify(token, SESSION_KEY, { algorithms: ["HS256"] });
    const account = findAccount(sub);
    return account && passwordVersion(account) === pwv ? account : null;
  } catch {
    return null;
  }
}

// In production Caddy terminates TLS and reports it in X-Forwarded-Proto, so
// req.secure is true only for https. Local dev runs on plain http.
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);
const insecure = (req) =>
  process.env.NODE_ENV === "production" && !req.secure && !LOCAL_HOSTS.has(req.hostname);

const safeEqual = (supplied, expected) => {
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
};

// Failed sign-ins per IP, kept in memory (a restart clears them, which is fine
// for one small server).
const FAIL_LIMIT = 10;
const FAIL_WINDOW_MS = 15 * 60 * 1000;
const failures = new Map(); // ip -> { count, resetAt }

function failuresFor(ip) {
  const f = failures.get(ip);
  if (f && f.resetAt <= Date.now()) {
    failures.delete(ip);
    return null;
  }
  return f;
}

function recordFailure(ip) {
  const f = failuresFor(ip);
  if (f) f.count++;
  else failures.set(ip, { count: 1, resetAt: Date.now() + FAIL_WINDOW_MS });
  if (failures.size > 1000) {
    for (const [key, v] of failures) if (v.resetAt <= Date.now()) failures.delete(key);
  }
}

// Compared against when the username doesn't exist, so a wrong username takes
// as long as a wrong password and the response doesn't reveal which accounts exist.
const DUMMY_HASH = bcrypt.hashSync("not-an-account", 12);

router.post("/login", async (req, res) => {
  if (insecure(req)) {
    return res.status(403).json({ error: "Admin sign-in only works over https://" });
  }
  if ((failuresFor(req.ip)?.count || 0) >= FAIL_LIMIT) {
    return res.status(429).json({ error: "Too many failed attempts. Try again in 15 minutes." });
  }
  const { username, password } = req.body || {};
  if (typeof username !== "string" || typeof password !== "string" || !username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }
  const account = findAccount(username.trim().toLowerCase());
  const matches = await bcrypt.compare(password, account?.passwordHash || DUMMY_HASH);
  if (!account || !matches) {
    recordFailure(req.ip);
    return res.status(401).json({ error: "Wrong username or password" });
  }
  failures.delete(req.ip);
  const token = jwt.sign(
    { sub: account.username, pwv: passwordVersion(account) },
    SESSION_KEY,
    { algorithm: "HS256", expiresIn: SESSION_TTL }
  );
  res.json({ token, username: account.username });
});

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";

  const account = sessionAccount(bearer);
  if (account) {
    if (insecure(req)) return res.status(403).json({ error: "Admin access only works over https://" });
    req.admin = account.username;
    return next();
  }

  if (!ADMIN_TOKEN && ADMIN_ACCOUNTS.length === 0) {
    return res.status(503).json({ error: "Admin API disabled (set ADMIN_TOKEN or add an admin account)" });
  }
  const supplied = req.get("x-admin-token") || bearer;
  if (ADMIN_TOKEN && safeEqual(supplied, ADMIN_TOKEN)) return next();
  return res.status(401).json({ error: "Not signed in as an admin" });
}

router.use(requireAdmin);

// Who's signed in, so the /admin page can check a stored session is still good.
router.get("/me", (req, res) => {
  res.json({ username: req.admin || null });
});

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

  const [user, events, cravings, triggers, reflections, joins, unlocks, notifications] = await Promise.all([
    query("SELECT id, email, nickname, quit_date, weekly_spend, onboarded, consent_accepted_at, created_at FROM users WHERE id = $1", [id]),
    query("SELECT id, type, meta, created_at FROM events WHERE user_id = $1 ORDER BY created_at", [id]),
    query("SELECT id, occurred_at, tool_used, outcome, lat, lng, context, trigger_id FROM craving_events WHERE user_id = $1 ORDER BY occurred_at", [id]),
    query("SELECT id, label, kind, plan, lat, lng, created_at FROM triggers WHERE user_id = $1 ORDER BY created_at", [id]),
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
    triggers: triggers.rows,
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
