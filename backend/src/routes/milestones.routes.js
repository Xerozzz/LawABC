import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../auth.js";

const router = Router();

// Returns the milestone timeline annotated with the user's progress.
router.get("/", requireAuth, async (req, res) => {
  const [{ rows: users }, { rows: milestones }] = await Promise.all([
    query("SELECT quit_date FROM users WHERE id = $1", [req.user.id]),
    query("SELECT * FROM health_milestones ORDER BY sort_order ASC"),
  ]);

  const quitDate = users[0]?.quit_date;
  const minutesQuit = quitDate
    ? Math.max(0, (Date.now() - new Date(quitDate).getTime()) / 60000)
    : 0;

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
      achieved,
      isNext,
      progress: Number(progress.toFixed(3)),
    };
  });

  res.json({ minutesQuit: Math.floor(minutesQuit), timeline });
});

export default router;
