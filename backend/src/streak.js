// The 🔥 streak and "days vape-free".
//
// Both used to be plain "days since the quit date", so they kept climbing when
// someone never opened the app, and even right after they told us they vaped.
//
//   streak     consecutive days (cut in STUDY_TZ, like the study grid) with at
//              least one deliberate action (see activity.js) and no "I vaped"
//              check-in. A missed day or a logged vape resets it. Today only
//              joins the run once they check in; until then the run ending
//              yesterday still shows, so it doesn't visibly break at midnight.
//   vapeFree   time since the quit date or the last logged vape, whichever is
//              later. A logged vape resets it; a quiet day in the app doesn't
//              (not opening the app isn't a slip). Health recovery counts from
//              the same point — its milestones are "time since nicotine" facts.
//
// Money saved stays on the quit date: one slip doesn't cost a week's spend.
import { query } from "./db.js";
import { ACTIVITY_SOURCES, STUDY_TZ, addDays } from "./activity.js";

const DAY_MS = 86400000;

// When the current vape-free stretch began: the quit date, or the last logged
// vape if that's later. `restarted` says it was a slip, not the quit date.
export function vapeFreeStart(quitDate, lastVapedAt) {
  const quit = quitDate ? new Date(quitDate) : null;
  const vaped = lastVapedAt ? new Date(lastVapedAt) : null;
  if (vaped && (!quit || vaped > quit)) return { since: vaped, restarted: true };
  return { since: quit, restarted: false };
}

const LAST_VAPED = `(SELECT MAX(occurred_at) FROM craving_events
                     WHERE user_id = $1 AND outcome = 'vaped') AS last_vaped_at`;

// Just the stretch (for callers that don't need the whole streak).
export async function vapeFreeSpan(userId) {
  const { rows } = await query(`SELECT quit_date, ${LAST_VAPED} FROM users WHERE id = $1`, [userId]);
  return rows[0] ? vapeFreeStart(rows[0].quit_date, rows[0].last_vaped_at) : null;
}

export async function getStreak(userId) {
  const [{ rows: users }, { rows: activeRows }, { rows: vapedRows }] = await Promise.all([
    query(
      `SELECT quit_date, best_streak,
              to_char(NOW() AT TIME ZONE $2, 'YYYY-MM-DD') AS today,
              ${LAST_VAPED}
         FROM users WHERE id = $1`,
      [userId, STUDY_TZ]
    ),
    query(
      `WITH activity AS (${ACTIVITY_SOURCES})
       SELECT DISTINCT to_char(at AT TIME ZONE $2, 'YYYY-MM-DD') AS day
         FROM activity
        WHERE user_id = $1 AND is_action`,
      [userId, STUDY_TZ]
    ),
    query(
      `SELECT DISTINCT to_char(occurred_at AT TIME ZONE $2, 'YYYY-MM-DD') AS day
         FROM craving_events
        WHERE user_id = $1 AND outcome = 'vaped'`,
      [userId, STUDY_TZ]
    ),
  ]);
  const u = users[0];
  if (!u) return null;

  const today = u.today;
  const active = new Set(activeRows.map((r) => r.day));
  const vaped = new Set(vapedRows.map((r) => r.day));
  const counts = (day) => active.has(day) && !vaped.has(day);

  // Current run: walk back from today (or from yesterday, if today has no check-in yet).
  let current = 0;
  let runStart = null;
  if (!vaped.has(today)) {
    let day = active.has(today) ? today : addDays(today, -1);
    while (counts(day)) {
      current++;
      runStart = day;
      day = addDays(day, -1);
    }
  }

  // Longest run ever. Gems key off this, so it must never go down — but the
  // history can shrink it (a vape logged after today's check-in drops today from
  // the run; deleting a craving can empty a past day). So keep a high-water mark.
  let best = 0, run = 0, prev = null;
  for (const day of [...active].sort()) {
    if (!counts(day)) run = 0;
    else run = run > 0 && addDays(prev, 1) === day ? run + 1 : 1;
    prev = day;
    if (run > best) best = run;
  }
  if (best > u.best_streak) {
    await query("UPDATE users SET best_streak = $1 WHERE id = $2 AND best_streak < $1", [best, userId]);
  }
  best = Math.max(best, u.best_streak);

  const lastVapedAt = u.last_vaped_at ? new Date(u.last_vaped_at) : null;
  const { since, restarted } = vapeFreeStart(u.quit_date, lastVapedAt);
  const vapeFreeDays = since ? Math.max(0, Math.floor((Date.now() - since.getTime()) / DAY_MS)) : 0;

  // Hasn't quit yet (quit date still ahead): whole days until it, for a "getting ready" state.
  const quitAt = u.quit_date ? new Date(u.quit_date).getTime() : null;
  const quitInDays = quitAt && quitAt > Date.now() ? Math.ceil((quitAt - Date.now()) / DAY_MS) : 0;

  return {
    timezone: STUDY_TZ,
    today,
    quitInDays,
    current,
    best,
    runStart,
    checkedInToday: active.has(today),
    vapedToday: vaped.has(today),
    vapeFreeDays,
    vapeFreeSince: since ? since.toISOString() : null,
    restartedBySlip: restarted,
    lastVapedAt: lastVapedAt ? lastVapedAt.toISOString() : null,
  };
}
