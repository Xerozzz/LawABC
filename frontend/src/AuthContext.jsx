import { createContext, useContext, useEffect, useState } from "react";
import { api, getToken, setToken, clearToken } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On boot, if we have a token, load the profile.
  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api
      .getProfile()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setLoading(false));
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
