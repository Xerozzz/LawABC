import { useEffect, useRef, useState } from "react";
import { formatDay } from "./metrics.js";

// Column chart: participants active each day. One series, so no legend; the
// card title names it. Hover or focus a column for the exact numbers, and the
// table underneath has every value without hovering.
const HEIGHT = 200;
const PAD = { top: 12, right: 8, bottom: 26, left: 32 };

function niceMax(n) {
  if (n <= 4) return Math.max(1, n);
  const step = n <= 10 ? 2 : n <= 25 ? 5 : n <= 50 ? 10 : 25;
  return Math.ceil(n / step) * step;
}

function ticksFor(max) {
  const count = Math.min(max, 4);
  return Array.from({ length: count + 1 }, (_, i) => Math.round((max / count) * i));
}

// Column with a 4px rounded top and a square base.
function columnPath(x, y, w, h) {
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}

export default function DailyActiveChart({ rows }) {
  const wrap = useRef(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    const el = wrap.current;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const max = niceMax(Math.max(1, ...rows.map((r) => r.enrolled)));
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const slot = rows.length ? plotW / rows.length : 0;
  const barW = Math.max(2, Math.min(24, slot - 2));
  const y = (v) => PAD.top + plotH - (v / max) * plotH;
  // Label every k-th day so date labels never collide (~56px each).
  const every = Math.max(1, Math.ceil(56 / Math.max(slot, 1)));

  const tip = hover !== null ? rows[hover] : null;
  const tipX = hover !== null ? PAD.left + slot * hover + slot / 2 : 0;

  return (
    <div className="adm-chart" ref={wrap}>
      {width > 0 && (
        <svg width={width} height={HEIGHT} role="img" aria-label="Participants active each day">
          {ticksFor(max).map((t) => (
            <g key={t}>
              <line className="adm-grid" x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} />
              <text className="adm-axis" x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end">{t}</text>
            </g>
          ))}
          {rows.map((r, i) => {
            const x = PAD.left + slot * i + (slot - barW) / 2;
            const h = (r.active / max) * plotH;
            return (
              <g key={r.date}>
                {h > 0 && (
                  <path
                    className={`adm-col${hover === i ? " hover" : ""}`}
                    d={columnPath(x, y(r.active), barW, h)}
                  />
                )}
                {i % every === (rows.length - 1) % every && (
                  <text className="adm-axis" x={PAD.left + slot * i + slot / 2} y={HEIGHT - 8} textAnchor="middle">
                    {formatDay(r.date)}
                  </text>
                )}
                <rect
                  className="adm-hit"
                  x={PAD.left + slot * i}
                  y={PAD.top}
                  width={slot}
                  height={plotH}
                  tabIndex={0}
                  aria-label={`${formatDay(r.date, { weekday: true })}: ${r.active} of ${r.enrolled} active`}
                  onPointerEnter={() => setHover(i)}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                />
              </g>
            );
          })}
        </svg>
      )}
      {tip && (
        <div
          className="adm-tip"
          style={{ left: Math.min(Math.max(tipX, 70), width - 70), top: Math.max(0, y(tip.active) - 8) }}
        >
          <strong>{tip.active} active</strong>
          <span>of {tip.enrolled} in their study window</span>
          <span className="muted">{formatDay(tip.date, { weekday: true })}</span>
        </div>
      )}
    </div>
  );
}
