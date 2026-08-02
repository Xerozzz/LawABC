import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import BreathingExercise from "../components/BreathingExercise.jsx";
import MiniGame from "../components/MiniGame.jsx";
import MotivationalStory from "../components/MotivationalStory.jsx";

const TOOLS = [
  { key: "breathing", icon: "🫁", label: "Breathe", desc: "60-second guided breathing" },
  { key: "game", icon: "🎮", label: "Distract", desc: "Quick tap mini-game" },
  { key: "story", icon: "📖", label: "Get inspired", desc: "A short motivational story" },
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
          <button className="ghost" style={{ alignSelf: "flex-start", marginBottom: "1rem" }} onClick={() => navigate(-1)}>
            ← Back
          </button>
          <h1 className="h1">Craving SOS 🆘</h1>
          <p className="muted">Urges peak and fade in a few minutes. Pick something to ride it out.</p>
          <div className="stack" style={{ marginTop: "1rem" }}>
            {TOOLS.map((t) => (
              <button key={t.key} className="ghost" style={{ textAlign: "left", padding: "1rem" }} onClick={() => start(t.key)}>
                <div style={{ fontSize: "1.6rem" }}>{t.icon}</div>
                <div style={{ fontWeight: 700 }}>{t.label}</div>
                <div className="muted" style={{ fontSize: "0.85rem" }}>{t.desc}</div>
              </button>
            ))}
          </div>
        </>
      )}

      {step === "run" && (
        <>
          {tool === "breathing" && <BreathingExercise onDone={() => setStep("checkin")} />}
          {tool === "game" && <MiniGame onDone={() => setStep("checkin")} />}
          {tool === "story" && <MotivationalStory onDone={() => setStep("checkin")} />}
          <button className="ghost" style={{ marginTop: "1.5rem" }} onClick={() => setStep("checkin")}>
            I'm done
          </button>
        </>
      )}

      {step === "checkin" && (
        <>
          <h1 className="h1">How do you feel now?</h1>
          <p className="muted">Logging this helps you spot patterns over time.</p>
          <div className="stack" style={{ marginTop: "1rem" }}>
            <button onClick={() => finishAndLog("passed")}>😌 The craving passed</button>
            <button className="ghost" onClick={() => finishAndLog("unknown")}>😐 Still tough, but holding on</button>
            <button className="ghost" onClick={() => finishAndLog("vaped")}>
              💨 I vaped — that's okay, keep going
            </button>
          </div>
        </>
      )}
    </div>
  );
}
