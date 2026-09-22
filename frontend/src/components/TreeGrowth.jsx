// A refined little tree that grows with the number of vape-free days.
// Muted, low-saturation palette to keep the hero feeling calm and premium.
export default function TreeGrowth({ days = 0 }) {
  const g = Math.min(1, Math.log10(days + 1) / Math.log10(31)); // 0..1, full ~30 days
  const crown = 15 + g * 33;
  const trunkH = 20 + g * 34;
  const trunkTop = 150 - trunkH;

  return (
    <svg viewBox="0 0 220 168" width="100%" style={{ display: "block", maxHeight: 190, margin: "0 auto" }}>
      {/* soft ground shadow */}
      <ellipse cx="110" cy="152" rx="62" ry="10" fill="#17c3b2" opacity="0.1" />
      {/* ground disc */}
      <ellipse cx="110" cy="148" rx="58" ry="13" fill="#a7dbb8" />
      <ellipse cx="110" cy="145" rx="52" ry="11" fill="#8ed79c" />

      {/* trunk */}
      <rect x={107} y={trunkTop} width={7} height={trunkH} rx={3.5} fill="#a5764f" />

      {/* foliage — layered, vivid greens */}
      <circle cx={110} cy={trunkTop} r={crown} fill="#37b877" />
      <circle cx={110 - crown * 0.5} cy={trunkTop + crown * 0.22} r={crown * 0.68} fill="#3fc281" />
      <circle cx={110 + crown * 0.5} cy={trunkTop + crown * 0.22} r={crown * 0.68} fill="#33ac6f" />
      <circle cx={110} cy={trunkTop - crown * 0.42} r={crown * 0.66} fill="#45cd8a" />
    </svg>
  );
}
