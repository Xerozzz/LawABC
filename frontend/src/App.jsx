import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import { applyTheme } from "./themes.js";
import Layout from "./components/Layout.jsx";
import AuthScreen from "./screens/AuthScreen.jsx";
import Consent from "./screens/Consent.jsx";
import Onboarding from "./screens/Onboarding.jsx";
import Help from "./screens/Help.jsx";
import Home from "./screens/Home.jsx";
import Progress from "./screens/Progress.jsx";
import Timeline from "./screens/Timeline.jsx";
import Savings from "./screens/Savings.jsx";
import CravingSOS from "./screens/CravingSOS.jsx";
import Community from "./screens/Community.jsx";
import TriggerMap from "./screens/TriggerMap.jsx";
import Notifications from "./screens/Notifications.jsx";
import Privacy from "./screens/Privacy.jsx";
import Shop from "./screens/Shop.jsx";
import Profile from "./screens/Profile.jsx";

export default function App() {
  const { user, loading } = useAuth();

  // Apply the user's chosen theme (falls back to default when logged out).
  useEffect(() => {
    applyTheme(user?.theme || "default");
  }, [user?.theme]);

  if (loading) {
    return <div className="center-screen muted">Loading ClearAir…</div>;
  }

  if (!user) return <AuthScreen />;

  if (!user.consentAcceptedAt) return <Consent />;

  if (!user.onboarded) return <Onboarding />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/health" element={<Navigate to="/progress" replace />} />
        <Route path="/timeline" element={<Navigate to="/progress" replace />} />
        <Route path="/savings" element={<Savings />} />
        <Route path="/community" element={<Community />} />
        <Route path="/triggers" element={<TriggerMap />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/help" element={<Help />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="/sos" element={<CravingSOS />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
