import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import Icon from "./Icon.jsx";

const leftTabs = [
  { to: "/", icon: "home", label: "Home", end: true },
  { to: "/progress", icon: "chart", label: "Progress" },
];
// While the community is closed, its slot goes to the user's own triggers.
const communityTab = { to: "/community", icon: "chat", label: "Community" };
const triggersTab = { to: "/triggers", icon: "pin", label: "Triggers" };
const profileTab = { to: "/profile", icon: "user", label: "Profile" };

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { features } = useAuth();
  const [unread, setUnread] = useState(0);
  const rightTabs = [features.community ? communityTab : triggersTab, profileTab];

  useEffect(() => {
    api.getNotifications().then((d) => setUnread(d.unread)).catch(() => {});
    api.logEvent("screen_view", { path: location.pathname });
  }, [location.pathname]);

  return (
    <>
      <header className="topbar">
        <span className="brand row" style={{ gap: "0.4rem" }}>
          <Icon name="leaf" size={22} style={{ color: "var(--brand)" }} /> ClearAir
        </span>
        <div className="row" style={{ gap: "0.5rem" }}>
          <button className="circle-btn" onClick={() => navigate("/help")} aria-label="Get help" title="Get help">
            <Icon name="lifebuoy" size={19} style={{ color: "var(--text-dim)" }} />
          </button>
          <button className="circle-btn" onClick={() => navigate("/notifications")} aria-label="Notifications">
            <Icon name="bell" size={19} style={{ color: "var(--text-dim)" }} />
            {unread > 0 && <span className="dot" />}
          </button>
        </div>
      </header>

      <div className="container">
        <Outlet />
      </div>

      <nav className="bottom-nav">
        {leftTabs.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end}>
            <Icon name={t.icon} size={22} />
            <span>{t.label}</span>
          </NavLink>
        ))}

        <button className="nav-sos" onClick={() => navigate("/sos")} aria-label="Craving SOS">
          <span>SOS</span>
        </button>

        {rightTabs.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end}>
            <Icon name={t.icon} size={22} />
            <span>{t.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
