import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

// The four progress "bubbles" — reused on Home and the Progress tab.
// Order keeps Next Milestone directly under Health Recovery.
export default function MetricBubbles() {
  const [savings, setSavings] = useState(null);
  const [milestones, setMilestones] = useState(null);
  const [cravingStats, setCravingStats] = useState(null);

  useEffect(() => {
    api.getSavings().then(setSavings).catch(() => {});
    api.getMilestones().then(setMilestones).catch(() => {});
    api.getCravingStats().then(setCravingStats).catch(() => {});
  }, []);

  const timeline = milestones?.timeline || [];
  const achieved = timeline.filter((m) => m.achieved).length;
  const healPct = timeline.length ? Math.round((achieved / timeline.length) * 100) : 0;
  const next = timeline.find((m) => m.isNext);

  return (
    <>
      {/* cravings beaten — "passed" and "held on" both count */}
      <div className="card row" style={{ justifyContent: "space-between" }}>
        <div className="row" style={{ gap: "0.7rem" }}>
          <span className="metric-ico" style={{ background: "#ffecec" }}>💪</span>
          <div>
            <strong>Cravings beaten</strong>
            <div className="muted" style={{ fontSize: "0.8rem" }}>holding on counts too</div>
          </div>
        </div>
        <strong style={{ color: "var(--danger)", fontSize: "1.3rem" }}>{cravingStats?.beaten ?? 0}</strong>
      </div>

      {/* health recovery — opens the full milestone page */}
      <Link to="/health" className="card" style={{ textDecoration: "none", color: "inherit" }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div className="row" style={{ gap: "0.7rem" }}>
            <span className="metric-ico" style={{ background: "#e7f8f2" }}>❤️</span>
            <div>
              <strong>Health Recovery</strong>
              <div className="muted" style={{ fontSize: "0.8rem" }}>See how your body is healing</div>
            </div>
          </div>
          <strong style={{ color: "var(--brand)" }}>{healPct}%</strong>
        </div>
        <div className="progress" style={{ marginTop: "0.8rem" }}><span style={{ width: `${healPct}%` }} /></div>
      </Link>

      {/* next milestone — directly below health recovery */}
      {next && (
        <Link to="/health" className="card" style={{ textDecoration: "none", color: "inherit", background: "linear-gradient(135deg,#f3f0ff,#ffffff)" }}>
          <div className="row" style={{ gap: "0.7rem" }}>
            <span className="metric-ico" style={{ background: "#ebe7ff" }}>🫁</span>
            <div>
              <div className="badge" style={{ color: "var(--purple)" }}>Next milestone</div>
              <strong style={{ display: "block", marginTop: "0.3rem" }}>{next.title}</strong>
              <div className="muted" style={{ fontSize: "0.8rem" }}>{next.timeLabel} · {Math.round(next.progress * 100)}% there</div>
            </div>
          </div>
        </Link>
      )}

      {/* money saved */}
      <Link to="/savings" className="card" style={{ textDecoration: "none", color: "inherit" }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div className="row" style={{ gap: "0.7rem" }}>
            <span className="metric-ico" style={{ background: "#fff4d9" }}>💰</span>
            <div>
              <strong>Money Saved</strong>
              <div className="muted" style={{ fontSize: "0.8rem" }}>
                {savings?.goalLabel ? `towards ${savings.goalLabel}` : "keep it up"}
              </div>
            </div>
          </div>
          <strong style={{ color: "var(--accent)" }}>${savings ? savings.saved.toFixed(2) : "0.00"}</strong>
        </div>
        {savings?.goalProgress != null && (
          <div className="progress" style={{ marginTop: "0.8rem" }}>
            <span style={{ width: `${Math.round(savings.goalProgress * 100)}%`, background: "linear-gradient(90deg,#ffb703,#ffcf4d)" }} />
          </div>
        )}
      </Link>
    </>
  );
}
