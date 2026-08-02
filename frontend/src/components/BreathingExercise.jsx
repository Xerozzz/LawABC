import { useEffect, useRef, useState } from "react";

// 4-4-4 breathing cycle for ~60 seconds.
const PHASES = [
  { label: "Breathe in", scale: 1.4 },
  { label: "Hold", scale: 1.4 },
  { label: "Breathe out", scale: 0.8 },
];
const PHASE_SECS = 4;
const TOTAL = 60;

export default function BreathingExercise({ onDone }) {
  const [remaining, setRemaining] = useState(TOTAL);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const tick = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      tick.current += 1;
      setRemaining((r) => Math.max(0, TOTAL - tick.current));
      setPhaseIdx(Math.floor(tick.current / PHASE_SECS) % PHASES.length);
      if (tick.current >= TOTAL) {
        clearInterval(id);
        onDone();
      }
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const phase = PHASES[phaseIdx];

  return (
    <div style={{ textAlign: "center" }}>
      <p className="muted">Follow the circle · {remaining}s left</p>
      <div
        style={{
          margin: "2rem auto",
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: "radial-gradient(circle, var(--brand-2), var(--brand))",
          transform: `scale(${phase.scale})`,
          transition: `transform ${PHASE_SECS}s ease-in-out`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#06231f",
          fontWeight: 800,
          fontSize: "1.1rem",
        }}
      >
        {phase.label}
      </div>
    </div>
  );
}
