import { useEffect, useState } from "react";

// Short pep-talks, written like a friend texting you back. Extend / move server-side later.
const STORIES = [
  "ok real talk — the craving you're having right now? it peaks for like 90 seconds then it literally gives up. you can outlast 90 seconds of anything.",
  "you don't need to quit forever tonight. just don't vape for the next minute. then the one after. that's the whole game.",
  "that voice saying 'just one puff' — that's the nicotine negotiating, not you. it's scared because it's losing.",
  "quick maths: every craving you've survived so far, you survived. your record is literally undefeated.",
  "tomorrow-you is going to wake up either proud or annoyed. you get to pick, right now, for free.",
  "this being hard doesn't mean it's going wrong. it being hard IS it working. you're mid-rep right now.",
];

// Real people who got out of the cycle — plays right here, no leaving the app.
const REAL_STORIES = [
  { id: "nU4yiJ0SqRk", label: "How I quit vaping — Alora's story" },
  { id: "Wuqy5wl2duQ", label: "How I quit vaping in 2 weeks" },
  { id: "5bNHRztg8vQ", label: "How I quit nicotine after 10 years" },
  { id: "ukjsErHxpNs", label: "How I quit vaping (I'm a genius)" },
];

export default function MotivationalStory({ onDone }) {
  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState(60);
  const [video, setVideo] = useState(null);

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
          People who actually got out of it — tap to watch here:
        </p>
        {video && (
          <div
            style={{
              position: "relative", width: "100%", aspectRatio: "16 / 9",
              borderRadius: "var(--radius)", overflow: "hidden",
              border: "1px solid var(--border)", background: "#000", margin: "0 0 0.6rem",
            }}
          >
            <iframe
              key={video.id}
              src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`}
              title={video.label}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
            />
          </div>
        )}
        <div className="stack" style={{ gap: "0.5rem" }}>
          {REAL_STORIES.map((s) => (
            <button
              key={s.id}
              className="ghost"
              style={{
                textAlign: "left", fontSize: "0.85rem", padding: "0.7rem 0.9rem",
                borderColor: video?.id === s.id ? "var(--brand)" : undefined,
              }}
              onClick={() => setVideo(s)}
            >
              {video?.id === s.id ? "▶️ " : "🎬 "}{s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
