import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

export default function Shop() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
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
      setMsg(`Unlocked ${item.label}! 🎉`);
      await load();
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
        <div className="stat-label">gems to spend · {data.earned} earned</div>
        <p className="muted" style={{ fontSize: "0.78rem", margin: "0.5rem 0 0" }}>
          Earn gems from streaks, beating cravings, and supporting others.
        </p>
      </div>

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
