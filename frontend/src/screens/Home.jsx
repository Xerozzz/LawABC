import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

export default function Home() {
  const { user } = useAuth();
  const [savings, setSavings] = useState(null);
  const [stats, setStats] = useState(null);
  const [nextMilestone, setNextMilestone] = useState(null);

  useEffect(() => {
    api.getSavings().then(setSavings).catch(() => {});
    api.getCravingStats().then(setStats).catch(() => {});
    api.getMilestones().then((d) => {
      setNextMilestone(d.timeline.find((m) => m.isNext) || null);
    }).catch(() => {});
  }, []);

  const daysQuit = savings?.daysQuit ?? 0;

  return (
    <div className="stack">
      <div>
        <p className="muted" style={{ margin: 0 }}>Welcome back 👋</p>
        <h1 className="h1">You've got this.</h1>
      </div>

      <div className="card" style={{ textAlign: "center" }}>
        <div className="stat" style={{ color: "var(--brand)" }}>{daysQuit}</div>
        <div className="stat-label">day{daysQuit === 1 ? "" : "s"} vape-free</div>
      </div>

      <div className="row" style={{ gap: "1rem" }}>
        <Link to="/savings" className="card" style={{ flex: 1, textDecoration: "none", color: "inherit" }}>
          <div className="stat" style={{ fontSize: "1.6rem", color: "var(--accent)" }}>
            ${savings ? savings.saved.toFixed(2) : "0.00"}
          </div>
          <div className="stat-label">saved so far</div>
        </Link>
        <Link to="/community" className="card" style={{ flex: 1, textDecoration: "none", color: "inherit" }}>
          <div className="stat" style={{ fontSize: "1.6rem" }}>
            {stats ? stats.passed : 0}
          </div>
          <div className="stat-label">cravings beaten</div>
        </Link>
      </div>

      {nextMilestone && (
        <Link to="/timeline" className="card" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="badge">Next health milestone</div>
          <h3 style={{ margin: "0.5rem 0 0.3rem" }}>{nextMilestone.title}</h3>
          <p className="muted" style={{ margin: "0 0 0.6rem" }}>{nextMilestone.timeLabel} · {nextMilestone.description}</p>
          <div className="progress"><span style={{ width: `${nextMilestone.progress * 100}%` }} /></div>
        </Link>
      )}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Feeling the urge?</h3>
        <p className="muted">A craving lasts only a few minutes. Ride it out with a 60-second reset.</p>
        <Link to="/sos"><button style={{ width: "100%" }}>🆘 Start Craving SOS</button></Link>
      </div>
    </div>
  );
}
