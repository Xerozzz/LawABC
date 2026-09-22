import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

export default function Profile() {
  const { user, logout, refreshProfile } = useAuth();
  const [form, setForm] = useState(null);
  const [savedCard, setSavedCard] = useState(null); // 'profile' | 'savings'
  const [error, setError] = useState("");

  useEffect(() => {
    api.getProfile().then((p) =>
      setForm({
        quitDate: p.quitDate ? p.quitDate.slice(0, 10) : "",
        weeklySpend: p.weeklySpend ?? 0,
        savingsGoalLabel: p.savingsGoalLabel ?? "",
        savingsGoalAmount: p.savingsGoalAmount ?? "",
        consentLocation: p.consentLocation ?? false,
        nickname: p.nickname ?? "",
      })
    );
  }, []);

  if (!form) return <p className="muted">Loading…</p>;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const saveWith = (card, patch) => async (e) => {
    e.preventDefault();
    setError("");
    setSavedCard(null);
    try {
      await api.updateProfile(patch());
      api.logEvent("profile_updated", { card });
      await refreshProfile();
      setSavedCard(card);
    } catch (err) {
      setError(err.message);
    }
  };

  const saveProfile = saveWith("profile", () => ({
    nickname: form.nickname,
    quitDate: form.quitDate ? new Date(form.quitDate).toISOString() : null,
    consentLocation: form.consentLocation,
  }));

  const saveSavings = saveWith("savings", () => ({
    weeklySpend: Number(form.weeklySpend) || 0,
    savingsGoalLabel: form.savingsGoalLabel || null,
    savingsGoalAmount: form.savingsGoalAmount ? Number(form.savingsGoalAmount) : null,
  }));

  return (
    <div className="stack">
      <div className="row" style={{ gap: "0.8rem" }}>
        <Link to="/shop" title="Change avatar" style={{ textDecoration: "none", fontSize: "2.4rem" }}>
          {user.avatar || "🌱"}
        </Link>
        <div>
          <h1 className="h1" style={{ margin: 0 }}>{user.nickname || "Profile"}</h1>
          <p className="muted" style={{ margin: 0 }}>{user.email} · tap the avatar to change it</p>
        </div>
      </div>

      <Link to="/shop"><button className="ghost" style={{ width: "100%" }}>Rewards &amp; personalisation</button></Link>

      {error && <div className="error">{error}</div>}

      {/* Profile details */}
      <form className="card stack" onSubmit={saveProfile}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <strong>Profile</strong>
          {savedCard === "profile" && <span className="badge" style={{ color: "var(--success)" }}>✓ Saved</span>}
        </div>
        <div className="field">
          <label>Display name (shown on community posts — leave blank to stay Anonymous)</label>
          <input maxLength={24} value={form.nickname} onChange={(e) => set("nickname", e.target.value)} placeholder="e.g. quitking_23" />
        </div>
        <div className="field">
          <label>Quit date</label>
          <input type="date" value={form.quitDate} onChange={(e) => set("quitDate", e.target.value)} />
        </div>
        <label className="row" style={{ gap: "0.6rem" }}>
          <input type="checkbox" style={{ width: "auto" }} checked={form.consentLocation} onChange={(e) => set("consentLocation", e.target.checked)} />
          <span className="muted" style={{ fontSize: "0.85rem" }}>Track craving locations for trigger warnings</span>
        </label>
        <button type="submit">Save profile</button>
      </form>

      {/* Savings */}
      <form className="card stack" onSubmit={saveSavings}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <strong>Savings</strong>
          {savedCard === "savings" && <span className="badge" style={{ color: "var(--success)" }}>✓ Saved</span>}
        </div>
        <div className="field">
          <label>Weekly vaping spend ($)</label>
          <input type="number" min="0" step="0.5" value={form.weeklySpend} onChange={(e) => set("weeklySpend", e.target.value)} />
        </div>
        <div className="field">
          <label>Savings goal</label>
          <input value={form.savingsGoalLabel} onChange={(e) => set("savingsGoalLabel", e.target.value)} placeholder="e.g. Concert tickets" />
        </div>
        <div className="field">
          <label>Goal amount ($)</label>
          <input type="number" min="0" value={form.savingsGoalAmount} onChange={(e) => set("savingsGoalAmount", e.target.value)} />
        </div>
        <button type="submit">Save savings</button>
      </form>

      <Link to="/privacy"><button className="ghost" style={{ width: "100%" }}>Privacy &amp; data</button></Link>
      <button className="ghost" onClick={logout}>Log out</button>
    </div>
  );
}
