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
        api.logEvent("notifications_opened", { count: d.notifications.length });
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

      {/* what actually gets sent, so there are no surprises */}
      <div className="card">
        <strong>What we send (and when)</strong>
        <ul className="muted" style={{ margin: "0.5rem 0 0", paddingLeft: "1.1rem", fontSize: "0.85rem", lineHeight: 1.7 }}>
          <li>🌱 <strong>9am</strong> — a short morning boost to start the day</li>
          <li>🌙 <strong>8pm</strong> — an evening check-in: log a craving or share a win</li>
          <li>❤️ Health milestones, 🔥 streak days and 💰 savings goals — celebrated as you hit them</li>
        </ul>
        <p className="muted" style={{ margin: "0.6rem 0 0", fontSize: "0.78rem" }}>
          That's it — no spam, nothing about vaping shows on your lock screen.
        </p>
      </div>

      {pushState !== "granted" && (
        <div className="card" style={{ borderStyle: "dashed" }}>
          <div className="badge" style={{ color: "var(--accent)", marginBottom: "0.5rem" }}>🚧 Work in progress</div>
          <p className="muted" style={{ margin: 0 }}>
            The 9am / 8pm ones will reach this device even when the app is closed —
            we're still switching that on. Milestone celebrations already show up here.
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
