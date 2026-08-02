import { useState } from "react";
import { useAuth } from "../AuthContext.jsx";

export default function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "register") await register(email, password);
      else await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="center-screen">
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "3rem" }}>🌬️</div>
        <h1 className="h1">ClearAir</h1>
        <p className="muted">Your always-there support to quit vaping.</p>
      </div>

      <form className="card stack" onSubmit={submit}>
        <div className="row" style={{ justifyContent: "center", gap: "1.5rem" }}>
          <button
            type="button"
            className={mode === "register" ? "" : "ghost"}
            onClick={() => setMode("register")}
          >
            Sign up
          </button>
          <button
            type="button"
            className={mode === "login" ? "" : "ghost"}
            onClick={() => setMode("login")}
          >
            Log in
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="field">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            minLength={6}
            required
          />
        </div>

        <button type="submit" disabled={busy}>
          {busy ? "Please wait…" : mode === "register" ? "Create account" : "Log in"}
        </button>
      </form>
      <p className="muted" style={{ fontSize: "0.75rem", textAlign: "center", marginTop: "1rem" }}>
        Anonymous &amp; judgement-free. Your data stays private.
      </p>
    </div>
  );
}
