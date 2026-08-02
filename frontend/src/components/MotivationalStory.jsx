import { useEffect, useState } from "react";

// Seedable list of short motivational messages. Extend / move server-side later.
const STORIES = [
  "This craving is a wave. Waves rise, crest, and always fall. You just have to float for a minute.",
  "Your lungs are already thanking you. Every hour without vaping, they heal a little more.",
  "You are not giving something up — you're taking your health, money, and freedom back.",
  "The urge feels loud, but it's temporary. You are stronger and you last longer than it does.",
  "Think of what you're saving for. That reward gets closer every time you say no.",
  "You've beaten cravings before. This is just one more, and you already know how it ends.",
];

export default function MotivationalStory({ onDone }) {
  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState(60);

  useEffect(() => {
    // pick a starting story based on the current minute (no Math.random needed)
    setIdx(new Date().getMinutes() % STORIES.length);
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

  return (
    <div style={{ textAlign: "center" }}>
      <p className="muted">Take a breath and read · {remaining}s</p>
      <div className="card" style={{ fontSize: "1.15rem", lineHeight: 1.5, margin: "1.5rem 0" }}>
        “{STORIES[idx]}”
      </div>
      <button className="ghost" onClick={() => setIdx((i) => (i + 1) % STORIES.length)}>
        Another one →
      </button>
    </div>
  );
}
