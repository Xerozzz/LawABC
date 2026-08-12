import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import TreeGrowth from "../components/TreeGrowth.jsx";

export default function Home() {
  const { user } = useAuth();
  const [savings, setSavings] = useState(null);
  const [milestones, setMilestones] = useState(null);
  const [cravingStats, setCravingStats] = useState(null);

  useEffect(() => {
    api.getSavings().then(setSavings).catch(() => {});
    api.getMilestones().then(setMilestones).catch(() => {});
    api.getCravingStats().then(setCravingStats).catch(() => {});
  }, []);

  const days = savings?.daysQuit ?? 0;
  const timeline = milestones?.timeline || [];
  const achieved = timeline.filter((m) => m.achieved).length;
  const healPct = timeline.length ? Math.round((achieved / timeline.length) * 100) : 0;
  const next = timeline.find((m) => m.isNext);

  const name = user?.email ? user.email.split("@")[0].replace(/[^a-zA-Z]/g, "") : "";
  const greetName = name ? name.charAt(0).toUpperCase() + name.slice(1) : "there";

  return (
    <div className="stack">
      {/* greeting + streak */}
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="h1" style={{ margin: 0 }}>Hey {greetName}! 👋</h1>
          <p className="muted" style={{ margin: 0 }}>You've got this.</p>
        </div>
        <span className="streak">🔥 {days} day{days === 1 ? "" : "s"}</span>
      </div>

      {/* hero progress */}
      <div className="hero">
        <div style={{ fontWeight: 700, opacity: 0.85 }}>My Progress</div>
        <div className="muted" style={{ color: "#3d6a86", fontSize: "0.85rem", marginTop: "0.2rem" }}>Vape-free for</div>
        <div className="big">{days} <span style={{ fontSize: "1.1rem", fontWeight: 700 }}>day{days === 1 ? "" : "s"}</span></div>
        <TreeGrowth days={days} />
      </div>

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

      {/* health recovery */}
      <Link to="/timeline" className="card" style={{ textDecoration: "none", color: "inherit" }}>
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

      {/* next milestone */}
      {next && (
        <Link to="/timeline" className="card" style={{ textDecoration: "none", color: "inherit", background: "linear-gradient(135deg,#f3f0ff,#ffffff)" }}>
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

      {/* trigger map quick link */}
      <Link to="/triggers" className="card row" style={{ textDecoration: "none", color: "inherit", justifyContent: "space-between" }}>
        <div className="row" style={{ gap: "0.7rem" }}>
          <span className="metric-ico" style={{ backgroundColor: "#ffecec" }}>📍</span>
          <strong>Trigger map</strong>
        </div>
        <span className="muted">›</span>
      </Link>

      {/* rewards nudge */}
      <Link to="/shop" className="card row" style={{ textDecoration: "none", color: "inherit", justifyContent: "space-between" }}>
        <div className="row" style={{ gap: "0.7rem" }}>
          <span className="metric-ico" style={{ backgroundColor: "#fff4d9" }}>💎</span>
          <div>
            <strong>Gems &amp; rewards</strong>
            <div className="muted" style={{ fontSize: "0.8rem" }}>earn from streaks + beating cravings</div>
          </div>
        </div>
        <span className="muted">›</span>
      </Link>

      {/* need more support — reach the team behind the app or a helpline */}
      <Link to="/help" className="card" style={{ textDecoration: "none", color: "inherit", background: "linear-gradient(135deg,#e7f8f2,#ffffff)" }}>
        <div className="row" style={{ gap: "0.7rem" }}>
          <span className="metric-ico" style={{ background: "#d6f3e9" }}>🤝</span>
          <div>
            <strong>Need more support?</strong>
            <div className="muted" style={{ fontSize: "0.8rem" }}>
              Talk to the ClearAir team or a helpline — real humans, free and confidential.
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
