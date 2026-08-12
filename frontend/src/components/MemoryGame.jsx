import { useEffect, useRef, useState } from "react";

// Match-the-pairs memory game on a 4x3 grid — a quiet 60-ish second distraction.
const EMOJIS = ["🌱", "🔥", "💎", "🚀", "🐢", "⭐"];

function shuffled() {
  const cards = [...EMOJIS, ...EMOJIS].map((emoji, i) => ({ id: i, emoji }));
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export default function MemoryGame({ onDone }) {
  const [cards, setCards] = useState(shuffled);
  const [flipped, setFlipped] = useState([]); // ids currently face-up (max 2)
  const [matched, setMatched] = useState([]); // emojis already paired
  const [moves, setMoves] = useState(0);
  const lock = useRef(false);

  const won = matched.length === EMOJIS.length;

  useEffect(() => {
    if (won) {
      const id = setTimeout(onDone, 1500);
      return () => clearTimeout(id);
    }
  }, [won, onDone]);

  const flip = (card) => {
    if (lock.current || flipped.includes(card.id) || matched.includes(card.emoji)) return;
    const next = [...flipped, card.id];
    setFlipped(next);
    if (next.length < 2) return;
    setMoves((m) => m + 1);
    const [a, b] = next.map((id) => cards.find((c) => c.id === id));
    if (a.emoji === b.emoji) {
      setMatched((m) => [...m, a.emoji]);
      setFlipped([]);
    } else {
      lock.current = true;
      setTimeout(() => {
        setFlipped([]);
        lock.current = false;
      }, 700);
    }
  };

  const reset = () => {
    setCards(shuffled());
    setFlipped([]);
    setMatched([]);
    setMoves(0);
  };

  return (
    <div style={{ textAlign: "center", width: "100%" }}>
      <p className="muted">
        {won ? `Cleared in ${moves} moves! 🎉` : `Match the pairs · ${moves} moves`}
      </p>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8,
        maxWidth: 300, margin: "0.6rem auto",
      }}>
        {cards.map((c) => {
          const up = flipped.includes(c.id) || matched.includes(c.emoji);
          return (
            <button
              key={c.id}
              onClick={() => flip(c)}
              style={{
                aspectRatio: "1", padding: 0, borderRadius: 12, fontSize: "1.6rem",
                background: up ? "var(--surface)" : "var(--brand)",
                border: up ? "1px solid var(--border)" : "none",
                boxShadow: "var(--shadow-sm)",
                transition: "background 0.2s ease",
              }}
              aria-label={up ? c.emoji : "hidden card"}
            >
              {up ? c.emoji : ""}
            </button>
          );
        })}
      </div>
      <button className="ghost" style={{ fontSize: "0.8rem", padding: "0.3rem 0.9rem" }} onClick={reset}>
        Restart
      </button>
    </div>
  );
}
