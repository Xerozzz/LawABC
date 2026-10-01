import { useEffect, useState } from "react";
import { adminApi, clearSession, getSession, SignedOut } from "./adminApi.js";
import Dashboard from "./Dashboard.jsx";
import ParticipantDetail from "./ParticipantDetail.jsx";
import "./admin.css";

// The password must never be typed into a page served over plain http, so the
// form only appears on https (or localhost while developing). The server
// refuses http sign-ins in production too.
const SECURE =
  window.location.protocol === "https:" ||
  ["localhost", "127.0.0.1"].includes(window.location.hostname);

// ?user=<id> opens one participant, so the browser's back button works.
const userFromUrl = () => {
  const id = Number(new URLSearchParams(window.location.search).get("user"));
  return Number.isInteger(id) && id > 0 ? id : null;
};

export default function AdminApp() {
  const [session, setSession] = useState(getSession);
  const [notice, setNotice] = useState("");
  const [userId, setUserId] = useState(userFromUrl);

  useEffect(() => {
    document.title = "ClearAir admin";
    const onPop = () => setUserId(userFromUrl());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // A session restored from this tab may have expired or been revoked.
  useEffect(() => {
    if (session) adminApi.me().catch((e) => e instanceof SignedOut && signedOut(e.message));
  }, []);

  const signedOut = (message = "") => {
    clearSession();
    setSession(null);
    setNotice(message);
  };

  const openUser = (id) => {
    window.history.pushState(null, "", id ? `/admin?user=${id}` : "/admin");
    setUserId(id);
    window.scrollTo(0, 0);
  };

  if (!SECURE) {
    return (
      <div className="center-screen">
        <h1 className="h1">Secure connection needed</h1>
        <p className="muted">
          The admin page only works over https://. Open this address with https:// instead of http://.
        </p>
      </div>
    );
  }

  if (!session) {
    return <SignIn notice={notice} onSignedIn={(s) => { setNotice(""); setSession(s); }} />;
  }

  return (
    <div className="adm">
      <header className="adm-top">
        <button className="adm-brand" onClick={() => openUser(null)}>ClearAir · Study admin</button>
        <div className="row">
          <span className="muted adm-who">{session.username}</span>
          <button className="ghost adm-small" onClick={() => signedOut()}>Sign out</button>
        </div>
      </header>
      <main className="adm-main">
        {userId ? (
          <ParticipantDetail id={userId} onBack={() => openUser(null)} onSignedOut={signedOut} />
        ) : (
          <Dashboard onOpen={openUser} onSignedOut={signedOut} />
        )}
      </main>
    </div>
  );
}

function SignIn({ notice, onSignedIn }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      onSignedIn(await adminApi.login(username, password));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form className="center-screen" onSubmit={submit}>
      <h1 className="h1">ClearAir study admin</h1>
      <p className="muted" style={{ marginTop: 0 }}>Sign in with your admin account.</p>
      {(error || notice) && <div className="error" style={{ marginBottom: "0.85rem" }}>{error || notice}</div>}
      <div className="field">
        <label htmlFor="adm-user">Username</label>
        <input id="adm-user" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="adm-pass">Password</label>
        <input id="adm-pass" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <button type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
