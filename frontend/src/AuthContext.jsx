import { createContext, useContext, useEffect, useState } from "react";
import { api, getToken, setToken, clearToken } from "./api.js";

const AuthContext = createContext(null);

// Until the server says otherwise, switchable features stay off (fail closed).
const DEFAULT_FEATURES = { community: false };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [features, setFeatures] = useState(DEFAULT_FEATURES);
  const [loading, setLoading] = useState(true);

  // On boot, load which features are on and, if we have a token, the profile.
  // Both finish before first render so the tabs don't flicker.
  useEffect(() => {
    const config = api
      .getConfig()
      .then((c) => setFeatures({ ...DEFAULT_FEATURES, ...c.features }))
      .catch(() => {});
    const profile = getToken()
      ? api.getProfile().then(setUser).catch(() => clearToken())
      : null;
    Promise.all([config, profile]).finally(() => setLoading(false));
  }, []);

  const handleAuth = async (fn) => {
    const { token } = await fn();
    setToken(token);
    const profile = await api.getProfile();
    setUser(profile);
    return profile;
  };

  const value = {
    user,
    features,
    loading,
    setUser,
    login: (email, password) => handleAuth(() => api.login(email, password)),
    register: (email, password) => handleAuth(() => api.register(email, password)),
    logout: () => {
      clearToken();
      setUser(null);
    },
    refreshProfile: () => api.getProfile().then(setUser),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
