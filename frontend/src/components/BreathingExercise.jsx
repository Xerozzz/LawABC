import { useEffect, useRef, useState } from "react";

// 4-4-4 box-ish breathing for ~60 seconds.
const PHASES = [
  { label: "Breathe in", scale: 1.5, freq: 330 },
  { label: "Hold", scale: 1.5, freq: 392 },
  { label: "Breathe out", scale: 0.75, freq: 262 },
];
const PHASE_SECS = 4;
const TOTAL = 60;

export default function BreathingExercise({ onDone }) {
  const [remaining, setRemaining] = useState(TOTAL);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [phaseCount, setPhaseCount] = useState(PHASE_SECS);
  const [sound, setSound] = useState(false);
  const tick = useRef(0);
  const audioCtx = useRef(null);
  const drone = useRef(null);

  // Play a soft tone cue for the current phase (no audio files needed).
  const playCue = (freq) => {
    const ctx = audioCtx.current;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.6); // gentle fade in
    gain.gain.linearRampToValueAtTime(0, now + PHASE_SECS - 0.2); // and out
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + PHASE_SECS);
  };

  // Continuous calm background pad: two softly-detuned low sines.
  const startDrone = () => {
    const ctx = audioCtx.current;
    if (!ctx || drone.current) return;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 1.5);
    gain.connect(ctx.destination);
    const oscs = [110, 110.7].map((f) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      o.connect(gain);
      o.start();
      return o;
    });
    drone.current = { oscs, gain };
  };

  const stopDrone = () => {
    const d = drone.current;
    if (!d) return;
    const ctx = audioCtx.current;
    d.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
    d.oscs.forEach((o) => o.stop(ctx.currentTime + 0.5));
    drone.current = null;
  };

  useEffect(() => stopDrone, []); // silence the pad if we leave mid-exercise

  useEffect(() => {
    const id = setInterval(() => {
      tick.current += 1;
      setRemaining(Math.max(0, TOTAL - tick.current));
      const idx = Math.floor(tick.current / PHASE_SECS) % PHASES.length;
      setPhaseIdx(idx);
      setPhaseCount(PHASE_SECS - (tick.current % PHASE_SECS));
      if (sound && tick.current % PHASE_SECS === 0) playCue(PHASES[idx].freq);
      if (tick.current >= TOTAL) {
        clearInterval(id);
        onDone();
      }
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sound]);

  const toggleSound = () => {
    if (!sound) {
      // AudioContext must be created/resumed from a user gesture.
      audioCtx.current =
        audioCtx.current || new (window.AudioContext || window.webkitAudioContext)();
      audioCtx.current.resume?.();
      playCue(PHASES[phaseIdx].freq);
      startDrone();
    } else {
      stopDrone();
    }
    setSound((s) => !s);
  };

  const phase = PHASES[phaseIdx];
  const ringProgress = ((TOTAL - remaining) / TOTAL) * 100;

  return (
    <div style={{ textAlign: "center" }}>
      <p className="muted">Follow the circle · {remaining}s left</p>

      <div style={{ position: "relative", width: 240, height: 240, margin: "1.5rem auto" }}>
        {/* soft ripples radiating out to guide the rhythm */}
        <span className="breath-ripple" style={{ animationDelay: "0s" }} />
        <span className="breath-ripple" style={{ animationDelay: "2s" }} />
        {/* progress ring */}
        <svg viewBox="0 0 240 240" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
          <circle cx="120" cy="120" r="112" fill="none" stroke="var(--surface-2)" strokeWidth="8" />
          <circle
            cx="120" cy="120" r="112" fill="none" stroke="var(--brand)" strokeWidth="8"
            strokeLinecap="round" strokeDasharray={2 * Math.PI * 112}
            strokeDashoffset={2 * Math.PI * 112 * (1 - ringProgress / 100)}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        {/* breathing orb */}
        <div
          style={{
            position: "absolute", inset: "30px",
            borderRadius: "50%",
            background: "radial-gradient(circle at 40% 35%, var(--brand-2), var(--brand))",
            boxShadow: "0 0 40px rgba(23,195,178,0.5)",
            transform: `scale(${phase.scale})`,
            transition: `transform ${PHASE_SECS}s ease-in-out`,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            color: "#06231f", fontWeight: 800, fontSize: "1.15rem",
          }}
        >
          <span>{phase.label}</span>
          <span style={{ fontSize: "1.8rem", lineHeight: 1.1 }}>{phaseCount}</span>
        </div>
      </div>

      <button className="ghost" onClick={toggleSound} style={{ padding: "0.5rem 1rem" }}>
        {sound ? "🎵 Calm audio on" : "🔈 Play calm audio"}
      </button>
    </div>
  );
}
