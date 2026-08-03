import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function Timeline() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getMilestones().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <p className="muted">Loading your timeline…</p>;

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Health recovery ❤️‍🩹</h1>
        <p className="muted">See what your body wins back, milestone by milestone.</p>
      </div>

      <div style={{ position: "relative", paddingLeft: "1.5rem" }}>
        {/* vertical spine */}
        <div style={{
          position: "absolute", left: "0.45rem", top: "0.5rem", bottom: "0.5rem",
          width: 2, background: "var(--border)",
        }} />

        <div className="stack">
          {data.timeline.map((m) => (
            <div key={m.id} style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: "-1.32rem", top: "1.1rem",
                width: 14, height: 14, borderRadius: "50%",
                background: m.achieved ? "var(--brand)" : m.isNext ? "var(--accent)" : "var(--surface-2)",
                border: "2px solid var(--bg)",
              }} />
              <div className="card" style={{ opacity: m.achieved || m.isNext ? 1 : 0.6 }}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <span className="badge">{m.timeLabel}</span>
                  {m.achieved && <span className="badge" style={{ color: "var(--brand)" }}>✓ reached</span>}
                  {m.isNext && <span className="badge" style={{ color: "var(--accent)" }}>up next</span>}
                </div>
                <h3 style={{ margin: "0.5rem 0 0.3rem" }}>{m.title}</h3>
                <p className="muted" style={{ margin: 0 }}>{m.description}</p>
                {m.inferred && (
                  <p className="muted" style={{ margin: "0.4rem 0 0", fontSize: "0.68rem", fontStyle: "italic" }}>
                    ⓘ Inferred from nicotine/smoking research — vaping-specific data is still emerging.
                  </p>
                )}
                {m.isNext && (
                  <div className="progress" style={{ marginTop: "0.7rem" }}>
                    <span style={{ width: `${m.progress * 100}%` }} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="muted" style={{ fontSize: "0.72rem" }}>
        Sources: Truth Initiative, Cleveland Clinic, Smokefree.gov (NCI) and related nicotine-cessation
        research. Items marked ⓘ are inferred from smoking/nicotine studies where vaping-specific data
        is still limited. Not medical advice.
      </p>
    </div>
  );
}
