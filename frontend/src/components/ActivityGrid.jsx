import { useEffect, useState } from "react";
import { api } from "../api.js";

// Weekday initial for a 'YYYY-MM-DD' string, read in the study's timezone-free
// calendar terms (the server already cut the days for us).
const dow = (ymd) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return ["S", "M", "T", "W", "T", "F", "S"][new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
};
const dayOfMonth = (ymd) => Number(ymd.slice(8, 10));

function Cell({ day }) {
  const base = {
    aspectRatio: "1",
    borderRadius: 12,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.7rem",
    fontWeight: 700,
    border: "1px solid var(--border)",
    background: "var(--surface-2)",
    color: "var(--text-dim)",
  };

  if (day.active) {
    Object.assign(base, {
      background: "linear-gradient(160deg, var(--brand-2), var(--brand))",
      borderColor: "transparent",
      color: "#06231f",
      boxShadow: "0 4px 12px rgba(23,195,178,0.28)",
    });
  } else if (day.opened) {
    // opened the app but did nothing that counts — show it honestly
    Object.assign(base, { borderStyle: "dashed", borderColor: "var(--brand)", color: "var(--brand)" });
  } else if (day.isFuture) {
    Object.assign(base, { background: "transparent", borderStyle: "dashed", opacity: 0.5 });
  }

  if (day.isToday) {
    base.outline = "2px solid var(--accent)";
    base.outlineOffset = "2px";
  }

  const label = day.active
    ? `Day ${day.dayNumber}: ${day.actions} action${day.actions === 1 ? "" : "s"}`
    : day.opened
      ? `Day ${day.dayNumber}: opened the app, no activity logged`
      : day.isFuture
        ? `Day ${day.dayNumber}: still to come`
        : `Day ${day.dayNumber}: nothing logged`;

  return (
    <div style={base} title={label} aria-label={label}>
      <span style={{ opacity: 0.75, fontSize: "0.6rem" }}>{dow(day.date)}</span>
      <span style={{ fontSize: "0.9rem" }}>{day.active ? "✓" : dayOfMonth(day.date)}</span>
    </div>
  );
}

export default function ActivityGrid() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getActivity().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return null;              // never let the grid break the page
  if (!data) return <div className="card muted">Loading your check-in streak…</div>;

  const pct = Math.round((data.activeDays / data.totalDays) * 100);

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <strong>Your {data.totalDays}-day check-in 🗓️</strong>
          <p className="muted" style={{ margin: "0.25rem 0 0", fontSize: "0.82rem" }}>
            {data.complete
              ? "Your check-in window is complete — thank you!"
              : `Day ${data.dayNumber} of ${data.totalDays} · ${data.daysRemaining} to go`}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="stat" style={{ fontSize: "1.6rem", color: "var(--brand)" }}>
            {data.activeDays}/{data.totalDays}
          </div>
          <div className="stat-label">days active</div>
        </div>
      </div>

      <div className="progress" style={{ marginTop: "0.8rem" }}>
        <span style={{ width: `${pct}%` }} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "0.4rem",
          marginTop: "0.9rem",
        }}
      >
        {data.days.map((d) => <Cell key={d.date} day={d} />)}
      </div>

      <div className="row" style={{ gap: "0.9rem", marginTop: "0.8rem", flexWrap: "wrap", fontSize: "0.72rem" }}>
        <span className="row" style={{ gap: "0.35rem" }}>
          <i style={{ width: 12, height: 12, borderRadius: 4, background: "var(--brand)" }} /> active
        </span>
        <span className="row" style={{ gap: "0.35rem" }}>
          <i style={{ width: 12, height: 12, borderRadius: 4, border: "1px dashed var(--brand)" }} /> opened only
        </span>
        <span className="row" style={{ gap: "0.35rem" }}>
          <i style={{ width: 12, height: 12, borderRadius: 4, background: "var(--surface-2)", border: "1px solid var(--border)" }} /> missed
        </span>
      </div>

      <p className="muted" style={{ margin: "0.8rem 0 0", fontSize: "0.78rem" }}>
        A day counts once you actually do something — log a craving, use a Craving SOS tool,
        post in the community, or update your profile. Days run midnight to midnight
        ({data.timezone.replace("_", " ")}).
        {data.current > 1 && ` You're on a ${data.current}-day run 🔥`}
      </p>
    </div>
  );
}
