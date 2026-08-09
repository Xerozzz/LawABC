// A little tree on a floating island that grows with the number of vape-free days.
export default function TreeGrowth({ days = 0 }) {
  // Growth stage 0..1 (reaches near-full around ~30 days).
  const g = Math.min(1, Math.log10(days + 1) / Math.log10(31));
  const crown = 14 + g * 34; // foliage radius
  const trunkH = 18 + g * 34;
  const trunkTop = 150 - trunkH;

  return (
    <svg viewBox="0 0 220 170" width="100%" style={{ display: "block", maxHeight: 200, margin: "0 auto" }}>
      {/* clouds */}
      <g fill="#ffffff" opacity="0.9">
        <ellipse cx="42" cy="34" rx="20" ry="11" />
        <ellipse cx="60" cy="34" rx="14" ry="9" />
        <ellipse cx="176" cy="52" rx="16" ry="9" />
        <ellipse cx="190" cy="52" rx="11" ry="7" />
      </g>

      {/* floating island */}
      <ellipse cx="110" cy="150" rx="66" ry="16" fill="#7cc98d" />
      <path d="M44 150 q66 40 132 0 q-20 26 -66 26 q-46 0 -66 -26Z" fill="#9a7350" />
      <ellipse cx="110" cy="146" rx="60" ry="12" fill="#8ed79c" />

      {/* trunk */}
      <rect x={106} y={trunkTop} width={8} height={trunkH} rx={4} fill="#a5764f" />

      {/* foliage — layered for a fuller look as it grows */}
      <circle cx={110} cy={trunkTop} r={crown} fill="#37b877" />
      <circle cx={110 - crown * 0.55} cy={trunkTop + crown * 0.2} r={crown * 0.7} fill="#3fc281" />
      <circle cx={110 + crown * 0.55} cy={trunkTop + crown * 0.2} r={crown * 0.7} fill="#33ac6f" />
      <circle cx={110} cy={trunkTop - crown * 0.4} r={crown * 0.7} fill="#45cd8a" />

      {/* a couple of birds / sparkles once it's grown a bit */}
      {g > 0.4 && (
        <g stroke="#10384f" strokeWidth="1.6" fill="none" opacity="0.5" strokeLinecap="round">
          <path d="M150 40 q4 -4 8 0 q4 -4 8 0" />
        </g>
      )}
    </svg>
  );
}
