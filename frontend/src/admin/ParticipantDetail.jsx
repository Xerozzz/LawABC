import { useEffect, useMemo, useState } from "react";
import { adminApi, SignedOut } from "./adminApi.js";
import { DayStrip, StatusBadge } from "./Dashboard.jsx";
import { formatDay, lastActiveLabel, participantStats } from "./metrics.js";

const pretty = (type) => type.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

// Event meta is whatever the app sent ({ mood }, { tool }, { path }…): show it compactly.
const metaText = (meta) =>
  meta && typeof meta === "object"
    ? Object.entries(meta).map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`).join(" · ")
    : "";

export default function ParticipantDetail({ id, onBack, onSignedOut }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [showViews, setShowViews] = useState(false);
  const [limit, setLimit] = useState(100);

  useEffect(() => {
    setData(null);
    setError("");
    adminApi
      .userLogs(id)
      .then(setData)
      .catch((e) => (e instanceof SignedOut ? onSignedOut(e.message) : setError(e.message)));
  }, [id]);

  const log = useMemo(() => (data ? buildLog(data) : []), [data]);

  if (!data) {
    return (
      <div className="stack">
        <button className="ghost adm-small adm-back" onClick={onBack}>← All participants</button>
        {error ? <div className="error">{error}</div> : <p className="muted">Loading…</p>}
      </div>
    );
  }

  const { user, activity: a } = data;
  const tz = a.timezone;
  const when = (iso, withTime = true) =>
    new Date(iso).toLocaleString("en-GB", {
      timeZone: tz, day: "numeric", month: "short", year: "numeric",
      ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    });
  const s = participantStats(a, a.today);
  const cravings = countBy(data.cravings, (c) => c.outcome || "unknown");
  const views = log.filter((e) => e.kind === "view").length;
  const shown = log.filter((e) => showViews || e.kind !== "view");

  return (
    <div className="stack" style={{ gap: "1.25rem" }}>
      <button className="ghost adm-small adm-back" onClick={onBack}>← All participants</button>

      <div className="adm-head">
        <div>
          <h1 className="h1">{user.nickname || user.email}</h1>
          <p className="muted adm-sub">
            #{user.id}{user.nickname ? ` · ${user.email}` : ""} · signed up {when(user.created_at, false)}
            {user.consent_accepted_at ? ` · consented ${when(user.consent_accepted_at, false)}` : " · hasn't accepted consent"}
            {user.quit_date ? ` · quit date ${when(user.quit_date, false)}` : ""}
          </p>
        </div>
        <StatusBadge status={s.status} />
      </div>

      <section className="card">
        <h2 className="adm-h2">
          {a.complete ? "Study days (finished)" : `Day ${a.dayNumber} of ${a.totalDays}`}
          <span className="muted adm-h2-note"> · {formatDay(a.startDate)} – {formatDay(a.endDate)}</span>
        </h2>
        <DayStrip days={a.days} today={a.today} large />
        <p className="muted adm-small-text" style={{ marginBottom: 0 }}>
          Filled = active · dashed = opened the app but did nothing · grey = no activity. Hover a day to see how many actions.
        </p>
        <div className="adm-tiles" style={{ marginTop: "1rem" }}>
          <Figure value={`${s.activeDays} / ${s.countedDays}`} label="Active days so far" />
          <Figure value={lastActiveLabel(s.lastActive, a.today)} label="Last active" />
          <Figure value={a.current} label="Current streak (days)" />
          <Figure value={a.longest} label="Longest streak (days)" />
        </div>
      </section>

      <div className="adm-two">
        <section className="card">
          <h2 className="adm-h2">What they've used</h2>
          <dl className="adm-dl">
            <dt>Cravings logged</dt>
            <dd>
              {data.cravings.length}
              {data.cravings.length > 0 && (
                <span className="muted"> ({cravings.passed || 0} passed · {cravings.vaped || 0} vaped · {cravings.unknown || 0} not said)</span>
              )}
            </dd>
            <dt>Triggers added</dt><dd>{data.triggers.length}</dd>
            <dt>Community posts</dt><dd>{data.reflections.length}</dd>
            <dt>Rewards unlocked</dt><dd>{data.unlocks.length}</dd>
            <dt>Screens opened</dt><dd>{views}</dd>
            <dt>Notifications</dt><dd>{data.notifications.length} <span className="muted">({data.notifications.filter((n) => n.read_at).length} read)</span></dd>
          </dl>
        </section>

        <section className="card">
          <h2 className="adm-h2">Their triggers</h2>
          {data.triggers.length ? (
            <ul className="adm-list">
              {data.triggers.map((t) => (
                <li key={t.id}>
                  <strong>{t.label}</strong> <span className="muted">({t.kind})</span>
                  {t.plan && <div className="muted">Plan: {t.plan}</div>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">None yet.</p>
          )}
        </section>
      </div>

      {data.reflections.length > 0 && (
        <section className="card">
          <h2 className="adm-h2">Community posts</h2>
          <ul className="adm-list">
            {data.reflections.map((r) => (
              <li key={r.id}>
                <div>{r.body}</div>
                <div className="muted adm-small-text">{when(r.created_at)} · {r.channel}{r.status !== "visible" ? ` · ${r.status}` : ""}</div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card adm-flush">
        <div className="adm-head adm-pad">
          <h2 className="adm-h2" style={{ margin: 0 }}>Activity log</h2>
          <label className="row adm-sort">
            <input type="checkbox" checked={showViews} onChange={(e) => setShowViews(e.target.checked)} style={{ width: "auto" }} />
            <span className="muted">Include screen views ({views})</span>
          </label>
        </div>
        {shown.length ? (
          <div className="adm-scroll">
            <table className="adm-table compact">
              <thead><tr><th>When ({tz})</th><th>What</th><th>Details</th></tr></thead>
              <tbody>
                {shown.slice(0, limit).map((e) => (
                  <tr key={e.key}>
                    <td className="adm-nowrap">{when(e.at)}</td>
                    <td>{e.what}</td>
                    <td className="muted">{e.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted adm-pad">Nothing recorded yet.</p>
        )}
        {shown.length > limit && (
          <div className="adm-pad">
            <button className="ghost adm-small" onClick={() => setLimit(Infinity)}>Show all {shown.length}</button>
          </div>
        )}
      </section>
    </div>
  );
}

function Figure({ value, label }) {
  return (
    <div className="tile adm-tile">
      <div className="num">{value}</div>
      <div className="lbl">{label}</div>
    </div>
  );
}

function countBy(list, key) {
  const out = {};
  for (const x of list) out[key(x)] = (out[key(x)] || 0) + 1;
  return out;
}

// Everything they did, newest first. App events already cover posts and
// triggers; cravings and unlocks only live in their own tables.
function buildLog(d) {
  const log = [
    ...d.events.map((e) => ({
      key: `e${e.id}`,
      at: e.created_at,
      kind: e.type === "screen_view" ? "view" : "action",
      what: e.type === "screen_view" ? "Opened a screen" : pretty(e.type),
      detail: metaText(e.meta),
    })),
    ...d.cravings.map((c) => ({
      key: `c${c.id}`,
      at: c.occurred_at,
      kind: "action",
      what: "Craving logged",
      detail: [c.outcome && `outcome: ${c.outcome}`, c.tool_used && `used: ${c.tool_used}`, c.context].filter(Boolean).join(" · "),
    })),
    ...d.unlocks.map((u) => ({
      key: `u${u.item_key}`,
      at: u.created_at,
      kind: "action",
      what: "Reward unlocked",
      detail: u.item_key,
    })),
  ];
  return log.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
}
