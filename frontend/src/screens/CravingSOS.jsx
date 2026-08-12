import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import BreathingExercise from "../components/BreathingExercise.jsx";
import GamePicker from "../components/GamePicker.jsx";
import MotivationalStory from "../components/MotivationalStory.jsx";
import RandomVideo from "../components/RandomVideo.jsx";

const TOOLS = [
  { key: "breathing", icon: "🫁", label: "Breathe", desc: "60-second guided breathing" },
  { key: "game", icon: "🎮", label: "Play", desc: "Tap, 2048, Flappy or Memory" },
  { key: "video", icon: "📺", label: "Watch", desc: "A random chill video" },
  { key: "story", icon: "📖", label: "Real talk", desc: "Words + real quit stories" },
];

export default function CravingSOS() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState("choose"); // choose | run | checkin
  const [tool, setTool] = useState(null);
  const startedAt = useRef(null);

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
    try {
      await api.logCraving({ toolUsed: tool, outcome, ...coords });
    } catch {
      /* non-blocking */
    }
    navigate("/");
  };

  return (
    <div className="center-screen">
      {step === "choose" && (
        <>
          <button className="ghost" style={{ alignSelf: "flex-start", marginBottom: "0.5rem" }} onClick={() => navigate(-1)}>
            ← Back
          </button>
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 120, height: 120, borderRadius: "50%", margin: "0.5rem auto 1rem",
              background: "radial-gradient(circle at 40% 35%, #ff9d9d, var(--danger))",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 800, fontSize: "1rem", textAlign: "center",
              boxShadow: "0 14px 30px rgba(255,90,106,0.4)",
            }}>
              You've<br />got this
            </div>
            <h1 className="h1">Craving SOS</h1>
            <p className="muted">Cravings peak, then fade — ride this one out. Pick something for a minute.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "0.7rem", marginTop: "0.5rem" }}>
            {TOOLS.map((t) => (
              <button key={t.key} className="ghost" style={{ padding: "1rem 0.4rem", display: "flex", flexDirection: "column", gap: "0.35rem", alignItems: "center" }} onClick={() => start(t.key)}>
                <span style={{ fontSize: "1.8rem" }}>{t.icon}</span>
                <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>{t.label}</span>
                <span className="muted" style={{ fontSize: "0.68rem" }}>{t.desc}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {step === "run" && (
        <>
          {tool === "breathing" && <BreathingExercise onDone={() => setStep("checkin")} />}
          {tool === "game" && <GamePicker onDone={() => setStep("checkin")} />}
          {tool === "video" && <RandomVideo />}
          {tool === "story" && <MotivationalStory onDone={() => setStep("checkin")} />}
          <button className="ghost" style={{ marginTop: "1.5rem" }} onClick={() => setStep("checkin")}>
            I'm done
          </button>
        </>
      )}

      {step === "checkin" && (
        <>
          <h1 className="h1">How'd that go?</h1>
          <p className="muted">Be honest — no one's judging. It just helps you spot your patterns.</p>
          <div className="stack" style={{ marginTop: "1rem" }}>
            <button onClick={() => finishAndLog("passed")}>😌 The craving passed</button>
            <button className="ghost" onClick={() => finishAndLog("held")}>😤 Still tough, but I held on</button>
            <button className="ghost" onClick={() => finishAndLog("vaped")}>
              💨 I vaped — that's okay, keep going
            </button>
          </div>
          <p className="muted" style={{ marginTop: "1.2rem", fontSize: "0.85rem", textAlign: "center" }}>
            Struggling more than usual?{" "}
            <a href="#" onClick={(e) => { e.preventDefault(); navigate("/help"); }}>Find real support →</a>
          </p>
        </>
      )}
    </div>
  );
}
