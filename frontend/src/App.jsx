import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function App() {
  const [health, setHealth] = useState("checking...");
  const [dbTime, setDbTime] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/health`)
      .then((res) => res.json())
      .then((data) => setHealth(data.status))
      .catch(() => setHealth("unreachable"));

    fetch(`${API_URL}/api/db-time`)
      .then((res) => res.json())
      .then((data) => setDbTime(data.now))
      .catch(() => setDbTime("error"));
  }, []);

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", maxWidth: 640, margin: "0 auto" }}>
      <h1>LawABC</h1>
      <p>Skeleton full-stack app.</p>
      <ul>
        <li>Backend health: <strong>{health}</strong></li>
        <li>Database time: <strong>{dbTime ?? "loading..."}</strong></li>
      </ul>
    </main>
  );
}
