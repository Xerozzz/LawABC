import { useEffect, useState } from "react";
import { api } from "../api.js";

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const CHANNELS = [
  { key: "prompt", label: "🌟 Today's prompt" },
  { key: "general", label: "General" },
  { key: "sports", label: "⚽ Sports & jio" },
  { key: "events", label: "📅 Events" },
  { key: "cravings", label: "Cravings" },
  { key: "wins", label: "Wins" },
  { key: "advice", label: "Advice" },
  { key: "vent", label: "Vent" },
];

// A little nudge on what each channel is for.
const CHANNEL_HINTS = {
  sports: "Jio people for a run, ball game, gym sesh — drop a time and place.",
  events: "Post community events here and sign up together — going with someone makes it easier.",
};

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
    setBusy(true);
    setError("");
    try {
      const opts = active === "prompt"
        ? { promptId: prompt?.id, channel: "general" }
        : { channel: active };
      await api.postReflection(body.trim(), opts);
      api.logEvent("reflection_posted", { channel: active });
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
        <p className="muted">People who get it. No names, no judgement — say what's real.</p>
      </div>

      {/* channel chips */}
      <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.3rem" }}>
        {CHANNELS.map((c) => (
          <button
            key={c.key}
            className={active === c.key ? "" : "ghost"}
            style={{ padding: "0.4rem 0.9rem", whiteSpace: "nowrap", fontSize: "0.85rem" }}
            onClick={() => setActive(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {active === "prompt" && prompt && (
        <div className="card" style={{ borderColor: "var(--accent)" }}>
          <div className="badge" style={{ color: "var(--accent)" }}>Today's prompt</div>
          <p style={{ margin: "0.5rem 0 0", fontWeight: 600 }}>{prompt.text}</p>
        </div>
      )}

      {CHANNEL_HINTS[active] && (
        <div className="card muted" style={{ padding: "0.8rem 1rem", fontSize: "0.85rem" }}>
          {CHANNEL_HINTS[active]}
        </div>
      )}

      <form className="card stack" onSubmit={post}>
        {error && <div className="error">{error}</div>}
        <textarea
          rows={3}
          maxLength={1000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            active === "prompt" ? "Answer the prompt…"
            : active === "sports" ? "Jio: what, when, where?"
            : active === "events" ? "What's happening? Who's in?"
            : `Say it in ${active}… (anonymous)`
          }
        />
        <button type="submit" disabled={busy || !body.trim()}>
          {busy ? "Posting…" : "Share anonymously"}
        </button>
      </form>

      <div className="stack">
        {reflections.length === 0 && (
          <div className="card muted">Nothing here yet. Be the first to share. 🌱</div>
        )}
        {reflections.map((r) => (
          <div key={r.id} className="card">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="row" style={{ gap: "0.5rem" }}>
                <span style={{ fontSize: "1.3rem" }}>{r.author_avatar || "🫂"}</span>
                <span className="badge">Anonymous</span>
                {r.channel && r.channel !== "general" && (
                  <span className="badge" style={{ color: "var(--brand)" }}>{r.channel}</span>
                )}
              </span>
              <span className="muted" style={{ fontSize: "0.72rem" }}>
                {r.milestone_label ? `${r.milestone_label} · ` : ""}{timeAgo(r.created_at)}
              </span>
            </div>
            <p style={{ margin: "0.6rem 0 0" }}>{r.body}</p>
            <button
              className="ghost"
              style={{ fontSize: "0.7rem", padding: "0.3rem 0.7rem", marginTop: "0.6rem" }}
              onClick={async () => { await api.reportReflection(r.id).catch(() => {}); load(); }}
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
