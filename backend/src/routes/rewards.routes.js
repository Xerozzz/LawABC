import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../auth.js";
import { CATALOG, FREE_KEYS, byKey, STREAK_GEMS } from "../rewards.catalog.js";
import { getStreak } from "../streak.js";

const router = Router();

// Gems earned = streak milestones + engagement (cravings beaten, reflections).
// Streak gems use the BEST check-in streak ever (streak.js), not the current
// one, so a slip resets the streak without taking back gems already earned —
// and never less than what the old days-since-quit rule had already given
// (legacy_streak_gems, set once on upgrade by db.js).
async function computeEarned(userId) {
  const [streak, { rows: u }, { rows: cr }, { rows: re }] = await Promise.all([
    getStreak(userId),
    query("SELECT legacy_streak_gems FROM users WHERE id = $1", [userId]),
    query("SELECT COUNT(*) FILTER (WHERE outcome <> 'vaped')::int AS beaten FROM craving_events WHERE user_id = $1", [userId]),
    query("SELECT COUNT(*)::int AS n FROM reflections WHERE user_id = $1", [userId]),
  ]);
  const bestStreak = streak?.best ?? 0;
  const legacyStreakGems = u[0]?.legacy_streak_gems ?? 0;
  let fromStreak = 0;
  for (const s of STREAK_GEMS) if (bestStreak >= s.days) fromStreak += s.gems;
  const streaks = Math.max(legacyStreakGems, fromStreak);
  const cravings = cr[0].beaten * 2;
  const reflections = re[0].n * 3;
  return {
    total: streaks + cravings + reflections,
    breakdown: { streaks, cravings, reflections, beaten: cr[0].beaten, posts: re[0].n, bestStreak, legacyStreakGems },
  };
}

async function ownedKeys(userId) {
  const { rows } = await query("SELECT item_key FROM unlocks WHERE user_id = $1", [userId]);
  return new Set([...FREE_KEYS, ...rows.map((r) => r.item_key)]);
}

const spentOf = (owned) =>
  [...owned].reduce((sum, k) => sum + (byKey(k)?.cost > 0 ? byKey(k).cost : 0), 0);

router.get("/", requireAuth, async (req, res) => {
  const [earned, owned, { rows: me }] = await Promise.all([
    computeEarned(req.user.id),
    ownedKeys(req.user.id),
    query("SELECT avatar, theme FROM users WHERE id = $1", [req.user.id]),
  ]);
  const spent = spentOf(owned);
  res.json({
    earned: earned.total,
    breakdown: earned.breakdown,
    spent,
    balance: earned.total - spent,
    avatar: me[0].avatar,
    theme: me[0].theme,
    catalog: CATALOG.map((i) => ({ ...i, owned: owned.has(i.key) })),
  });
});

router.post("/unlock", requireAuth, async (req, res) => {
  const item = byKey(req.body?.itemKey);
  if (!item) return res.status(400).json({ error: "Unknown item" });
  const owned = await ownedKeys(req.user.id);
  if (owned.has(item.key)) return res.json({ ok: true, already: true });
  const earned = await computeEarned(req.user.id);
  if (earned.total - spentOf(owned) < item.cost) {
    return res.status(400).json({ error: "Not enough gems yet — keep going!" });
  }
  await query("INSERT INTO unlocks (user_id, item_key) VALUES ($1, $2) ON CONFLICT DO NOTHING", [req.user.id, item.key]);
  res.json({ ok: true });
});

router.post("/select", requireAuth, async (req, res) => {
  const item = byKey(req.body?.itemKey);
  if (!item) return res.status(400).json({ error: "Unknown item" });
  const owned = await ownedKeys(req.user.id);
  if (!owned.has(item.key)) return res.status(400).json({ error: "Not unlocked" });
  if (item.type === "avatar") {
    await query("UPDATE users SET avatar = $1 WHERE id = $2", [item.emoji, req.user.id]);
  } else {
    await query("UPDATE users SET theme = $1 WHERE id = $2", [item.key, req.user.id]);
  }
  res.json({ ok: true });
});

export default router;
