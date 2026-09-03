import { useState } from "react";
import { api } from "../api.js";
import MiniGame from "./MiniGame.jsx";
import Game2048 from "./Game2048.jsx";
import FlappyGame from "./FlappyGame.jsx";
import MemoryGame from "./MemoryGame.jsx";

const GAMES = [
  { key: "tap", label: "Tap Rush", icon: "🎯", Comp: MiniGame },
  { key: "2048", label: "2048", icon: "🔢", Comp: Game2048 },
  { key: "flappy", label: "Flappy", icon: "🐦", Comp: FlappyGame },
  { key: "memory", label: "Memory", icon: "🃏", Comp: MemoryGame },
];

export default function GamePicker({ onDone }) {
  const [game, setGame] = useState(null);

  const play = (g) => {
    setGame(g);
    api.logEvent("game_played", { game: g.key });
  };

  if (game) {
    const C = game.Comp;
    return (
      <div style={{ width: "100%" }}>
        <button className="ghost" style={{ marginBottom: "0.5rem", padding: "0.3rem 0.8rem" }} onClick={() => setGame(null)}>
          ← Other games
        </button>
        <C onDone={onDone} />
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", width: "100%" }}>
      <p className="muted">Pick something to get lost in for a minute</p>
      <div style={{ display: "flex", gap: "0.6rem", justifyContent: "center", flexWrap: "wrap", marginTop: "0.6rem" }}>
        {GAMES.map((g) => (
          <button key={g.key} className="ghost" style={{ padding: "1rem", minWidth: 92 }} onClick={() => play(g)}>
            <div style={{ fontSize: "1.7rem" }}>{g.icon}</div>
            <div style={{ fontSize: "0.85rem" }}>{g.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
