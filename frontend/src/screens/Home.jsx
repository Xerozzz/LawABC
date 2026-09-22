import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import TreeGrowth from "../components/TreeGrowth.jsx";
import SupportedBy from "../components/SupportedBy.jsx";
import Icon from "../components/Icon.jsx";

const BADGES = [1, 7, 14, 30, 60, 100, 180, 365];
const DOW = ["S", "M", "T", "W", "T", "F", "S"];
const dowOf = (ymd) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return DOW[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
};

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [savings, setSavings] = useState(null);
  const [milestones, setMilestones] = useState(null);
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState(null);
  const [mood, setMood] = useState(null);

  useEffect(() => {
    api.getSavings().then(setSavings).catch(() => {});
    api.getMilestones().then(setMilestones).catch(() => {});
    api.getCravingStats().then(setStats).catch(() => {});
    api.getActivity().then(setActivity).catch(() => {});
  }, []);

  const days = savings?.daysQuit ?? 0;
  const timeline = milestones?.timeline || [];
  const achieved = timeline.filter((m) => m.achieved).length;
  const healPct = timeline.length ? Math.round((achieved / timeline.length) * 100) : 0;

  const emailName = user?.email ? user.email.split("@")[0].replace(/[^a-zA-Z]/g, "") : "";
  const fallback = emailName ? emailName.charAt(0).toUpperCase() + emailName.slice(1) : "there";
  const name = user?.nickname || fallback;

  // Next day-badge + ring progress toward it
  const nextBadge = BADGES.find((b) => b > days) || days + 30;
  const toBadge = Math.max(0, nextBadge - days);
  const ringPct = Math.min(1, days / nextBadge);

  // "This week" — the 7 days ending today, from the check-in data
  const allDays = activity?.days || [];
  const ti = allDays.findIndex((d) => d.isToday);
  const week = ti >= 0 ? allDays.slice(Math.max(0, ti - 6), ti + 1) : allDays.slice(0, 7);
  const activeThisWeek = week.filter((d) => d.active).length;

  const checkIn = (m) => {
    if (m === "craving") { navigate("/sos"); return; }
    setMood(m);
    api.logEvent("daily_checkin", { mood: m });
  };

  const R = 82, C = 2 * Math.PI * R;

  return (
    <div className="stack">
      {/* greeting */}
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="h1" style={{ margin: 0, fontSize: "1.7rem" }}>Hey {name}</h1>
          <p className="muted" style={{ margin: "0.15rem 0 0" }}>Day {days}. Your body is catching up.</p>
        </div>
        <span className="streak"><Icon name="flame" size={15} style={{ color: "#ff7a3d" }} /> {days}</span>
      </div>

      {/* hero: progress ring + tree */}
      <div className="hero" style={{ padding: "1.5rem 1.25rem 1.6rem", textAlign: "center" }}>
        <div style={{ position: "relative", width: 200, height: 200, margin: "0 auto 0.5rem" }}>
          <svg viewBox="0 0 200 200" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
            <circle cx="100" cy="100" r={R} fill="none" stroke="#ffffff" strokeWidth="12" opacity="0.7" />
            <circle cx="100" cy="100" r={R} fill="none" stroke="var(--brand)" strokeWidth="12"
              strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - ringPct)}
              style={{ transition: "stroke-dashoffset 0.8s ease" }} />
          </svg>
          <div style={{ position: "absolute", inset: 26, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <TreeGrowth days={days} />
          </div>
        </div>
        <div className="big" style={{ marginTop: "0.4rem" }}>{days} <span style={{ fontSize: "1.05rem", fontWeight: 600 }}>days</span></div>
        <p style={{ margin: "0.35rem 0 0.9rem", color: "#3d6a86" }}>vape-free, and your tree keeps growing</p>
        <span className="badge-pill"><Icon name="award" size={16} style={{ color: "var(--brand)" }} /> {toBadge} more days to your {nextBadge}-day badge</span>
      </div>

      {/* this week */}
      {week.length > 0 && (
        <div className="card">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <strong>This week</strong>
            <span className="muted" style={{ fontSize: "0.82rem" }}>{activeThisWeek} of {week.length} days active</span>
          </div>
          <div className="week" style={{ marginTop: "0.8rem" }}>
            {week.map((d) => (
              <div className="cell" key={d.date}>
                <span className="dow">{dowOf(d.date)}</span>
                <span className={"dot " + (d.active ? "active" : d.isToday ? "now" : d.opened ? "opened" : "")}>
                  {d.active ? <Icon name="check" size={16} /> : d.isToday ? "Now" : d.date.slice(8, 10)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* daily check-in */}
      <div className="card">
        <strong>How is today going?</strong>
        <p className="muted" style={{ margin: "0.2rem 0 0.8rem", fontSize: "0.85rem" }}>
          {mood ? "Logged — thanks for checking in." : "One tap keeps your check-in streak alive."}
        </p>
        <div className="mood-row">
          <button className={"mood-btn good" + (mood === "good" ? " selected" : "")} onClick={() => checkIn("good")}>Feeling good</button>
          <button className={"mood-btn" + (mood === "ok" ? " selected" : "")} onClick={() => checkIn("ok")}>Getting by</button>
          <button className="mood-btn craving" onClick={() => checkIn("craving")}>Craving</button>
        </div>
      </div>

      {/* stat tiles */}
      <div className="tiles">
        <div className="tile">
          <span className="ico-chip" style={{ background: "#fdeaea", color: "var(--danger)" }}><Icon name="shield" size={18} /></span>
          <div className="num">{stats?.beaten ?? 0}</div>
          <div className="lbl">cravings beaten</div>
        </div>
        <Link to="/health" className="tile" style={{ textDecoration: "none", color: "inherit" }}>
          <span className="ico-chip" style={{ background: "#e5f7f0", color: "var(--brand)" }}><Icon name="heart" size={18} /></span>
          <div className="num">{healPct}%</div>
          <div className="lbl">health recovered</div>
        </Link>
        <Link to="/savings" className="tile" style={{ textDecoration: "none", color: "inherit" }}>
          <span className="ico-chip" style={{ background: "#fdf1d6", color: "#b7791f" }}><Icon name="dollar" size={18} /></span>
          <div className="num">${savings ? Math.round(savings.saved) : 0}</div>
          <div className="lbl">saved so far</div>
        </Link>
      </div>

      {/* savings goal */}
      {savings?.goalLabel && savings?.goalAmount ? (
        <div className="card">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <div className="row" style={{ gap: "0.7rem" }}>
              <span className="ico-chip" style={{ background: "#fdf1d6", color: "#b7791f" }}><Icon name="gift" size={18} /></span>
              <div>
                <div className="muted" style={{ fontSize: "0.75rem", color: "#b7791f", fontWeight: 700 }}>
                  {savings.goalProgress >= 1 ? "Savings goal reached" : "Saving towards"}
                </div>
                <strong>{savings.goalLabel}</strong>
              </div>
            </div>
            <strong style={{ color: "#b7791f" }}>${savings.goalAmount.toFixed(2)}</strong>
          </div>
          <div className="progress" style={{ marginTop: "0.8rem" }}>
            <span style={{ width: `${Math.round((savings.goalProgress || 0) * 100)}%`, background: "linear-gradient(90deg,#ffb703,#ffcf4d)" }} />
          </div>
          {savings.goalProgress >= 1 && (
            <button className="cta-dark" style={{ marginTop: "0.9rem" }} onClick={() => navigate("/profile")}>
              Treat yourself, then set a new goal
            </button>
          )}
        </div>
      ) : (
        <Link to="/profile" className="card row" style={{ justifyContent: "space-between", textDecoration: "none", color: "inherit" }}>
          <div className="row" style={{ gap: "0.7rem" }}>
            <span className="ico-chip" style={{ background: "#fdf1d6", color: "#b7791f" }}><Icon name="gift" size={18} /></span>
            <div>
              <strong>Set a savings goal</strong>
              <div className="muted" style={{ fontSize: "0.8rem" }}>Something to work towards</div>
            </div>
          </div>
          <span className="muted">›</span>
        </Link>
      )}

      {/* trigger map (kept reachable) */}
      <Link to="/triggers" className="card row" style={{ justifyContent: "space-between", textDecoration: "none", color: "inherit" }}>
        <div className="row" style={{ gap: "0.7rem" }}>
          <span className="ico-chip" style={{ background: "#eef1f5", color: "var(--text-dim)" }}><Icon name="map" size={18} /></span>
          <strong>Trigger map</strong>
        </div>
        <span className="muted">›</span>
      </Link>

      <SupportedBy compact />
    </div>
  );
}
