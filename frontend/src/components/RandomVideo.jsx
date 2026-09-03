import { useEffect, useState } from "react";
import { api } from "../api.js";

// Curated distraction videos (satisfying / calming — vetted, extend over time).
// Embedded via youtube-nocookie; "watch on YouTube" as a fallback if embeds fail.
const VIDEOS = [
  { id: "ezTAhDES8bQ", label: "Oddly satisfying + calming music" },
  { id: "q0M_RCex2CY", label: "Satisfying video with cozy lo-fi" },
  { id: "2-zpJwVmcwE", label: "Relaxing before-sleep satisfying mix" },
  { id: "safMZrxWkSs", label: "Try not to say WOW" },
  { id: "AM59mw2Yh18", label: "Satisfying & relaxing lo-fi mix" },
  { id: "B6GSz2eI6j4", label: "Deep-chill satisfying video" },
  { id: "7Lzvcy8xgrQ", label: "Calming satisfying mix" },
  { id: "jfKfPfyJRdk", label: "Lo-fi beats to chill to" },
];

export default function RandomVideo() {
  // pick a starting video based on the current minute (same trick as the stories)
  const [idx, setIdx] = useState(() => new Date().getMinutes() % VIDEOS.length);
  const video = VIDEOS[idx];

  useEffect(() => {
    api.logEvent("video_watched", { video: video.id });
  }, [video.id]);

  return (
    <div style={{ textAlign: "center", width: "100%" }}>
      <p className="muted">Zone out for a bit — the craving fades while you watch</p>
      <div
        style={{
          position: "relative", width: "100%", aspectRatio: "16 / 9",
          borderRadius: "var(--radius)", overflow: "hidden",
          border: "1px solid var(--border)", background: "#000", margin: "0.6rem 0",
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
      <div className="row" style={{ justifyContent: "center", gap: "0.5rem" }}>
        <button className="ghost" onClick={() => setIdx((i) => (i + 1) % VIDEOS.length)}>
          🔀 Another one
        </button>
        <a
          className="muted"
          style={{ fontSize: "0.8rem" }}
          href={`https://www.youtube.com/watch?v=${video.id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open in YouTube ↗
        </a>
      </div>
    </div>
  );
}
