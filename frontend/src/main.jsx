import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./AuthContext.jsx";
import "./theme.css";

// The study team's dashboard. Loaded only on /admin, so participants never
// download it, and it skips the participant sign-in/consent/onboarding flow.
const AdminApp = lazy(() => import("./admin/AdminApp.jsx"));
const isAdmin = /^\/admin(\/|$)/.test(window.location.pathname);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {isAdmin ? (
      <Suspense fallback={<div className="center-screen muted">Loading…</div>}>
        <AdminApp />
      </Suspense>
    ) : (
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    )}
  </React.StrictMode>
);
