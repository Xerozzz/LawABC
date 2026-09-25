import { useState } from "react";
import { api } from "../api.js";
import Icon from "./Icon.jsx";
import { SUGGESTED_TRIGGERS } from "../triggers.js";

// Same pill shape as the Community channel chips. The user's own labels can be
// long, so theirs wrap inside the card instead of widening the screen.
const chip = {
  width: "auto", flex: "0 0 auto", whiteSpace: "nowrap", boxShadow: "none",
  padding: "0.45rem 0.9rem", fontSize: "0.82rem", borderRadius: 999,
};
const ownChip = { ...chip, whiteSpace: "normal", maxWidth: "100%", overflowWrap: "anywhere", textAlign: "left" };

// Starters stay on offer until someone has a few triggers of their own.
const STARTER_LIMIT = 3;

// "What set this off?" for Craving SOS: the user's own triggers as chips.
// Picking one shows the plan they wrote for it, and the craving gets tagged.
export default function TriggerPicker({ triggers, value, onChange, onAdded, title = "What set this off?" }) {
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const selected = triggers.find((t) => t.id === value);

  // Decide once, when the picker opens, whether to offer starters — and keep every
  // chip in place after a tap, so a quick second tap can't land on a different one.
  const [firstTime] = useState(() => triggers.length === 0);
  const [offerStarters] = useState(() => triggers.length < STARTER_LIMIT);
  const [hadIds] = useState(() => new Set(triggers.map((t) => t.id)));
  const byLabel = (label) => triggers.find((t) => t.label.toLowerCase() === label.toLowerCase());
  const had = triggers.filter((t) => hadIds.has(t.id));
  const starters = offerStarters
    ? SUGGESTED_TRIGGERS.filter((s) => !had.some((t) => t.label.toLowerCase() === s.label.toLowerCase()))
    : [];
  const addedHere = triggers.filter(
    (t) => !hadIds.has(t.id) && !starters.some((s) => s.label.toLowerCase() === t.label.toLowerCase())
  );
  const ownChipFor = (t) => (
    <button key={t.id} type="button" className={value === t.id ? "cta-dark" : "ghost"} style={ownChip}
      aria-pressed={value === t.id} onClick={() => onChange(value === t.id ? null : t.id)}>
      {t.label}
    </button>
  );

  const add = async (name, kind = "other") => {
    if (!name.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const t = await api.addTrigger({ label: name.trim(), kind });
      if (!t.existed) api.logEvent("trigger_added", { from: "sos", kind: t.kind });
      onAdded(t);
      onChange(t.id);
      setLabel("");
      setAdding(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card" style={{ background: "#fff" }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <strong>{title}</strong>
        <span className="muted" style={{ fontSize: "0.78rem" }}>Optional</span>
      </div>
      {firstTime && (
        <p className="muted" style={{ margin: "0.2rem 0 0", fontSize: "0.82rem" }}>
          Tap what fits. It's saved to your triggers so you can spot patterns.
        </p>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", marginTop: "0.7rem" }}>
        {had.map(ownChipFor)}
        {starters.map((s) => {
          const saved = byLabel(s.label); // a starter they've tapped stays where it was
          return saved ? ownChipFor(saved) : (
            <button key={s.label} type="button" className="ghost" style={chip} disabled={busy} onClick={() => add(s.label, s.kind)}>
              {s.label}
            </button>
          );
        })}
        {addedHere.map(ownChipFor)}
        {!adding && (
          <button type="button" className="ghost" onClick={() => setAdding(true)}
            style={{ ...chip, display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "var(--text-dim)" }}>
            <Icon name="plus" size={14} /> {firstTime ? "Something else" : "Add"}
          </button>
        )}
      </div>

      {adding && (
        <form className="row" style={{ gap: "0.5rem", marginTop: "0.7rem" }} onSubmit={(e) => { e.preventDefault(); add(label); }}>
          <input autoFocus maxLength={60} value={label} onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Exam stress" style={{ padding: "0.55rem 0.8rem" }} />
          <button type="submit" disabled={busy || !label.trim()} style={{ flex: "0 0 auto", padding: "0.55rem 0.9rem" }}>Save</button>
          <button type="button" className="ghost" aria-label="Cancel" onClick={() => { setAdding(false); setLabel(""); }}
            style={{ flex: "0 0 auto", padding: "0.55rem 0.75rem" }}>✕</button>
        </form>
      )}

      {error && <div className="error" style={{ marginTop: "0.6rem" }}>{error}</div>}

      {selected && (selected.plan ? (
        <div style={{ marginTop: "0.8rem", background: "#e7f8f2", border: "1px solid #bfe9db", borderRadius: "var(--radius-sm)", padding: "0.7rem 0.85rem", fontSize: "0.9rem", color: "#0b6b62", overflowWrap: "anywhere" }}>
          <strong>Your plan:</strong> {selected.plan}
        </div>
      ) : (
        <p className="muted" style={{ margin: "0.7rem 0 0", fontSize: "0.8rem" }}>
          No plan for this one yet. You can add one later in My triggers.
        </p>
      ))}
    </div>
  );
}
