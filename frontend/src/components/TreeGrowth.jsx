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
      <ellipse cx="110" cy="152" rx="62" ry="10" fill="#0d9488" opacity="0.08" />
      {/* ground disc */}
      <ellipse cx="110" cy="148" rx="58" ry="13" fill="#cfe3da" />
      <ellipse cx="110" cy="145" rx="52" ry="11" fill="#bcd8cc" />

      {/* trunk */}
      <rect x={107} y={trunkTop} width={7} height={trunkH} rx={3.5} fill="#9c7a58" />

      {/* foliage — layered, muted forest greens */}
      <circle cx={110} cy={trunkTop} r={crown} fill="#3f9d78" />
      <circle cx={110 - crown * 0.5} cy={trunkTop + crown * 0.22} r={crown * 0.68} fill="#4aa886" />
      <circle cx={110 + crown * 0.5} cy={trunkTop + crown * 0.22} r={crown * 0.68} fill="#399270" />
      <circle cx={110} cy={trunkTop - crown * 0.42} r={crown * 0.66} fill="#52b191" />
    </svg>
  );
}
