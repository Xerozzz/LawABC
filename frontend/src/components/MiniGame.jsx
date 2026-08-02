import { useEffect, useRef, useState } from "react";

// Tap-the-target distraction. Runs ~60s and counts taps.
const TOTAL = 60;

export default function MiniGame({ onDone }) {
  const [remaining, setRemaining] = useState(TOTAL);
  const [score, setScore] = useState(0);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const seed = useRef(1);

  // simple deterministic-ish PRNG so we don't rely on Math.random ordering
  const rand = () => {
    seed.current = (seed.current * 1103515245 + 12345) & 0x7fffffff;
    return (seed.current % 1000) / 1000;
  };

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          onDone();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hit = () => {
    setScore((s) => s + 1);
    setPos({ x: 10 + rand() * 80, y: 10 + rand() * 80 });
  };

  return (
    <div style={{ textAlign: "center", width: "100%" }}>
      <p className="muted">Pop as many as you can · {remaining}s left</p>
      <div style={{ fontWeight: 800, fontSize: "1.4rem", marginBottom: "0.5rem" }}>Score: {score}</div>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: 320,
          background: "var(--surface-2)",
          borderRadius: "var(--radius)",
          overflow: "hidden",
          border: "1px solid var(--border)",
        }}
      >
        <button
          onClick={hit}
          style={{
            position: "absolute",
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            transform: "translate(-50%, -50%)",
            width: 56,
            height: 56,
            padding: 0,
            fontSize: "1.6rem",
            background: "var(--accent)",
          }}
          aria-label="target"
        >
          🎯
        </button>
      </div>
    </div>
  );
}
