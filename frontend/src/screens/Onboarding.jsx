import { useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

export default function Onboarding() {
  const { refreshProfile } = useAuth();
  const [quitDate, setQuitDate] = useState(new Date().toISOString().slice(0, 10));
  const [weeklySpend, setWeeklySpend] = useState("15");
  const [goalLabel, setGoalLabel] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [consentLocation, setConsentLocation] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.updateProfile({
        quitDate: new Date(quitDate).toISOString(),
        weeklySpend: Number(weeklySpend) || 0,
        savingsGoalLabel: goalLabel || null,
        savingsGoalAmount: goalAmount ? Number(goalAmount) : null,
        consentLocation,
      });
      await refreshProfile();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="center-screen">
      <h1 className="h1">Let's set you up 🎯</h1>
      <p className="muted">A few quick things to personalise your journey.</p>

      <form className="card stack" onSubmit={submit} style={{ marginTop: "1rem" }}>
        {error && <div className="error">{error}</div>}

        <div className="field">
          <label>When did you quit (or plan to)?</label>
          <input type="date" value={quitDate} onChange={(e) => setQuitDate(e.target.value)} required />
        </div>

        <div className="field">
          <label>How much did you spend on vaping per week? ($)</label>
          <input
            type="number" min="0" step="0.5"
            value={weeklySpend}
            onChange={(e) => setWeeklySpend(e.target.value)}
          />
        </div>

        <div className="field">
          <label>What are you saving up for? (optional)</label>
          <input
            value={goalLabel}
            onChange={(e) => setGoalLabel(e.target.value)}
            placeholder="e.g. New headphones"
          />
        </div>

        <div className="field">
          <label>Goal amount ($, optional)</label>
          <input
            type="number" min="0" step="1"
            value={goalAmount}
            onChange={(e) => setGoalAmount(e.target.value)}
            placeholder="150"
          />
        </div>

        <label className="row" style={{ alignItems: "flex-start", gap: "0.6rem" }}>
          <input
            type="checkbox"
            style={{ width: "auto", marginTop: "0.2rem" }}
            checked={consentLocation}
            onChange={(e) => setConsentLocation(e.target.checked)}
          />
          <span className="muted" style={{ fontSize: "0.85rem" }}>
            Allow ClearAir to note where cravings happen, so it can warn me near trigger spots.
            You can turn this off anytime.
          </span>
        </label>

        <button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Start my journey"}
        </button>
      </form>
    </div>
  );
}
