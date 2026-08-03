import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

export default function Privacy() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [cravings, setCravings] = useState([]);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const load = () => api.getCravings().then(setCravings).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const located = cravings.filter((c) => c.lat != null && c.lng != null);

  const deleteOne = async (id) => {
    await api.deleteCraving(id).catch((e) => setError(e.message));
    load();
  };

  const clearAll = async () => {
    if (!window.confirm("Delete ALL your craving and location history? This can't be undone.")) return;
    await api.clearCravings().catch((e) => setError(e.message));
    setMsg("Craving and location history cleared.");
    load();
  };

  const download = async () => {
    setError("");
    try {
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "clearair-my-data.json";
      a.click();
      URL.revokeObjectURL(url);
      setMsg("Your data has been downloaded.");
    } catch (e) {
      setError(e.message);
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm("Permanently delete your account and ALL your data? This cannot be undone.")) return;
    try {
      await api.deleteAccount();
      logout();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1 className="h1" style={{ margin: 0 }}>Privacy &amp; data 🔒</h1>
        <button className="ghost" style={{ padding: "0.4rem 0.8rem" }} onClick={() => navigate(-1)}>Back</button>
      </div>
      <p className="muted" style={{ marginTop: 0 }}>
        Your data is yours. View it, download it, or delete it anytime.
      </p>

      {error && <div className="error">{error}</div>}
      {msg && <div className="badge" style={{ color: "var(--success)" }}>{msg}</div>}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Location history</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          {located.length} craving{located.length === 1 ? "" : "s"} with a saved location.
        </p>
        <div className="stack">
          {located.map((c) => (
            <div key={c.id} className="row" style={{ justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.85rem" }}>
                {c.context || "Craving"} · {new Date(c.occurred_at).toLocaleDateString()}
                <br />
                <span className="muted" style={{ fontSize: "0.72rem" }}>
                  {c.lat.toFixed(4)}, {c.lng.toFixed(4)}
                </span>
              </span>
              <button className="ghost" style={{ padding: "0.3rem 0.7rem" }} onClick={() => deleteOne(c.id)}>
                ✕
              </button>
            </div>
          ))}
          {located.length === 0 && <span className="muted" style={{ fontSize: "0.85rem" }}>No saved locations.</span>}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Download my data</h3>
        <p className="muted" style={{ marginTop: 0 }}>Export everything ClearAir stores about you as a JSON file.</p>
        <button className="ghost" onClick={download}>⬇️ Download my data</button>
      </div>

      <div className="card" style={{ borderColor: "var(--danger)" }}>
        <h3 style={{ marginTop: 0, color: "var(--danger)" }}>Danger zone</h3>
        <div className="stack">
          <button className="ghost" onClick={clearAll}>Delete all craving &amp; location history</button>
          <button style={{ background: "var(--danger)", color: "#fff" }} onClick={deleteAccount}>
            Delete my account
          </button>
        </div>
      </div>
    </div>
  );
}
