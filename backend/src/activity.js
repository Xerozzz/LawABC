// Participation tracking for the pilot study.
//
// "Activity" is assembled on the fly from the tables that already record what a
// user did — no new tables, so /api/profile/export and account deletion keep
// working unchanged (events are already exported; everything else cascades).
//
// Two grades of activity per day:
//   opened  — any signal at all, including a passive screen_view
//   active  — at least one deliberate action (the study's "qualified day")
import { query } from "./db.js";

export const STUDY_TZ = process.env.STUDY_TZ || "Asia/Singapore";
export const STUDY_DAYS = Number(process.env.STUDY_DAYS || 14);
// Optional fixed cohort start (YYYY-MM-DD). Unset => each user's window starts
// the day they accepted consent.
export const STUDY_START_DATE = process.env.STUDY_START_DATE || null;

// Every source of "the user did something", unioned into one shape.
// screen_view is the only passive signal; everything else is a real action.
export const ACTIVITY_SOURCES = `
  SELECT user_id, created_at  AS at, (type <> 'screen_view') AS is_action, type AS kind FROM events
  UNION ALL
  SELECT user_id, occurred_at AS at, TRUE, 'craving_logged'   FROM craving_events
  UNION ALL
  SELECT user_id, created_at  AS at, TRUE, 'reflection_posted' FROM reflections
  UNION ALL
  SELECT user_id, created_at  AS at, TRUE, 'community_join'    FROM reflection_joins
  UNION ALL
  SELECT user_id, created_at  AS at, TRUE, 'reward_unlocked'   FROM unlocks
`;

// Dates are passed around as plain 'YYYY-MM-DD' strings in STUDY_TZ. Casting to
// text in SQL avoids node-pg turning DATE into a local-midnight JS Date.
export const addDays = (ymd, n) => {
  const [y, m, d] = ymd.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d) + n * 86400000);
  return t.toISOString().slice(0, 10);
};

const diffDays = (a, b) => {
  const p = (s) => { const [y, m, d] = s.split("-").map(Number); return Date.UTC(y, m - 1, d); };
  return Math.round((p(b) - p(a)) / 86400000);
};

// Today, in the study's timezone.
export async function studyToday() {
  const { rows } = await query(
    "SELECT to_char(NOW() AT TIME ZONE $1, 'YYYY-MM-DD') AS today",
    [STUDY_TZ]
  );
  return rows[0].today;
}

// Build the fixed-length day window and fold the per-day counts into it.
function buildWindow(startDate, today, byDay) {
  const days = [];
  for (let i = 0; i < STUDY_DAYS; i++) {
    const date = addDays(startDate, i);
    const row = byDay.get(date);
    days.push({
      date,
      dayNumber: i + 1,
      actions: row?.actions || 0,
      total: row?.total || 0,
      active: (row?.actions || 0) > 0,
      opened: (row?.total || 0) > 0,
      isToday: date === today,
      isFuture: date > today,
    });
  }
  return days;
}

// Longest run of active days, and the run ending today (or yesterday, so the
// streak doesn't visibly break before the user has had a chance to use the app).
function streaks(days, today) {
  let longest = 0, run = 0;
  for (const d of days) {
    run = d.active ? run + 1 : 0;
    if (run > longest) longest = run;
  }
  const past = days.filter((d) => !d.isFuture);
  let current = 0;
  for (let i = past.length - 1; i >= 0; i--) {
    if (past[i].active) current++;
    else if (past[i].date === today) continue; // today still has time to count
    else break;
  }
  return { current, longest };
}

async function windowFor(userId) {
  const { rows } = await query(
    `SELECT to_char(COALESCE(consent_accepted_at, created_at) AT TIME ZONE $2, 'YYYY-MM-DD') AS joined,
            to_char(NOW() AT TIME ZONE $2, 'YYYY-MM-DD') AS today
       FROM users WHERE id = $1`,
    [userId, STUDY_TZ]
  );
  if (!rows[0]) return null;
  return { startDate: STUDY_START_DATE || rows[0].joined, today: rows[0].today };
}

// Per-day participation for one user, shaped for the in-app grid.
export async function getUserActivity(userId) {
  const win = await windowFor(userId);
  if (!win) return null;
  const { startDate, today } = win;
  const endDate = addDays(startDate, STUDY_DAYS - 1);

  const { rows } = await query(
    `WITH activity AS (${ACTIVITY_SOURCES})
     SELECT to_char(at AT TIME ZONE $2, 'YYYY-MM-DD') AS day,
            COUNT(*) FILTER (WHERE is_action)::int     AS actions,
            COUNT(*)::int                              AS total
       FROM activity
      WHERE user_id = $1
        AND (at AT TIME ZONE $2)::date BETWEEN $3::date AND $4::date
      GROUP BY 1`,
    [userId, STUDY_TZ, startDate, endDate]
  );

  const byDay = new Map(rows.map((r) => [r.day, r]));
  const days = buildWindow(startDate, today, byDay);
  const activeDays = days.filter((d) => d.active).length;

  return {
    timezone: STUDY_TZ,
    startDate,
    endDate,
    today,
    totalDays: STUDY_DAYS,
    dayNumber: Math.min(STUDY_DAYS, Math.max(1, diffDays(startDate, today) + 1)),
    daysRemaining: Math.max(0, diffDays(today, endDate)),
    complete: today > endDate,
    activeDays,
    ...streaks(days, today),
    days,
  };
}

// Participation across every user — the payout view. One query for the whole
// cohort, folded per user in JS.
export async function getParticipation() {
  const today = await studyToday();

  const { rows: users } = await query(
    `SELECT id, email, nickname,
            to_char(COALESCE(consent_accepted_at, created_at) AT TIME ZONE $1, 'YYYY-MM-DD') AS joined
       FROM users ORDER BY id`,
    [STUDY_TZ]
  );

  const { rows: counts } = await query(
    `WITH activity AS (${ACTIVITY_SOURCES})
     SELECT user_id,
            to_char(at AT TIME ZONE $1, 'YYYY-MM-DD') AS day,
            COUNT(*) FILTER (WHERE is_action)::int     AS actions,
            COUNT(*)::int                              AS total
       FROM activity
      GROUP BY 1, 2`,
    [STUDY_TZ]
  );

  const perUser = new Map();
  for (const c of counts) {
    if (!perUser.has(c.user_id)) perUser.set(c.user_id, new Map());
    perUser.get(c.user_id).set(c.day, c);
  }

  const participants = users.map((u) => {
    const startDate = STUDY_START_DATE || u.joined;
    const days = buildWindow(startDate, today, perUser.get(u.id) || new Map());
    const activeDays = days.filter((d) => d.active).length;
    const endDate = addDays(startDate, STUDY_DAYS - 1);
    return {
      userId: u.id,
      email: u.email,
      nickname: u.nickname,
      startDate,
      endDate,
      complete: today > endDate,
      activeDays,
      openedDays: days.filter((d) => d.opened).length,
      totalActions: days.reduce((n, d) => n + d.actions, 0),
      ...streaks(days, today),
      days: days.map((d) => ({ date: d.date, actions: d.actions, total: d.total, active: d.active })),
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    timezone: STUDY_TZ,
    today,
    studyDays: STUDY_DAYS,
    fixedStart: STUDY_START_DATE,
    qualifiedDayRule: "at least one deliberate action (any signal except a bare screen_view)",
    participants,
  };
}
