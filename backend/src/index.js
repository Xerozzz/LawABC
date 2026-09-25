import "./async-errors.js"; // before anything registers routes
import express from "express";
import cors from "cors";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { initDb } from "./db.js";
import { initPush } from "./push.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import milestonesRoutes from "./routes/milestones.routes.js";
import savingsRoutes from "./routes/savings.routes.js";
import cravingsRoutes from "./routes/cravings.routes.js";
import reflectionsRoutes from "./routes/reflections.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";
import eventsRoutes from "./routes/events.routes.js";
import rewardsRoutes from "./routes/rewards.routes.js";
import pushRoutes from "./routes/push.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import streakRoutes from "./routes/streak.routes.js";
import triggersRoutes from "./routes/triggers.routes.js";
import { FEATURES } from "./features.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "clearair-backend" });
});

// Which switchable features are on (see features.js). Public: the app needs it
// to lay out its tabs, and it holds nothing about any user.
app.get("/api/config", (_req, res) => {
  res.json({ features: FEATURES });
});

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/milestones", milestonesRoutes);
app.use("/api/savings", savingsRoutes);
app.use("/api/cravings", cravingsRoutes);
app.use("/api/reflections", reflectionsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/rewards", rewardsRoutes);
app.use("/api/push", pushRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/streak", streakRoutes);
app.use("/api/triggers", triggersRoutes);

// In production the built frontend is copied to ./public and served from the
// same origin as the API. The SPA fallback returns index.html for client routes
// (but never for /api/*, which is already handled above).
const publicDir = join(__dirname, "..", "public");
if (existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(join(publicDir, "index.html"));
  });
  console.log("Serving static frontend from ./public");
}

// Last stop for errors: bad JSON bodies, and failed async handlers (async-errors.js).
// Answer the one request instead of letting the error take the server down.
app.use((err, req, res, _next) => {
  const status = err.status >= 400 && err.status < 500 ? err.status : 500;
  if (status === 500) console.error(`${req.method} ${req.originalUrl} failed:`, err);
  if (res.headersSent) return;
  res.status(status).json({ error: status === 500 ? "Something went wrong. Please try again." : "Bad request" });
});

// Start only after the DB is ready (schema + seed applied).
async function start() {
  try {
    await initDb();
    await initPush();
    app.listen(PORT, () => {
      console.log(`ClearAir backend listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  }
}

start();
