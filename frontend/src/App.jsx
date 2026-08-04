import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import Layout from "./components/Layout.jsx";
import AuthScreen from "./screens/AuthScreen.jsx";
import Consent from "./screens/Consent.jsx";
import Onboarding from "./screens/Onboarding.jsx";
import Help from "./screens/Help.jsx";
import Home from "./screens/Home.jsx";
import Timeline from "./screens/Timeline.jsx";
import Savings from "./screens/Savings.jsx";
import CravingSOS from "./screens/CravingSOS.jsx";
import Community from "./screens/Community.jsx";
import TriggerMap from "./screens/TriggerMap.jsx";
import Notifications from "./screens/Notifications.jsx";
import Privacy from "./screens/Privacy.jsx";
import Profile from "./screens/Profile.jsx";

export default function App() {
  const { user, loading } = useAuth();

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
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/savings" element={<Savings />} />
        <Route path="/community" element={<Community />} />
        <Route path="/triggers" element={<TriggerMap />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/help" element={<Help />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="/sos" element={<CravingSOS />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
