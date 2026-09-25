import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../auth.js";
import { vapeFreeSpan } from "../streak.js";

const router = Router();

// Returns the milestone timeline annotated with the user's progress. These are
// "time since nicotine" milestones, so they count from the current vape-free
// stretch: the quit date, or the last logged vape (streak.js).
router.get("/", requireAuth, async (req, res) => {
  const [span, { rows: milestones }] = await Promise.all([
    vapeFreeSpan(req.user.id),
    query("SELECT * FROM health_milestones ORDER BY sort_order ASC"),
  ]);

  const since = span?.since;
  const minutesQuit = since ? Math.max(0, (Date.now() - since.getTime()) / 60000) : 0;

  let nextFound = false;
  const timeline = milestones.map((m) => {
    const achieved = minutesQuit >= Number(m.minutes_after_quit);
    // The first not-yet-achieved milestone gets a progress fraction.
    let progress = achieved ? 1 : 0;
    let isNext = false;
    if (!achieved && !nextFound) {
      nextFound = true;
      isNext = true;
      progress = Number(m.minutes_after_quit)
        ? Math.min(0.99, minutesQuit / Number(m.minutes_after_quit))
        : 0;
    }
    return {
      id: m.id,
      timeLabel: m.time_label,
      title: m.title,
      description: m.description,
      source: m.source_citation,
      inferred: m.inferred,
      affirmation: m.affirmation,
      achieved,
      isNext,
      progress: Number(progress.toFixed(3)),
    };
  });

  res.json({
    minutesQuit: Math.floor(minutesQuit),
    // set when a logged vape restarted the count (the UI says so, kindly)
    restartedAt: span?.restarted ? since.toISOString() : null,
    // set while the quit date is still ahead: the timeline starts then
    startsAt: since && since.getTime() > Date.now() ? since.toISOString() : null,
    timeline,
  });
});

export default router;
