import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function Savings() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getSavings().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <p className="muted">Loading…</p>;

  const pct = data.goalProgress != null ? Math.round(data.goalProgress * 100) : null;

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Your savings 💰</h1>
        <p className="muted">Every day not vaping puts money back in your pocket.</p>
      </div>

      <div className="card" style={{ textAlign: "center" }}>
        <div className="stat" style={{ color: "var(--accent)" }}>${data.saved.toFixed(2)}</div>
        <div className="stat-label">saved over {data.daysQuit} day{data.daysQuit === 1 ? "" : "s"}</div>
      </div>

      {data.goalLabel && data.goalAmount ? (
        <div className="card">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <strong>{data.goalLabel}</strong>
            <span className="muted">${data.saved.toFixed(0)} / ${data.goalAmount.toFixed(0)}</span>
          </div>
          <div className="progress" style={{ marginTop: "0.7rem" }}>
            <span style={{ width: `${pct}%` }} />
          </div>
          <p className="muted" style={{ margin: "0.6rem 0 0" }}>
            {pct >= 100 ? "🎉 Goal reached — treat yourself!" : `${pct}% of the way there`}
          </p>
        </div>
      ) : (
        <div className="card muted">
          Set a savings goal in your profile to track progress toward a reward.
        </div>
      )}

      <div className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className="muted">Weekly spend avoided</span>
          <strong>${data.weeklySpend.toFixed(2)}</strong>
        </div>
        <div className="row" style={{ justifyContent: "space-between", marginTop: "0.5rem" }}>
          <span className="muted">Projected yearly saving</span>
          <strong>${(data.weeklySpend * 52).toFixed(0)}</strong>
        </div>
      </div>
    </div>
  );
}
