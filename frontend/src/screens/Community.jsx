import { useEffect, useState } from "react";
import { api } from "../api.js";
import Icon from "../components/Icon.jsx";

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const CHANNELS = [
  { key: "prompt", label: "Today's prompt" },
  { key: "general", label: "General" },
  { key: "sports", label: "Sports and jio" },
  { key: "events", label: "Events" },
  { key: "cravings", label: "Cravings" },
  { key: "wins", label: "Wins" },
  { key: "advice", label: "Advice" },
  { key: "vent", label: "Vent" },
];
const HINTS = {
  sports: "Jio people for a run, ball game or gym session — drop a time and place.",
  events: "Post community events and sign up together — going with someone makes it easier.",
};
const AVATAR_NAME = { "🌱": "Seedling", "🦊": "Fox", "🐢": "Turtle", "🌟": "Star", "🚀": "Rocket", "🐉": "Dragon" };
const AVATAR_BG = { "🌱": "#e5f7f0", "🦊": "#fde7dd", "🐢": "#e6f3ea", "🌟": "#fdf3d6", "🚀": "#e5eefb", "🐉": "#ece9fb" };

export default function Community() {
  const [active, setActive] = useState("prompt");
  const [prompt, setPrompt] = useState(null);
  const [reflections, setReflections] = useState([]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { api.getDailyPrompt().then(setPrompt).catch(() => {}); }, []);

  const load = () => {
    const params = active === "prompt" ? { promptId: prompt?.id } : { channel: active };
    return api.getReflections(params).then(setReflections).catch((e) => setError(e.message));
  };
  useEffect(() => { if (active !== "prompt" || prompt) load(); /* eslint-disable-next-line */ }, [active, prompt]);

  const post = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true); setError("");
    try {
      const opts = active === "prompt" ? { promptId: prompt?.id, channel: "general" } : { channel: active };
      await api.postReflection(body.trim(), opts);
      api.logEvent("reflection_posted", { channel: active });
      setBody("");
      await load();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const authorName = (r) => r.author_name || AVATAR_NAME[r.author_avatar] || "Anonymous";

  const composer = (
    <form onSubmit={post} className="stack" style={{ gap: "0.7rem" }}>
      <textarea rows={3} maxLength={1000} value={body} onChange={(e) => setBody(e.target.value)}
        placeholder={active === "prompt" ? "Mine was…" : active === "sports" ? "Jio: what, when, where?" : active === "events" ? "What's happening? Who's in?" : `Say it in ${active}…`} />
      <button type="submit" className="cta-dark" disabled={busy || !body.trim()}>{busy ? "Posting…" : "Share anonymously"}</button>
    </form>
  );

  return (
    <div className="stack">
      <div>
        <h1 className="h1" style={{ fontSize: "1.7rem" }}>Community</h1>
        <p className="muted" style={{ margin: "0.15rem 0 0" }}>People who get it. No names, no judgement.</p>
      </div>

      {/* channel chips */}
      <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.2rem" }}>
        {CHANNELS.map((c) => (
          <button key={c.key} onClick={() => setActive(c.key)}
            className={active === c.key ? "cta-dark" : "ghost"}
            style={{ width: "auto", flex: "0 0 auto", whiteSpace: "nowrap", padding: "0.5rem 1rem", fontSize: "0.85rem", borderRadius: 999 }}>
            {c.label}
          </button>
        ))}
      </div>

      {error && <div className="error">{error}</div>}

      {active === "prompt" ? (
        <div className="card" style={{ background: "#fdf3df", border: "1px solid #f5e6bf" }}>
          <span className="badge" style={{ background: "#fff", color: "#b7791f" }}>Today's prompt · {reflections.length} answer{reflections.length === 1 ? "" : "s"}</span>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, letterSpacing: "-0.02em", margin: "0.7rem 0 0.5rem" }}>{prompt?.text || "…"}</h2>
          <div style={{ color: "#b7791f", fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.7rem" }}>Your answer, posted anonymously</div>
          {composer}
        </div>
      ) : (
        <div className="stack" style={{ gap: "0.7rem" }}>
          {HINTS[active] && <div className="card muted" style={{ padding: "0.8rem 1rem", fontSize: "0.85rem" }}>{HINTS[active]}</div>}
          <div className="card">{composer}</div>
        </div>
      )}

      <div className="row" style={{ justifyContent: "space-between" }}>
        <strong>{active === "prompt" ? "Recent answers" : "Recent posts"}</strong>
        <span className="muted" style={{ fontSize: "0.82rem" }}>Newest first</span>
      </div>

      <div className="stack">
        {reflections.length === 0 && <div className="card muted">Nothing here yet. Be the first to share.</div>}
        {reflections.map((r) => (
          <div key={r.id} className="card">
            <div className="row" style={{ gap: "0.7rem" }}>
              <span style={{ width: 40, height: 40, borderRadius: "50%", background: AVATAR_BG[r.author_avatar] || "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flex: "0 0 auto" }}>
                {r.author_avatar || "🫂"}
              </span>
              <div>
                <strong style={{ fontSize: "0.95rem" }}>{authorName(r)}</strong>
                <div className="muted" style={{ fontSize: "0.76rem" }}>
                  {r.author_day != null && r.author_day >= 0 ? `Day ${r.author_day} · ` : ""}{timeAgo(r.created_at)}
                </div>
              </div>
            </div>
            <p style={{ margin: "0.7rem 0 0" }}>{r.body}</p>
            <div className="row" style={{ marginTop: "0.7rem", gap: "0.5rem" }}>
              <button onClick={async () => { await api.joinReflection(r.id).catch(() => {}); load(); }}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.35rem 0.75rem", fontSize: "0.78rem", fontWeight: 700,
                  background: r.joined ? "#e5f7f0" : "#fff", color: r.joined ? "var(--brand)" : "var(--text-dim)",
                  border: "1px solid " + (r.joined ? "#bfe9db" : "var(--border-strong)"), boxShadow: "none" }}>
                <Icon name="heart" size={15} style={{ color: r.joined ? "var(--brand)" : "var(--text-dim)" }} /> {r.joins || 0}
              </button>
              <button className="ghost" style={{ padding: "0.35rem 0.7rem", fontSize: "0.72rem" }}
                title="Report" onClick={async () => { await api.reportReflection(r.id).catch(() => {}); load(); }}>Report</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
