// Empty string => same-origin relative "/api" calls (production: Express serves
// the built app + API together). In dockerized dev, VITE_API_URL points at the
// backend container; in local `npm run dev`, the Vite proxy (vite.config.js)
// forwards /api to localhost:4000.
const API_URL = import.meta.env.VITE_API_URL || "";

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
  acceptConsent: () => request("/profile/consent", { method: "POST" }),
  exportData: () => request("/profile/export"),
  deleteAccount: () => request("/profile", { method: "DELETE" }),

  // Fire-and-forget analytics; never let logging break the UI.
  logEvent: (type, meta) =>
    request("/events", { method: "POST", body: { type, meta } }).catch(() => {}),
  // The user's own 14-day participation grid.
  getActivity: () => request("/events/activity"),

  getMilestones: () => request("/milestones"),
  getSavings: () => request("/savings"),

  logCraving: (payload) => request("/cravings", { method: "POST", body: payload }),
  getCravings: () => request("/cravings"),
  getCravingStats: () => request("/cravings/stats"),
  deleteCraving: (id) => request(`/cravings/${id}`, { method: "DELETE" }),
  clearCravings: () => request("/cravings", { method: "DELETE" }),

  getNotifications: () => request("/notifications"),
  markNotificationsRead: () => request("/notifications/read", { method: "POST" }),

  getReflections: (params = {}) => {
    const q = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
    ).toString();
    return request(`/reflections${q ? `?${q}` : ""}`);
  },
  postReflection: (body, opts = {}) =>
    request("/reflections", { method: "POST", body: { body, ...opts } }),
  reportReflection: (id) => request(`/reflections/${id}/report`, { method: "POST" }),
  joinReflection: (id) => request(`/reflections/${id}/join`, { method: "POST" }),
  getDailyPrompt: () => request("/reflections/prompt"),

  getRewards: () => request("/rewards"),
  unlockReward: (itemKey) => request("/rewards/unlock", { method: "POST", body: { itemKey } }),
  selectReward: (itemKey) => request("/rewards/select", { method: "POST", body: { itemKey } }),

  getVapidKey: () => request("/push/vapid-public-key"),
  subscribePush: (subscription) => request("/push/subscribe", { method: "POST", body: { subscription } }),
  testPush: () => request("/push/test", { method: "POST" }),
};
