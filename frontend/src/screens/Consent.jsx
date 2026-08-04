import { useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

export default function Consent() {
  const { refreshProfile, logout } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const accept = async () => {
    setBusy(true);
    setError("");
    try {
      await api.acceptConsent();
      await refreshProfile();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <div className="center-screen">
      <h1 className="h1">Before you start 🔒</h1>
      <p className="muted">A quick, plain-English note on your privacy.</p>

      <div className="card stack" style={{ marginTop: "1rem", fontSize: "0.92rem" }}>
        <div>
          <strong>What we store</strong>
          <p className="muted" style={{ margin: "0.3rem 0 0" }}>
            Your email, your quit date and spending (to show progress and savings), the cravings
            you log, any reflections you post, and which features you use. Location is stored
            <strong> only</strong> if you turn it on for the trigger map.
          </p>
        </div>
        <div>
          <strong>How it's used</strong>
          <p className="muted" style={{ margin: "0.3rem 0 0" }}>
            To power your timeline, savings, and support tools, and to help us improve the app.
            Community reflections are shown <strong>anonymously</strong> — others never see who you are.
          </p>
        </div>
        <div>
          <strong>You're in control</strong>
          <p className="muted" style={{ margin: "0.3rem 0 0" }}>
            You can view, download, or delete your data — including your whole account — anytime
            from <strong>Profile → Privacy &amp; data</strong>.
          </p>
        </div>
        <p className="muted" style={{ margin: 0, fontSize: "0.8rem" }}>
          ClearAir offers support and general health information, not medical advice. If you need
          urgent help, see the <strong>Help</strong> resources in the app.
        </p>
      </div>

      {error && <div className="error" style={{ marginTop: "1rem" }}>{error}</div>}

      <label className="row" style={{ alignItems: "flex-start", gap: "0.6rem", marginTop: "1rem" }}>
        <input
          type="checkbox"
          style={{ width: "auto", marginTop: "0.2rem" }}
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
        />
        <span className="muted" style={{ fontSize: "0.9rem" }}>
          I understand and agree to how ClearAir handles my data.
        </span>
      </label>

      <button style={{ marginTop: "1rem" }} disabled={!agreed || busy} onClick={accept}>
        {busy ? "Please wait…" : "I agree — continue"}
      </button>
      <button className="ghost" style={{ marginTop: "0.6rem" }} onClick={logout}>
        Not now, log out
      </button>
    </div>
  );
}
