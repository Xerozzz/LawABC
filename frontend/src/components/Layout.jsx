import { NavLink, Outlet, useNavigate } from "react-router-dom";

const tabs = [
  { to: "/", icon: "🏠", label: "Home", end: true },
  { to: "/timeline", icon: "❤️", label: "Health" },
  { to: "/savings", icon: "💰", label: "Savings" },
  { to: "/community", icon: "💬", label: "Community" },
  { to: "/profile", icon: "👤", label: "Profile" },
];

export default function Layout() {
  const navigate = useNavigate();
  return (
    <>
      <div className="container">
        <Outlet />
      </div>

      <button className="sos-fab" onClick={() => navigate("/sos")}>
        🆘 Craving
      </button>

      <nav className="bottom-nav">
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end}>
            <span className="ico">{t.icon}</span>
            <span>{t.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
