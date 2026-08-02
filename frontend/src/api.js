const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const TOKEN_KEY = "clearair_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function request(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  register: (email, password) =>
    request("/auth/register", { method: "POST", body: { email, password } }),
  login: (email, password) =>
    request("/auth/login", { method: "POST", body: { email, password } }),

  getProfile: () => request("/profile"),
  updateProfile: (patch) => request("/profile", { method: "PUT", body: patch }),

  getMilestones: () => request("/milestones"),
  getSavings: () => request("/savings"),

  logCraving: (payload) => request("/cravings", { method: "POST", body: payload }),
  getCravings: () => request("/cravings"),
  getCravingStats: () => request("/cravings/stats"),

  getReflections: (milestoneId) =>
    request(`/reflections${milestoneId ? `?milestoneId=${milestoneId}` : ""}`),
  postReflection: (body, milestoneId) =>
    request("/reflections", { method: "POST", body: { body, milestoneId } }),
  reportReflection: (id) => request(`/reflections/${id}/report`, { method: "POST" }),
};
