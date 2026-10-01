import { useEffect, useMemo, useState } from "react";
import { adminApi, SignedOut } from "./adminApi.js";
import DailyActiveChart from "./DailyActiveChart.jsx";
import {
  dailyActive, formatDay, lastActiveLabel, participantStats,
  QUIET_DAYS, REGULAR_RATE, SOMETIMES_RATE,
} from "./metrics.js";

const SORTS = {
  attention: { label: "Needs attention first", fn: (a, b) => attentionRank(a) - attentionRank(b) || (a.s.rate ?? 1) - (b.s.rate ?? 1) },
  newest: { label: "Newest first", fn: (a, b) => b.p.startDate.localeCompare(a.p.startDate) || b.p.userId - a.p.userId },
  active: { label: "Most active days", fn: (a, b) => b.p.activeDays - a.p.activeDays },
};
// Gone quiet mid-study first, then everyone else still in their window, then finished.
const attentionRank = ({ s }) => (s.goneQuiet ? 0 : s.inWindow ? 1 : 2);

export default function Dashboard({ onOpen, onSignedOut }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState("attention");

  const load = () => {
    setLoading(true);
    setError("");
    adminApi
      .participation()
      .then(setData)
      .catch((e) => (e instanceof SignedOut ? onSignedOut(e.message) : setError(e.message)))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const rows = useMemo(
    () => (data ? data.participants.map((p) => ({ p, s: participantStats(p, data.today) })) : []),
    [data]
  );
  const daily = useMemo(() => (data ? dailyActive(data.participants, data.today) : []), [data]);

  if (!data) {
    return error ? <div className="error">{error}</div> : <p className="muted">Loading participants…</p>;
  }

  const inWindow = rows.filter((r) => r.s.inWindow);
  const finished = rows.filter((r) => r.p.complete);
  const activeToday = inWindow.filter((r) => r.p.days.find((d) => d.date === data.today)?.active).length;
  const regular = rows.filter((r) => r.s.status.key === "regular").length;
  const quiet = rows.filter((r) => r.s.goneQuiet).length;
  const sorted = [...rows].sort(SORTS[sort].fn);

  return (
    <div className="stack" style={{ gap: "1.25rem", opacity: loading ? 0.6 : 1 }}>
      <div className="adm-head">
        <div>
          <h1 className="h1">Study overview</h1>
          <p className="muted adm-sub">
            {formatDay(data.today, { weekday: true })} ({data.timezone}). A day counts as active when
            the participant does at least one thing in the app beyond opening a screen.
          </p>
        </div>
        <div className="row">
          <button className="ghost adm-small" onClick={load} disabled={loading}>Refresh</button>
          <button className="adm-small" onClick={() => adminApi.downloadCsv().catch((e) => setError(e.message))}>
            Download CSV
          </button>
        </div>
      </div>
      {error && <div className="error">{error}</div>}

      <div className="adm-tiles">
        <Tile value={rows.length} label="Participants" note={`${inWindow.length} in their ${data.studyDays} days now · ${finished.length} finished`} />
        <Tile value={`${activeToday}`} of={inWindow.length} label="Active today" note="of those in their study window" />
        <Tile value={`${regular}`} of={rows.length} label="Using it regularly" note={`active on ${Math.round(REGULAR_RATE * 100)}%+ of their days so far`} />
        <Tile value={`${quiet}`} label="Gone quiet" note={`no activity for ${QUIET_DAYS}+ days, still mid-study`} tone={quiet ? "warn" : ""} />
      </div>

      <section className="card">
        <h2 className="adm-h2">Participants active each day</h2>
        {daily.length ? (
          <>
            <DailyActiveChart rows={daily} />
            <details className="adm-details">
              <summary>Show as a table</summary>
              <table className="adm-table compact">
                <thead><tr><th>Date</th><th className="num">Active</th><th className="num">In study window</th></tr></thead>
                <tbody>
                  {[...daily].reverse().map((d) => (
                    <tr key={d.date}><td>{formatDay(d.date, { weekday: true })}</td><td className="num">{d.active}</td><td className="num">{d.enrolled}</td></tr>
                  ))}
                </tbody>
              </table>
            </details>
          </>
        ) : (
          <p className="muted">No participants yet.</p>
        )}
      </section>

      <section className="card adm-flush">
        <div className="adm-head adm-pad">
          <h2 className="adm-h2" style={{ margin: 0 }}>Participants</h2>
          <label className="row adm-sort">
            <span className="muted">Sort</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </label>
        </div>
        {rows.length ? (
          <div className="adm-scroll">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Participant</th>
                  <th>Progress</th>
                  <th>{data.studyDays}-day check-ins</th>
                  <th className="num">Active days</th>
                  <th>Last active</th>
                  <th className="num">Streak</th>
                  <th>Usage</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(({ p, s }) => (
                  <tr key={p.userId} className="adm-row" tabIndex={0} onClick={() => onOpen(p.userId)} onKeyDown={(e) => e.key === "Enter" && onOpen(p.userId)}>
                    <td>
                      <div className="adm-name">{p.nickname || p.email}</div>
                      <div className="muted adm-small-text">#{p.userId}{p.nickname ? ` · ${p.email}` : ""}</div>
                    </td>
                    <td>{p.complete ? "Finished" : s.inWindow ? `Day ${s.dayNumber} of ${data.studyDays}` : `Starts ${formatDay(p.startDate)}`}</td>
                    <td><DayStrip days={p.days} today={data.today} /></td>
                    <td className="num">{s.activeDays} / {s.countedDays}</td>
                    <td className={s.goneQuiet ? "adm-warn-text" : ""}>{lastActiveLabel(s.lastActive, data.today)}</td>
                    <td className="num">{p.current}</td>
                    <td><StatusBadge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted adm-pad">Nobody has signed up yet.</p>
        )}
        <p className="muted adm-small-text adm-pad">
          Usage: Regular = active on {Math.round(REGULAR_RATE * 100)}%+ of their days so far ·
          Some days = {Math.round(SOMETIMES_RATE * 100)}–{Math.round(REGULAR_RATE * 100) - 1}% ·
          Rarely = under {Math.round(SOMETIMES_RATE * 100)}%. Today only counts once they've been active.
          Click a participant to see everything they've done.
        </p>
      </section>
    </div>
  );
}

function Tile({ value, of, label, note, tone = "" }) {
  return (
    <div className={`tile adm-tile ${tone}`}>
      <div className="lbl">{label}</div>
      <div className="num">
        {value}
        {of !== undefined && <span className="adm-of"> / {of}</span>}
      </div>
      <div className="lbl">{note}</div>
    </div>
  );
}

export function StatusBadge({ status }) {
  return <span className={`adm-status ${status.key}`}>{status.label}</span>;
}

// One square per study day: filled = active, dashed = opened only, grey = nothing.
export function DayStrip({ days, today, large = false }) {
  return (
    <div className={`adm-strip${large ? " large" : ""}`}>
      {days.map((d, i) => {
        const state = d.date > today ? "future" : d.active ? "active" : d.total > 0 ? "opened" : "none";
        const what = state === "future" ? "not yet" : state === "active" ? `${d.actions} action${d.actions === 1 ? "" : "s"}` : state === "opened" ? "opened, no actions" : "no activity";
        return (
          <span key={d.date} className={`adm-cell ${state}${d.date === today ? " today" : ""}`} title={`Day ${i + 1} · ${formatDay(d.date)}: ${what}`}>
            {large ? i + 1 : null}
          </span>
        );
      })}
    </div>
  );
}
