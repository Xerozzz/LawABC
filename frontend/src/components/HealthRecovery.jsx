import { useEffect, useState } from "react";
import { api } from "../api.js";
import Icon from "./Icon.jsx";

export default function HealthRecovery() {
  const [data, setData] = useState(null);
  useEffect(() => { api.getMilestones().then(setData).catch(() => {}); }, []);
  if (!data) return null;

  const timeline = data.timeline || [];
  const next = timeline.find((m) => m.isNext);
  const reached = timeline.filter((m) => m.achieved);
  const behind = [...reached].reverse(); // most recent first
  const upcoming = timeline.find((m) => !m.achieved && !m.isNext);
  const latest = behind.find((m) => m.affirmation);

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h2 className="h1" style={{ fontSize: "1.35rem", margin: 0 }}>Health recovery</h2>
        <span style={{ color: "var(--brand)", fontWeight: 700, fontSize: "0.9rem" }}>{reached.length} of {timeline.length} reached</span>
      </div>
      {data.startsAt && (
        <p className="muted" style={{ margin: "-0.4rem 0 0", fontSize: "0.85rem" }}>
          Your recovery starts on your quit day, {new Date(data.startsAt).toLocaleDateString()}. Here's what comes first.
        </p>
      )}
      {/* for the first week after a logged slip */}
      {data.restartedAt && data.minutesQuit < 7 * 24 * 60 && (
        <p className="muted" style={{ margin: "-0.4rem 0 0", fontSize: "0.85rem" }}>
          Counting again from your last slip. Your body starts recovering straight away.
        </p>
      )}

      {/* affirmation for the latest win */}
      {latest && (
        <div className="card row" style={{ gap: "0.7rem", alignItems: "flex-start", background: "#e7f8f2", border: "1px solid #bfe9db" }}>
          <span className="ico-chip" style={{ background: "#fff", color: "var(--brand)" }}><Icon name="heart" size={18} /></span>
          <div>
            <strong style={{ display: "block", color: "#0b6b62", fontSize: "1.02rem", lineHeight: 1.35 }}>{latest.affirmation}</strong>
            <div style={{ color: "#3d7d74", fontSize: "0.8rem", marginTop: "0.25rem" }}>Latest win · {latest.title} · {latest.timeLabel}</div>
          </div>
        </div>
      )}

      {/* happening now */}
      {next && (
        <div style={{ background: "#12212e", color: "#fff", borderRadius: "var(--radius)", padding: "1.2rem" }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span style={{ background: "rgba(139,123,240,0.25)", color: "#c7bdff", fontWeight: 700, fontSize: "0.72rem", padding: "0.25rem 0.6rem", borderRadius: 999 }}>{data.startsAt ? "First up" : "Happening now"}</span>
            <span style={{ color: "#93a4b3", fontSize: "0.85rem" }}>{next.timeLabel}</span>
          </div>
          <h3 style={{ margin: "0.7rem 0 0.4rem", fontSize: "1.35rem", fontWeight: 700, letterSpacing: "-0.02em" }}>{next.title}</h3>
          <p style={{ margin: 0, color: "#c2cdd7", fontSize: "0.92rem", lineHeight: 1.5 }}>{next.description}</p>
          <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,0.14)", overflow: "hidden", marginTop: "1rem" }}>
            <span style={{ display: "block", height: "100%", width: `${Math.round(next.progress * 100)}%`, background: "#8b7bf0", borderRadius: 999 }} />
          </div>
          <div style={{ color: "#93a4b3", fontSize: "0.8rem", marginTop: "0.5rem" }}>{Math.round(next.progress * 100)}% there</div>
        </div>
      )}

      {/* already behind you */}
      {behind.length > 0 && (
        <div className="card">
          <div className="muted" style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.02em", textTransform: "uppercase", marginBottom: "0.6rem" }}>Already behind you</div>
          <div>
            {behind.map((m, i) => (
              <div key={m.id} className="row" style={{ justifyContent: "space-between", padding: "0.7rem 0", borderTop: i ? "1px solid var(--border)" : "none" }}>
                <span className="row" style={{ gap: "0.6rem", alignItems: "flex-start" }}>
                  <span style={{ width: 26, height: 26, borderRadius: "50%", background: "#e5f7f0", color: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}><Icon name="check" size={15} /></span>
                  <span>
                    <strong style={{ fontSize: "0.95rem" }}>{m.title}</strong>
                    {m.affirmation && m.id !== latest?.id && <span className="muted" style={{ display: "block", fontSize: "0.8rem", lineHeight: 1.35 }}>{m.affirmation}</span>}
                  </span>
                </span>
                <span className="muted" style={{ fontSize: "0.8rem", textAlign: "right", flex: "0 0 auto", maxWidth: 90 }}>{m.timeLabel}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* still to come */}
      {upcoming && (
        <div className="card row" style={{ gap: "0.7rem", borderStyle: "dashed" }}>
          <span style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--surface-2)", color: "var(--text-dim)", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}><Icon name="heart" size={17} /></span>
          <div>
            <div className="muted" style={{ fontSize: "0.78rem" }}>Still to come · {upcoming.timeLabel}</div>
            <strong>{upcoming.title}</strong>
          </div>
        </div>
      )}

      <p className="muted" style={{ fontSize: "0.78rem", margin: 0 }}>
        Some milestones are inferred from nicotine and smoking research; vaping-specific data is still emerging.
      </p>
    </div>
  );
}
