// Partner / supporter logos, shown in a tasteful uniform strip.
// Each logo sits in its own white tile so mixed backgrounds (e.g. the dark
// Ministry of Law mark) stay consistent.
const LOGOS = [
  { src: "/logos/necdc.webp", alt: "North East Community Development Council" },
  { src: "/logos/probono-sg.png", alt: "Pro Bono SG" },
  { src: "/logos/minlaw.jpg", alt: "Ministry of Law, Singapore" },
  { src: "/logos/sglaw200.webp", alt: "SG Law 200" },
];

export default function SupportedBy({ compact = false }) {
  const tileH = compact ? 42 : 52;
  const imgH = compact ? 26 : 32;
  const imgW = compact ? 96 : 116;
  return (
    <div style={{ textAlign: "center", marginTop: compact ? "0.75rem" : "1.5rem", opacity: compact ? 0.9 : 1 }}>
      <div
        className="muted"
        style={{ fontSize: "0.66rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.6rem" }}
      >
        Supported by
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center", alignItems: "center" }}>
        {LOGOS.map((l) => (
          <div
            key={l.src}
            style={{
              background: "#fff",
              border: "1px solid var(--border)",
              borderRadius: 12,
              boxShadow: "var(--shadow-sm)",
              height: tileH,
              padding: "0.35rem 0.65rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={l.src}
              alt={l.alt}
              style={{ maxHeight: imgH, maxWidth: imgW, objectFit: "contain", display: "block" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
