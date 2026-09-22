import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import TreeGrowth from "../components/TreeGrowth.jsx";
import MetricBubbles from "../components/MetricBubbles.jsx";
import SupportedBy from "../components/SupportedBy.jsx";

export default function Home() {
  const { user } = useAuth();
  const [savings, setSavings] = useState(null);

  useEffect(() => {
    api.getSavings().then(setSavings).catch(() => {});
  }, []);

  const days = savings?.daysQuit ?? 0;

  const emailName = user?.email ? user.email.split("@")[0].replace(/[^a-zA-Z]/g, "") : "";
  const fallback = emailName ? emailName.charAt(0).toUpperCase() + emailName.slice(1) : "there";
  const greetName = user?.nickname || fallback;

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

      {/* the 4 progress bubbles (Cravings, Health, Next Milestone, Money) */}
      <MetricBubbles />

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

      {/* need more support */}
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

      {/* quiet supporter footer */}
      <SupportedBy compact />
    </div>
  );
}
