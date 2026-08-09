import { Router } from "express";
import { requireAuth } from "../auth.js";
import { getPublicKey, saveSubscription, removeSubscription, sendToUser } from "../push.js";

const router = Router();

router.get("/vapid-public-key", (_req, res) => {
  res.json({ key: getPublicKey() });
});

router.post("/subscribe", requireAuth, async (req, res) => {
  const { subscription } = req.body || {};
  if (!subscription?.endpoint) return res.status(400).json({ error: "subscription required" });
  await saveSubscription(req.user.id, subscription);
  res.status(201).json({ ok: true });
});

router.post("/unsubscribe", requireAuth, async (req, res) => {
  const { endpoint } = req.body || {};
  if (endpoint) await removeSubscription(endpoint);
  res.json({ ok: true });
});

// Send a test push to this user's devices (used right after opt-in to confirm it works).
router.post("/test", requireAuth, async (req, res) => {
  const n = await sendToUser(req.user.id, {
    title: "ClearAir notifications on 🔔",
    body: "We'll cheer you on morning and night. You've got this.",
  });
  res.json({ ok: true, sent: n });
});

export default router;
