import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

export default function Profile() {
  const { user, logout, refreshProfile } = useAuth();
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getProfile().then((p) =>
      setForm({
        quitDate: p.quitDate ? p.quitDate.slice(0, 10) : "",
        weeklySpend: p.weeklySpend ?? 0,
        savingsGoalLabel: p.savingsGoalLabel ?? "",
        savingsGoalAmount: p.savingsGoalAmount ?? "",
        consentLocation: p.consentLocation ?? false,
      })
    );
  }, []);

  if (!form) return <p className="muted">Loading…</p>;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    try {
      await api.updateProfile({
        quitDate: form.quitDate ? new Date(form.quitDate).toISOString() : null,
        weeklySpend: Number(form.weeklySpend) || 0,
        savingsGoalLabel: form.savingsGoalLabel || null,
        savingsGoalAmount: form.savingsGoalAmount ? Number(form.savingsGoalAmount) : null,
        consentLocation: form.consentLocation,
      });
      await refreshProfile();
      setSaved(true);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Profile 👤</h1>
        <p className="muted">{user.email}</p>
      </div>

      <form className="card stack" onSubmit={save}>
        {error && <div className="error">{error}</div>}
        {saved && <div className="badge" style={{ color: "var(--success)" }}>✓ Saved</div>}

        <div className="field">
          <label>Quit date</label>
          <input type="date" value={form.quitDate} onChange={(e) => set("quitDate", e.target.value)} />
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
        <label className="row" style={{ gap: "0.6rem" }}>
          <input type="checkbox" style={{ width: "auto" }} checked={form.consentLocation} onChange={(e) => set("consentLocation", e.target.checked)} />
          <span className="muted" style={{ fontSize: "0.85rem" }}>Track craving locations for trigger warnings</span>
        </label>

        <button type="submit">Save changes</button>
      </form>

      <button className="ghost" onClick={logout}>Log out</button>
    </div>
  );
}
