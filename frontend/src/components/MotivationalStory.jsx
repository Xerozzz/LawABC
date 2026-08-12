import { useEffect, useState } from "react";

// Seedable list of short motivational messages. Extend / move server-side later.
const STORIES = [
  "This craving is a wave. It's peaking right now — give it 90 seconds and it drops. You just have to float, not fight.",
  "You don't have to quit forever right this second. You just have to get through the next minute. That's it. You've got this one.",
  "Nobody 'needs' a vape. That's the nicotine talking, not you. Wait it out and watch it get quieter.",
  "Real talk: you've said no before and survived every time. Your record against cravings is basically perfect.",
  "Think about future-you, waking up tomorrow proud they didn't cave tonight. Be that person's reason.",
  "It's okay that this is hard. Hard isn't the same as impossible — and you're already doing the hard part right now.",
];

// Vetted links to people who actually got out of the cycle — not just quotes.
const REAL_STORIES = [
  { label: "Teens on quitting vaping (FDA videos)", href: "https://digitalmedia.hhs.gov/tobacco/educator_hub/lesson-plans/risks-vaping-magazine/my-vaping-mistake-videos" },
  { label: "This Is Quitting — real young quitters", href: "https://truthinitiative.org/thisisquitting" },
  { label: "I Quit programme (HealthHub SG)", href: "https://www.healthhub.sg/programmes/iquit" },
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

      <div style={{ marginTop: "1.5rem", textAlign: "left" }}>
        <p className="muted" style={{ fontSize: "0.8rem", margin: "0 0 0.4rem" }}>
          People who actually got out of it:
        </p>
        <div className="stack" style={{ gap: "0.5rem" }}>
          {REAL_STORIES.map((s) => (
            <a
              key={s.href}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="card"
              style={{ textDecoration: "none", color: "inherit", padding: "0.7rem 0.9rem", fontSize: "0.85rem", fontWeight: 600 }}
            >
              {s.label} ↗
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
