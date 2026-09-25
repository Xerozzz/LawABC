import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import Icon from "./Icon.jsx";

const DOW = ["S", "M", "T", "W", "T", "F", "S"];
const dow = (ymd) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return DOW[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
};

function Cell({ day }) {
  const s = {
    width: "100%", aspectRatio: "1", borderRadius: 12,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "0.82rem", fontWeight: 700,
    background: "var(--surface-2)", color: "var(--text-dim)", border: "1px solid transparent",
  };
  if (day.active) Object.assign(s, { background: "var(--brand)", color: "#fff" });
  else if (day.opened || day.isToday) Object.assign(s, { background: "#fff", border: "1.5px dashed var(--brand)", color: "var(--brand)" });
  else if (day.isFuture) Object.assign(s, { background: "var(--surface-2)", color: "var(--text-dim)", opacity: 0.7 });

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "0.68rem", color: "var(--text-dim)", fontWeight: 600, marginBottom: 4 }}>{dow(day.date)}</div>
      <div style={s} title={`Day ${day.dayNumber}`}>
        {day.active ? <Icon name="check" size={16} /> : Number(day.date.slice(8, 10))}
      </div>
    </div>
  );
}

const Key = ({ style, label }) => (
  <span className="row" style={{ gap: "0.35rem" }}>
    <i style={{ width: 14, height: 14, borderRadius: 5, ...style }} /> {label}
  </span>
);

export default function ActivityGrid() {
  const { features } = useAuth();
  const [data, setData] = useState(null);
  useEffect(() => { api.getActivity().then(setData).catch(() => {}); }, []);
  if (!data) return null;

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <strong>{data.totalDays}-day check-in</strong>
          <p className="muted" style={{ margin: "0.2rem 0 0", fontSize: "0.82rem" }}>
            A day counts when you check in{features.community ? ", post" : ""} or use SOS.
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 800, fontSize: "1.5rem", color: "var(--brand)", letterSpacing: "-0.02em" }}>
            {data.activeDays}<span style={{ fontSize: "0.9rem" }}>/{data.totalDays}</span>
          </div>
          <div className="muted" style={{ fontSize: "0.72rem" }}>days active</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "0.45rem", marginTop: "0.9rem" }}>
        {data.days.map((d) => <Cell key={d.date} day={d} />)}
      </div>

      <div className="row" style={{ gap: "1rem", marginTop: "0.9rem", flexWrap: "wrap", fontSize: "0.74rem", color: "var(--text-dim)" }}>
        <Key style={{ background: "var(--brand)" }} label="Active" />
        <Key style={{ background: "#fff", border: "1.5px dashed var(--brand)" }} label="Opened only" />
        <Key style={{ background: "var(--surface-2)" }} label="Missed" />
      </div>
    </div>
  );
}
