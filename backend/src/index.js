import express from "express";
import cors from "cors";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { initDb } from "./db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import milestonesRoutes from "./routes/milestones.routes.js";
import savingsRoutes from "./routes/savings.routes.js";
import cravingsRoutes from "./routes/cravings.routes.js";
import reflectionsRoutes from "./routes/reflections.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "clearair-backend" });
});

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/milestones", milestonesRoutes);
app.use("/api/savings", savingsRoutes);
app.use("/api/cravings", cravingsRoutes);
app.use("/api/reflections", reflectionsRoutes);
app.use("/api/notifications", notificationsRoutes);

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

// Start only after the DB is ready (schema + seed applied).
async function start() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`ClearAir backend listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  }
}

start();
