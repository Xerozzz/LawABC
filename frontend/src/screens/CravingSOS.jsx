import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import BreathingExercise from "../components/BreathingExercise.jsx";
import GamePicker from "../components/GamePicker.jsx";
import MotivationalStory from "../components/MotivationalStory.jsx";
import RandomVideo from "../components/RandomVideo.jsx";
import Icon from "../components/Icon.jsx";

const TOOLS = [
  { key: "breathing", icon: "wind", tint: "#e5f7f0", color: "#0b6b62", label: "Breathe", desc: "60 seconds, guided" },
  { key: "game", icon: "gamepad", tint: "#ece9fb", color: "#6a5bd6", label: "Play", desc: "Tap Rush, 2048, Flappy, Memory" },
  { key: "video", icon: "play", tint: "#e5eefb", color: "#3b6fd0", label: "Watch", desc: "A calm chill video" },
  { key: "story", icon: "chat", tint: "#fdf1d6", color: "#b7791f", label: "Real talk", desc: "Quit stories from people who made it" },
];

const TOTAL = 180;

export default function CravingSOS() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState("choose");
  const [tool, setTool] = useState(null);
  const [stats, setStats] = useState(null);
  const [left, setLeft] = useState(TOTAL);
  const startedAt = useRef(null);

  useEffect(() => { api.getCravingStats().then(setStats).catch(() => {}); }, []);
  useEffect(() => {
    if (step !== "choose") return;
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [step]);

  const start = (t) => {
    setTool(t);
    setStep("run");
    startedAt.current = Date.now();
    api.logEvent("sos_started", { tool: t });
  };

  const finishAndLog = async (outcome) => {
    let coords = {};
    if (user?.consentLocation && "geolocation" in navigator) {
      coords = await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
          () => resolve({}),
          { timeout: 4000 }
        );
      });
    }
    try { await api.logCraving({ toolUsed: tool, outcome, ...coords }); } catch { /* non-blocking */ }
    navigate("/");
  };

  const beaten = stats?.beaten ?? 0;
  const mm = Math.floor(left / 60), ss = String(left % 60).padStart(2, "0");
  const R = 88, C = 2 * Math.PI * R, elapsed = (TOTAL - left) / TOTAL;

  if (step === "choose") {
    return (
      <div style={{ minHeight: "100%", background: "#fdeeed", padding: "1.1rem 1.1rem 2rem" }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }} className="stack">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <button className="circle-btn" onClick={() => navigate(-1)} aria-label="Close" style={{ fontSize: "1.15rem", color: "var(--text)" }}>✕</button>
            <strong style={{ color: "var(--danger)" }}>Craving SOS</strong>
            <span style={{ width: 42 }} />
          </div>

          {/* countdown ring */}
          <div style={{ position: "relative", width: 210, height: 210, margin: "0.5rem auto 0" }}>
            <svg viewBox="0 0 210 210" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
              <circle cx="105" cy="105" r={R} fill="none" stroke="#f6d8d6" strokeWidth="12" />
              <circle cx="105" cy="105" r={R} fill="none" stroke="var(--danger)" strokeWidth="12"
                strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - elapsed)}
                style={{ transition: "stroke-dashoffset 1s linear" }} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: "2.6rem", fontWeight: 800, letterSpacing: "-0.03em", color: "#12212e" }}>{mm}:{ss}</div>
              <div className="muted" style={{ fontSize: "0.85rem" }}>{left > 0 ? "until this wave eases" : "the wave has passed"}</div>
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <h1 className="h1" style={{ fontSize: "1.6rem", margin: "0.3rem 0 0.2rem" }}>It peaks, then it fades.</h1>
            <p className="muted" style={{ margin: 0 }}>Pick one thing to do for a minute.</p>
          </div>

          {/* 2x2 activity grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7rem" }}>
            {TOOLS.map((t) => (
              <button key={t.key} className="card" onClick={() => start(t.key)}
                style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "0.5rem", background: "#fff", boxShadow: "var(--shadow-sm)", padding: "1rem" }}>
                <span className="ico-chip" style={{ background: t.tint, color: t.color, width: 40, height: 40 }}><Icon name={t.icon} size={20} /></span>
                <strong>{t.label}</strong>
                <span className="muted" style={{ fontSize: "0.78rem", lineHeight: 1.3 }}>{t.desc}</span>
              </button>
            ))}
          </div>

          {/* reassurance */}
          <div className="card row" style={{ gap: "0.7rem", background: "#fff" }}>
            <span className="ico-chip" style={{ background: "#fdeaea", color: "var(--danger)", width: 40, height: 40 }}><Icon name="shield" size={20} /></span>
            <div style={{ fontSize: "0.9rem" }}>
              <strong>You have beaten {beaten} craving{beaten === 1 ? "" : "s"} already.</strong>{" "}
              <span className="muted">This one is number {beaten + 1}.</span>
            </div>
          </div>

          <p className="muted" style={{ textAlign: "center", fontSize: "0.88rem" }}>
            Need a real person?{" "}
            <a href="#" onClick={(e) => { e.preventDefault(); navigate("/help"); }} style={{ color: "var(--danger)", fontWeight: 700 }}>Get help now</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="center-screen">
      {step === "run" && (
        <>
          {tool === "breathing" && <BreathingExercise onDone={() => setStep("checkin")} />}
          {tool === "game" && <GamePicker onDone={() => setStep("checkin")} />}
          {tool === "video" && <RandomVideo />}
          {tool === "story" && <MotivationalStory onDone={() => setStep("checkin")} />}
          <button className="ghost" style={{ marginTop: "1.5rem" }} onClick={() => setStep("checkin")}>I'm done</button>
        </>
      )}

      {step === "checkin" && (
        <>
          <h1 className="h1">How did that go?</h1>
          <p className="muted">Be honest — no one's judging. It just helps you spot your patterns.</p>
          <div className="stack" style={{ marginTop: "1rem" }}>
            <button onClick={() => finishAndLog("passed")}>The craving passed</button>
            <button className="ghost" onClick={() => finishAndLog("held")}>Still tough, but I held on</button>
            <button className="ghost" onClick={() => finishAndLog("vaped")}>I vaped — that's okay, keep going</button>
          </div>
          <p className="muted" style={{ marginTop: "1.2rem", fontSize: "0.85rem", textAlign: "center" }}>
            Struggling more than usual?{" "}
            <a href="#" onClick={(e) => { e.preventDefault(); navigate("/help"); }}>Find real support</a>
          </p>
        </>
      )}
    </div>
  );
}
