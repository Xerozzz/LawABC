import express from "express";
import cors from "cors";
import { query } from "./db.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "lawabc-backend" });
});

// Example DB-backed endpoint
app.get("/api/db-time", async (_req, res) => {
  try {
    const result = await query("SELECT NOW() AS now");
    res.json({ now: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
