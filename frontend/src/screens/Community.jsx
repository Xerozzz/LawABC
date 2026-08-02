import { useEffect, useState } from "react";
import { api } from "../api.js";

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Community() {
  const [reflections, setReflections] = useState([]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = () => api.getReflections().then(setReflections).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const post = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setError("");
    try {
      await api.postReflection(body.trim());
      setBody("");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Community 💬</h1>
        <p className="muted">Anonymous reflections from others on the same journey. You're not alone.</p>
      </div>

      <form className="card stack" onSubmit={post}>
        {error && <div className="error">{error}</div>}
        <textarea
          rows={3}
          maxLength={1000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share a reflection, a win, or a tough moment… (anonymous)"
        />
        <button type="submit" disabled={busy || !body.trim()}>
          {busy ? "Posting…" : "Share anonymously"}
        </button>
      </form>

      <div className="stack">
        {reflections.length === 0 && (
          <div className="card muted">No reflections yet. Be the first to share.</div>
        )}
        {reflections.map((r) => (
          <div key={r.id} className="card">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="badge">🫂 Anonymous</span>
              <span className="muted" style={{ fontSize: "0.75rem" }}>
                {r.milestone_label ? `${r.milestone_label} · ` : ""}{timeAgo(r.created_at)}
              </span>
            </div>
            <p style={{ margin: "0.6rem 0 0" }}>{r.body}</p>
            <button
              className="ghost"
              style={{ fontSize: "0.7rem", padding: "0.3rem 0.7rem", marginTop: "0.6rem" }}
              onClick={async () => {
                await api.reportReflection(r.id).catch(() => {});
                load();
              }}
              title="Report this reflection"
            >
              ⚐ Report
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
