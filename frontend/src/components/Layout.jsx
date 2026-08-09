import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { api } from "../api.js";

const leftTabs = [
  { to: "/", icon: "🏠", label: "Home", end: true },
  { to: "/timeline", icon: "📈", label: "Progress" },
];
const rightTabs = [
  { to: "/community", icon: "💬", label: "Community" },
  { to: "/profile", icon: "👤", label: "Profile" },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api.getNotifications().then((d) => setUnread(d.unread)).catch(() => {});
    api.logEvent("screen_view", { path: location.pathname });
  }, [location.pathname]);

  return (
    <>
      <header className="topbar">
        <span className="brand">🌬️ ClearAir</span>
        <div className="row" style={{ gap: "0.25rem" }}>
          <button className="bell" onClick={() => navigate("/help")} aria-label="Get help" title="Get help">⛑️</button>
          <button className="bell" onClick={() => navigate("/notifications")} aria-label="Notifications">
            🔔
            {unread > 0 && <span className="bell-badge">{unread > 9 ? "9+" : unread}</span>}
          </button>
        </div>
      </header>

      <div className="container">
        <Outlet />
      </div>

      <nav className="bottom-nav">
        {leftTabs.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end}>
            <span className="ico">{t.icon}</span>
            <span>{t.label}</span>
          </NavLink>
        ))}

        <button className="nav-sos" onClick={() => navigate("/sos")} aria-label="Craving SOS">
          <span className="ico">🆘</span>
          <span>SOS</span>
        </button>

        {rightTabs.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end}>
            <span className="ico">{t.icon}</span>
            <span>{t.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
