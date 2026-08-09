import { useCallback, useEffect, useState } from "react";

// Minimal 2048 on a 4x4 grid. Slide + merge with on-screen arrows or keyboard.
const SIZE = 4;
const emptyGrid = () => Array(SIZE * SIZE).fill(0);

function spawn(grid) {
  const empties = grid.map((v, i) => (v === 0 ? i : -1)).filter((i) => i >= 0);
  if (!empties.length) return grid;
  const i = empties[Math.floor(Math.random() * empties.length)];
  const next = grid.slice();
  next[i] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

// Slide + merge one line (array of 4) to the left; returns [line, gained].
function slide(line) {
  const nums = line.filter((n) => n);
  let gained = 0;
  for (let i = 0; i < nums.length - 1; i++) {
    if (nums[i] === nums[i + 1]) {
      nums[i] *= 2;
      gained += nums[i];
      nums.splice(i + 1, 1);
    }
  }
  while (nums.length < SIZE) nums.push(0);
  return [nums, gained];
}

const getRow = (g, r) => g.slice(r * SIZE, r * SIZE + SIZE);
const setRow = (g, r, row) => { for (let c = 0; c < SIZE; c++) g[r * SIZE + c] = row[c]; };
const getCol = (g, c) => [0, 1, 2, 3].map((r) => g[r * SIZE + c]);
const setCol = (g, c, col) => { for (let r = 0; r < SIZE; r++) g[r * SIZE + c] = col[r]; };

const COLORS = {
  0: "var(--surface-2)", 2: "#3b4a5a", 4: "#45607a", 8: "#e0a458", 16: "#e08a3c",
  32: "#e0703c", 64: "#e05353", 128: "#17c3b2", 256: "#12a897", 512: "#0e8f80",
  1024: "#ffb703", 2048: "#ff5d5d",
};

export default function Game2048() {
  const [grid, setGrid] = useState(() => spawn(spawn(emptyGrid())));
  const [score, setScore] = useState(0);

  const move = useCallback((dir) => {
    setGrid((prev) => {
      const g = prev.slice();
      let gained = 0;
      let moved = false;
      const lines = dir === "left" || dir === "right"
        ? [0, 1, 2, 3].map((r) => ({ get: () => getRow(g, r), set: (l) => setRow(g, r, l) }))
        : [0, 1, 2, 3].map((c) => ({ get: () => getCol(g, c), set: (l) => setCol(g, c, l) }));
      const reverse = dir === "right" || dir === "down";
      for (const line of lines) {
        let arr = line.get();
        if (reverse) arr = arr.slice().reverse();
        const [slid, gain] = slide(arr);
        gained += gain;
        const final = reverse ? slid.slice().reverse() : slid;
        if (final.join() !== line.get().join()) moved = true;
        line.set(final);
      }
      if (!moved) return prev;
      setScore((s) => s + gained);
      return spawn(g);
    });
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      const map = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" };
      if (map[e.key]) { e.preventDefault(); move(map[e.key]); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move]);

  const reset = () => { setGrid(spawn(spawn(emptyGrid()))); setScore(0); };

  const Arrow = ({ dir, label }) => (
    <button className="ghost" style={{ padding: "0.6rem 1rem", fontSize: "1.2rem" }} onClick={() => move(dir)}>{label}</button>
  );

  return (
    <div style={{ textAlign: "center", width: "100%" }}>
      <p className="muted">Merge tiles — swipe with the arrows · Score: <strong>{score}</strong></p>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8,
        background: "var(--surface)", padding: 8, borderRadius: 12, maxWidth: 300, margin: "0.5rem auto",
      }}>
        {grid.map((v, i) => (
          <div key={i} style={{
            aspectRatio: "1", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
            background: COLORS[v] || "#ff5d5d", color: v > 4 ? "#fff" : "var(--text)",
            fontWeight: 800, fontSize: v >= 1024 ? "1rem" : "1.3rem",
          }}>{v || ""}</div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, marginTop: "0.5rem" }}>
        <Arrow dir="up" label="▲" />
        <div style={{ display: "flex", gap: 6 }}>
          <Arrow dir="left" label="◀" />
          <Arrow dir="down" label="▼" />
          <Arrow dir="right" label="▶" />
        </div>
      </div>
      <button className="ghost" style={{ marginTop: "0.7rem", fontSize: "0.8rem", padding: "0.3rem 0.9rem" }} onClick={reset}>Restart</button>
    </div>
  );
}
