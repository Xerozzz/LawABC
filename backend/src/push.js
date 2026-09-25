import webpush from "web-push";
import { query } from "./db.js";

let ready = false;
let publicKey = null;

// Load VAPID keys from app_meta, or generate + persist them on first run.
// (Persisting keeps existing push subscriptions valid across restarts.)
export async function initPush() {
  const { rows } = await query(
    "SELECT key, value FROM app_meta WHERE key IN ('vapid_public', 'vapid_private')"
  );
  let pub = rows.find((r) => r.key === "vapid_public")?.value;
  let priv = rows.find((r) => r.key === "vapid_private")?.value;

  if (!pub || !priv) {
    const keys = webpush.generateVAPIDKeys();
    pub = keys.publicKey;
    priv = keys.privateKey;
    for (const [k, v] of [["vapid_public", pub], ["vapid_private", priv]]) {
      await query(
        "INSERT INTO app_meta (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
        [k, v]
      );
    }
    console.log("Generated VAPID keys for Web Push.");
  }

  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@clearair.app", pub, priv);
  publicKey = pub;
  ready = true;
  startScheduler();
}

export const getPublicKey = () => publicKey;

export async function saveSubscription(userId, sub) {
  await query(
    `INSERT INTO push_subscriptions (endpoint, user_id, subscription)
     VALUES ($1, $2, $3)
     ON CONFLICT (endpoint) DO UPDATE SET user_id = EXCLUDED.user_id, subscription = EXCLUDED.subscription`,
    [sub.endpoint, userId, sub]
  );
}

export async function removeSubscription(endpoint) {
  await query("DELETE FROM push_subscriptions WHERE endpoint = $1", [endpoint]);
}

// Send a payload to a set of subscription rows; prune dead ones.
async function sendTo(rows, payload) {
  if (!ready) return 0;
  let sent = 0;
  for (const r of rows) {
    try {
      await webpush.sendNotification(r.subscription, JSON.stringify(payload));
      sent++;
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) await removeSubscription(r.endpoint);
    }
  }
  return sent;
}

export async function sendToUser(userId, payload) {
  const { rows } = await query("SELECT endpoint, subscription FROM push_subscriptions WHERE user_id = $1", [userId]);
  return sendTo(rows, payload);
}

async function sendToAll(payload) {
  const { rows } = await query("SELECT endpoint, subscription FROM push_subscriptions");
  return sendTo(rows, payload);
}

// Daily rhythm. Times are in the server's timezone — set TZ (e.g. Asia/Singapore).
const SLOTS = [
  { hour: 9, key: "push_sent_morning", title: "Good morning 🌱", body: "A fresh day ahead. You've got this." },
  { hour: 20, key: "push_sent_evening", title: "Evening check-in 🌙", body: "How did today go? One tap keeps your streak going." },
];

function startScheduler() {
  setInterval(async () => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    for (const slot of SLOTS) {
      if (now.getHours() !== slot.hour) continue;
      const { rows } = await query("SELECT value FROM app_meta WHERE key = $1", [slot.key]);
      if (rows[0]?.value === today) continue; // already sent this slot today
      await query(
        "INSERT INTO app_meta (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
        [slot.key, today]
      );
      const n = await sendToAll({ title: slot.title, body: slot.body });
      console.log(`Sent ${slot.key} push to ${n} subscriptions.`);
    }
  }, 60000);
}
