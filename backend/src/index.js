import express from "express";
import cors from "cors";
import { initDb } from "./db.js";

import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import milestonesRoutes from "./routes/milestones.routes.js";
import savingsRoutes from "./routes/savings.routes.js";
import cravingsRoutes from "./routes/cravings.routes.js";
import reflectionsRoutes from "./routes/reflections.routes.js";

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
