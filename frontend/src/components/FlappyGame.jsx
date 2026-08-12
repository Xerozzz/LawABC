import { useEffect, useRef, useState } from "react";

// Simple Flappy-style game on a canvas. Tap / click / space to flap.
const W = 320, H = 420;
const GRAVITY = 0.45, FLAP = -7.2, SPEED = 2.2, PIPE_W = 52, GAP = 130, SPAWN = 95;

export default function FlappyGame() {
  const canvasRef = useRef(null);
  const raf = useRef(0);
  const state = useRef(null);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const [started, setStarted] = useState(false);

  const reset = () => {
    state.current = { y: H / 2, vy: 0, pipes: [], t: 0, score: 0, dead: false, started: false };
    setScore(0); setOver(false); setStarted(false);
  };

  const flap = () => {
    const s = state.current;
    if (s.dead) { reset(); return; }
    if (!s.started) { s.started = true; setStarted(true); }
    s.vy = FLAP;
  };

  // Runs once: the loop reads game state (incl. started) from the ref, so
  // starting doesn't re-run the effect (which used to reset the game instantly).
  useEffect(() => {
    reset();
    const ctx = canvasRef.current.getContext("2d");

    const draw = () => {
      const s = state.current;
      // background
      ctx.fillStyle = "#0f1720"; ctx.fillRect(0, 0, W, H);
      // pipes
      ctx.fillStyle = "#17c3b2";
      for (const p of s.pipes) {
        ctx.fillRect(p.x, 0, PIPE_W, p.gapY);
        ctx.fillRect(p.x, p.gapY + GAP, PIPE_W, H - p.gapY - GAP);
      }
      // bird
      ctx.fillStyle = "#ffb703";
      ctx.beginPath();
      ctx.arc(80, s.y, 12, 0, Math.PI * 2);
      ctx.fill();
      // score
      ctx.fillStyle = "#eaf2f8";
      ctx.font = "bold 22px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(String(s.score), W / 2, 40);
    };

    const step = () => {
      const s = state.current;
      if (s.started && !s.dead) {
        s.vy += GRAVITY;
        s.y += s.vy;
        s.t++;
        if (s.t % SPAWN === 0) {
          const gapY = 50 + Math.random() * (H - GAP - 100);
          s.pipes.push({ x: W, gapY, passed: false });
        }
        for (const p of s.pipes) {
          p.x -= SPEED;
          if (!p.passed && p.x + PIPE_W < 80) { p.passed = true; s.score++; setScore(s.score); }
          // collision
          const inX = 80 + 12 > p.x && 80 - 12 < p.x + PIPE_W;
          const inGap = s.y - 12 > p.gapY && s.y + 12 < p.gapY + GAP;
          if (inX && !inGap) s.dead = true;
        }
        s.pipes = s.pipes.filter((p) => p.x + PIPE_W > 0);
        if (s.y > H - 12 || s.y < 12) s.dead = true;
        if (s.dead) setOver(true);
      }
      draw();
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ textAlign: "center", width: "100%" }}>
      <p className="muted">{over ? "Ouch! Tap to try again" : started ? `Score: ${score}` : "Tap to start & flap"}</p>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        onClick={flap}
        onTouchStart={(e) => { e.preventDefault(); flap(); }}
        style={{ width: "100%", maxWidth: W, borderRadius: 12, border: "1px solid var(--border)", touchAction: "none", cursor: "pointer" }}
      />
    </div>
  );
}
