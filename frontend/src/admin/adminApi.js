// API client for the /admin page. Kept apart from api.js: the admin session
// lives in sessionStorage (gone when the tab closes) and never mixes with a
// participant's token.
const API_URL = import.meta.env.VITE_API_URL || "";
const SESSION_KEY = "clearair_admin_session";

export const getSession = () => {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
};
const setSession = (s) => sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
export const clearSession = () => sessionStorage.removeItem(SESSION_KEY);

// Thrown when the session is missing, expired or revoked, so the page can
// drop back to the sign-in form.
export class SignedOut extends Error {}

async function request(path, { method = "GET", body, raw = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getSession()?.token;
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/api/admin${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && path !== "/login") {
    clearSession();
    throw new SignedOut("Your session has ended. Please sign in again.");
  }
  if (raw && res.ok) return res;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const adminApi = {
  login: async (username, password) => {
    const s = await request("/login", { method: "POST", body: { username, password } });
    setSession(s);
    return s;
  },
  me: () => request("/me"),
  participation: () => request("/participation"),
  userLogs: (id) => request(`/users/${id}/logs`),

  // The payout spreadsheet. Fetched with the session header, then handed to
  // the browser as a download.
  downloadCsv: async () => {
    const res = await request("/participation.csv", { raw: true });
    const name =
      /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") || "")?.[1] ||
      "clearair-participation.csv";
    const url = URL.createObjectURL(await res.blob());
    const a = Object.assign(document.createElement("a"), { href: url, download: name });
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};
