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
  const [pushState, setPushState] = useState(
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

  const enablePush = async () => {
    if (typeof Notification === "undefined") return;
    const perm = await Notification.requestPermission();
    setPushState(perm);
    if (perm === "granted") {
      new Notification("ClearAir notifications on 🔔", {
        body: "We'll cheer you on at every milestone.",
      });
    }
  };

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1 className="h1" style={{ margin: 0 }}>Notifications 🔔</h1>
        <button className="ghost" style={{ padding: "0.4rem 0.8rem" }} onClick={() => navigate(-1)}>
          Close
        </button>
      </div>

      {pushState !== "granted" && pushState !== "unsupported" && (
        <div className="card">
          <p className="muted" style={{ marginTop: 0 }}>
            Get a nudge on this device when you hit a milestone.
          </p>
          <button className="accent" onClick={enablePush}>Enable device notifications</button>
        </div>
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
