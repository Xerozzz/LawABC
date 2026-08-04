import { useNavigate } from "react-router-dom";

// NOTE: These are Singapore resources — verify and finalise with your programme
// partners (HPB / school counsellors) before the pilot; numbers can change.
const QUIT = [
  { name: "HPB QuitLine (I Quit programme)", detail: "Free quit coaching", tel: "1800 438 2000", href: "tel:+6518004382000" },
];

const CRISIS = [
  { name: "Samaritans of Singapore (SOS)", detail: "24-hour emotional support", tel: "1767", href: "tel:1767" },
  { name: "SOS CareText", detail: "WhatsApp support", tel: "9151 1767", href: "https://wa.me/6591511767" },
  { name: "IMH Mental Health Helpline", detail: "24-hour, all ages", tel: "6389 2222", href: "tel:+6563892222" },
];

function ResourceCard({ r }) {
  return (
    <a href={r.href} className="card" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
      <div className="row" style={{ justifyContent: "space-between", gap: "0.6rem" }}>
        <div>
          <strong>{r.name}</strong>
          <div className="muted" style={{ fontSize: "0.82rem" }}>{r.detail}</div>
        </div>
        <span className="badge" style={{ color: "var(--brand)", whiteSpace: "nowrap" }}>📞 {r.tel}</span>
      </div>
    </a>
  );
}

export default function Help() {
  const navigate = useNavigate();
  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1 className="h1" style={{ margin: 0 }}>Get help ⛑️</h1>
        <button className="ghost" style={{ padding: "0.4rem 0.8rem" }} onClick={() => navigate(-1)}>Back</button>
      </div>
      <p className="muted" style={{ marginTop: 0 }}>
        Reaching out is a strength. Real people are ready to support you — free and confidential.
      </p>

      <div className="error" style={{ background: "rgba(255,93,93,0.12)" }}>
        <strong>In immediate danger?</strong> Call <a href="tel:995" style={{ color: "#ffd5d5" }}>995</a> (emergency) right away.
      </div>

      <h3 style={{ margin: "0.5rem 0 0" }}>Quitting support</h3>
      {QUIT.map((r) => <ResourceCard key={r.name} r={r} />)}

      <h3 style={{ margin: "0.5rem 0 0" }}>Feeling overwhelmed?</h3>
      {CRISIS.map((r) => <ResourceCard key={r.name} r={r} />)}

      <p className="muted" style={{ fontSize: "0.75rem" }}>
        ClearAir provides support and general information, not medical advice or crisis counselling.
      </p>
    </div>
  );
}
