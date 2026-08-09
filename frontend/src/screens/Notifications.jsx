import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const ICON = { milestone: "❤️", streak: "🔥", goal: "💰" };

export default function Notifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  // 'granted' when device notifications are already allowed; otherwise show WIP.
  const [pushState] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );

  useEffect(() => {
    api
      .getNotifications()
      .then((d) => {
        setItems(d.notifications);
        // mark read so the badge clears
        return api.markNotificationsRead();
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1 className="h1" style={{ margin: 0 }}>Notifications 🔔</h1>
        <button className="ghost" style={{ padding: "0.4rem 0.8rem" }} onClick={() => navigate(-1)}>
          Close
        </button>
      </div>

      {pushState !== "granted" && (
        <div className="card" style={{ borderStyle: "dashed" }}>
          <div className="badge" style={{ color: "var(--accent)", marginBottom: "0.5rem" }}>🚧 Work in progress</div>
          <p className="muted" style={{ margin: 0 }}>
            Soon: a morning boost and an evening check-in on this device — even when the app is closed.
            We're still building this out, so it's not switched on yet.
          </p>
        </div>
      )}
      {pushState === "granted" && (
        <div className="badge" style={{ color: "var(--success)" }}>✓ Device notifications on</div>
      )}

      {loading && <p className="muted">Loading…</p>}
      {!loading && items.length === 0 && (
        <div className="card muted">No notifications yet. Keep going — milestones are coming! 🌱</div>
      )}

      <div className="stack">
        {items.map((n) => (
          <div key={n.id} className="card" style={{ opacity: n.read_at ? 0.7 : 1 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <strong>{ICON[n.type] || "🔔"} {n.title}</strong>
              <span className="muted" style={{ fontSize: "0.72rem" }}>{timeAgo(n.created_at)}</span>
            </div>
            <p className="muted" style={{ margin: "0.4rem 0 0" }}>{n.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
