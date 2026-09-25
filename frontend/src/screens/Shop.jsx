import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

export default function Shop() {
  const navigate = useNavigate();
  const { refreshProfile, features } = useAuth();
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const load = () => api.getRewards().then(setData).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <p className="muted">Loading…</p>;

  const avatars = data.catalog.filter((i) => i.type === "avatar");
  const themes = data.catalog.filter((i) => i.type === "theme");

  const isSelected = (item) =>
    item.type === "avatar" ? item.emoji === data.avatar : item.key === data.theme;

  const unlock = async (item) => {
    setError(""); setMsg("");
    try {
      await api.unlockReward(item.key);
      // Apply it right away — paying gems and seeing nothing change feels like a scam.
      await api.selectReward(item.key);
      setMsg(`Unlocked ${item.label} — switched on! 🎉`);
      await load();
      await refreshProfile();
    } catch (e) { setError(e.message); }
  };

  const select = async (item) => {
    setError(""); setMsg("");
    try {
      await api.selectReward(item.key);
      await load();
      await refreshProfile(); // applies theme / avatar app-wide
    } catch (e) { setError(e.message); }
  };

  const ItemButton = ({ item }) => {
    if (isSelected(item)) return <span className="badge" style={{ color: "var(--brand)" }}>✓ Using</span>;
    if (item.owned) return <button className="ghost" style={{ padding: "0.35rem 0.8rem" }} onClick={() => select(item)}>Use</button>;
    const affordable = data.balance >= item.cost;
    return (
      <button
        style={{ padding: "0.35rem 0.8rem", background: affordable ? "var(--accent)" : "var(--surface-2)", color: affordable ? "#3d2c00" : "var(--text-dim)" }}
        disabled={!affordable}
        onClick={() => unlock(item)}
      >
        💎 {item.cost}
      </button>
    );
  };

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1 className="h1" style={{ margin: 0 }}>Rewards 🎁</h1>
        <button className="ghost" style={{ padding: "0.4rem 0.8rem" }} onClick={() => navigate(-1)}>Back</button>
      </div>

      <div className="card" style={{ textAlign: "center" }}>
        <div className="stat" style={{ color: "var(--accent)" }}>💎 {data.balance}</div>
        <div className="stat-label">gems to spend · {data.earned} earned · {data.spent} spent</div>
      </div>

      {/* exactly where gems come from — no mystery maths */}
      {data.breakdown && (
        <div className="card">
          <strong>How you earn gems</strong>
          <ul className="muted" style={{ margin: "0.5rem 0 0", paddingLeft: "1.1rem", fontSize: "0.85rem", lineHeight: 1.7 }}>
            <li>
              🔥 Check-in streak — bonus at 1, 3, 7, 14, 30, 60, 100, 365 days (best: {data.breakdown.bestStreak ?? 0}
              {data.breakdown.legacyStreakGems > 0 && data.breakdown.streaks === data.breakdown.legacyStreakGems ? ", earlier streak bonus kept" : ""})
              <span style={{ float: "right", fontWeight: 700 }}>+{data.breakdown.streaks}</span>
            </li>
            <li>💪 2 per craving beaten ({data.breakdown.beaten} so far) <span style={{ float: "right", fontWeight: 700 }}>+{data.breakdown.cravings}</span></li>
            {(features.community || data.breakdown.posts > 0) && (
              <li>💬 3 per community post ({data.breakdown.posts} so far) <span style={{ float: "right", fontWeight: 700 }}>+{data.breakdown.reflections}</span></li>
            )}
          </ul>
        </div>
      )}

      {msg && <div className="badge" style={{ color: "var(--success)" }}>{msg}</div>}
      {error && <div className="error">{error}</div>}

      <h3 style={{ margin: "0.3rem 0 0" }}>Avatars</h3>
      <div className="stack">
        {avatars.map((item) => (
          <div key={item.key} className="card row" style={{ justifyContent: "space-between" }}>
            <div className="row" style={{ gap: "0.7rem" }}>
              <span style={{ fontSize: "1.8rem" }}>{item.emoji}</span>
              <strong>{item.label}</strong>
            </div>
            <ItemButton item={item} />
          </div>
        ))}
      </div>

      <h3 style={{ margin: "0.3rem 0 0" }}>App themes</h3>
      <div className="stack">
        {themes.map((item) => (
          <div key={item.key} className="card row" style={{ justifyContent: "space-between" }}>
            <div className="row" style={{ gap: "0.7rem" }}>
              <span style={{ display: "flex", gap: 4 }}>
                <span style={{ width: 18, height: 18, borderRadius: "50%", background: item.colors.brand }} />
                <span style={{ width: 18, height: 18, borderRadius: "50%", background: item.colors.accent }} />
              </span>
              <strong>{item.label}</strong>
            </div>
            <ItemButton item={item} />
          </div>
        ))}
      </div>
    </div>
  );
}
