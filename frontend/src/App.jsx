import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import Layout from "./components/Layout.jsx";
import AuthScreen from "./screens/AuthScreen.jsx";
import Onboarding from "./screens/Onboarding.jsx";
import Home from "./screens/Home.jsx";
import Timeline from "./screens/Timeline.jsx";
import Savings from "./screens/Savings.jsx";
import CravingSOS from "./screens/CravingSOS.jsx";
import Community from "./screens/Community.jsx";
import Profile from "./screens/Profile.jsx";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="center-screen muted">Loading ClearAir…</div>;
  }

  if (!user) return <AuthScreen />;

  if (!user.onboarded) return <Onboarding />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/savings" element={<Savings />} />
        <Route path="/community" element={<Community />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="/sos" element={<CravingSOS />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
