// How regularly each participant uses the app, derived from /api/admin/participation.
// An "active" day is the study's qualified day: at least one deliberate action
// (anything but a bare screen view). See backend/src/activity.js.

export const REGULAR_RATE = 0.7; // active on at least 70% of their days so far
export const SOMETIMES_RATE = 0.3;
export const QUIET_DAYS = 3; // no active day in this many days -> "gone quiet"

export const daysBetween = (a, b) => {
  const p = (s) => { const [y, m, d] = s.split("-").map(Number); return Date.UTC(y, m - 1, d); };
  return Math.round((p(b) - p(a)) / 86400000);
};

export function participantStats(p, today) {
  const elapsed = p.days.filter((d) => d.date <= today);
  // Today still has time to count, so it only counts once it's active.
  const counted = elapsed.filter((d) => d.date < today || d.active);
  const activeDays = counted.filter((d) => d.active).length;
  const rate = counted.length ? activeDays / counted.length : null;

  const lastActive = [...p.days].reverse().find((d) => d.active && d.date <= today)?.date || null;
  const inWindow = !p.complete && p.startDate <= today;
  const quietFor = lastActive ? daysBetween(lastActive, today) : daysBetween(p.startDate, today) + 1;
  const goneQuiet = inWindow && quietFor >= QUIET_DAYS;

  let status;
  if (rate === null) status = { key: "new", label: "Just started" };
  else if (rate >= REGULAR_RATE) status = { key: "regular", label: "Regular" };
  else if (rate >= SOMETIMES_RATE) status = { key: "sometimes", label: "Some days" };
  else status = { key: "rarely", label: "Rarely" };

  return {
    dayNumber: Math.min(p.days.length, Math.max(1, daysBetween(p.startDate, today) + 1)),
    countedDays: counted.length,
    activeDays,
    rate,
    lastActive,
    inWindow,
    goneQuiet,
    status,
  };
}

// Participants active on each calendar date, next to how many were in their
// study window that day. Covers the cohort's whole span up to today.
export function dailyActive(participants, today, maxDays = 60) {
  if (!participants.length) return [];
  const first = participants.reduce((m, p) => (p.startDate < m ? p.startDate : m), today);
  const span = Math.min(maxDays, daysBetween(first, today) + 1);
  const rows = [];
  for (let i = span - 1; i >= 0; i--) {
    const date = shiftDate(today, -i);
    let enrolled = 0, active = 0;
    for (const p of participants) {
      if (date < p.startDate || date > p.endDate) continue;
      enrolled++;
      if (p.days.find((d) => d.date === date)?.active) active++;
    }
    rows.push({ date, enrolled, active });
  }
  return rows;
}

export function shiftDate(ymd, n) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) + n * 86400000).toISOString().slice(0, 10);
}

// "14 Sep" / "Tue 14 Sep" from a YYYY-MM-DD study date.
export function formatDay(ymd, { weekday = false } = {}) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    ...(weekday ? { weekday: "short" } : {}),
  });
}

export function lastActiveLabel(lastActive, today) {
  if (!lastActive) return "Never";
  const n = daysBetween(lastActive, today);
  if (n === 0) return "Today";
  if (n === 1) return "Yesterday";
  return `${n} days ago`;
}
