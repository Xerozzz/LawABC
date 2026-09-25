import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { api } from "../api.js";
import Icon from "../components/Icon.jsx";
import { TRIGGER_KINDS, SUGGESTED_TRIGGERS, kindOf } from "../triggers.js";

// Distance between two lat/lng points in metres (haversine).
function metresBetween(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const TRIGGER_RADIUS_M = 200;
const SINGAPORE = [1.3521, 103.8198];
const CRAVING_COLOR = "#ff5d5d";
const PIN_COLOR = "#6a5bd6";

// Same pill shape as the Community channel chips.
const chip = {
  width: "auto", flex: "0 0 auto", whiteSpace: "nowrap", boxShadow: "none",
  padding: "0.45rem 0.9rem", fontSize: "0.82rem", borderRadius: 999,
};
const planBox = {
  marginTop: "0.7rem", background: "#e7f8f2", border: "1px solid #bfe9db", overflowWrap: "anywhere",
  borderRadius: "var(--radius-sm)", padding: "0.6rem 0.8rem", fontSize: "0.88rem", color: "#0b6b62",
};

const EMPTY = { label: "", kind: "feeling", plan: "", lat: null, lng: null };
const hasPin = (p) => p.lat != null && p.lng != null;
const inlineBadge = { display: "inline-flex", alignItems: "center", gap: "0.35rem", alignSelf: "flex-start" };

// Popup content built from text nodes: labels are the user's own text, never HTML.
function popup(title, sub) {
  const el = document.createElement("div");
  const b = document.createElement("strong");
  b.textContent = title;
  el.appendChild(b);
  if (sub) {
    el.appendChild(document.createElement("br"));
    el.appendChild(document.createTextNode(sub));
  }
  return el;
}

// When cravings hit, by the phone's local time.
const PARTS_OF_DAY = [
  { label: "in the morning", test: (h) => h >= 5 && h < 12 },
  { label: "in the afternoon", test: (h) => h >= 12 && h < 17 },
  { label: "in the evening", test: (h) => h >= 17 && h < 21 },
  { label: "late at night", test: (h) => h >= 21 || h < 5 },
];

export default function TriggerMap() {
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const pointsLayer = useRef(null);
  const meLayer = useRef(null);
  const draftLayer = useRef(null);
  const formRef = useRef(null);

  const [cravings, setCravings] = useState([]);
  const [triggers, setTriggers] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [pinning, setPinning] = useState(false);
  const [dropped, setDropped] = useState(false); // pin placed but not saved yet
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");         // shown in the form
  const [formError, setFormError] = useState("");
  const [warning, setWarning] = useState(null);
  const [error, setError] = useState("");     // loading / deleting, shown at the top
  const [geoError, setGeoError] = useState(""); // shown by the location buttons
  const [denied, setDenied] = useState(false);
  const [watching, setWatching] = useState(false);
  const watchId = useRef(null);
  const lastAlert = useRef(0);
  const pinningRef = useRef(false);
  const spotsRef = useRef([]);
  useEffect(() => { pinningRef.current = pinning; }, [pinning]);

  // Every spot that counts for "you're near a trigger": past cravings + pinned triggers.
  useEffect(() => {
    spotsRef.current = [...cravings, ...triggers].filter(hasPin).map((p) => [p.lat, p.lng]);
  }, [cravings, triggers]);

  const loadTriggers = () => api.getTriggers().then(setTriggers).catch((e) => setError(e.message));

  useEffect(() => {
    api.getCravings().then(setCravings).catch((e) => setError(e.message));
    loadTriggers();
  }, []);

  // Show the how-to-re-enable guidance straight away if location is already blocked,
  // instead of waiting for a failed click.
  useEffect(() => {
    navigator.permissions
      ?.query({ name: "geolocation" })
      .then((status) => {
        if (status.state === "denied") setDenied(true);
        status.onchange = () => setDenied(status.state === "denied");
      })
      .catch(() => {});
  }, []);

  // Stop watching when leaving the screen.
  useEffect(() => () => {
    if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
  }, []);

  // Initialise the map once.
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    const map = L.map(mapEl.current).setView(SINGAPORE, 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);
    pointsLayer.current = L.layerGroup().addTo(map);
    meLayer.current = L.layerGroup().addTo(map);
    draftLayer.current = L.layerGroup().addTo(map);
    // In pin mode, one tap on the map drops the pin for the trigger in the form.
    // (No GPS needed, so this works on http and with location switched off.)
    map.on("click", (e) => {
      if (!pinningRef.current) return;
      setForm((f) => ({ ...f, lat: e.latlng.lat, lng: e.latlng.lng }));
      setPinning(false);
      setDropped(true);
      setMsg("");
    });
    mapRef.current = map;
    // container may have been sized after mount
    setTimeout(() => map.invalidateSize(), 200);
  }, []);

  // Plot craving spots and pinned triggers (the one being edited shows as the draft pin).
  // While pinning, the dots ignore taps so a tap on one still drops the pin.
  useEffect(() => {
    const layer = pointsLayer.current;
    if (!layer) return;
    layer.clearLayers();
    const interactive = !pinning;

    cravings.filter(hasPin).forEach((c) => {
      // translucent "zone" + solid centre dot
      L.circle([c.lat, c.lng], {
        radius: TRIGGER_RADIUS_M, color: CRAVING_COLOR, weight: 1, fillColor: CRAVING_COLOR, fillOpacity: 0.12, interactive,
      }).addTo(layer);
      L.circleMarker([c.lat, c.lng], {
        radius: 7, color: CRAVING_COLOR, fillColor: CRAVING_COLOR, fillOpacity: 0.9, interactive,
      })
        .bindPopup(popup(c.trigger_label || c.context || "Craving", new Date(c.occurred_at).toLocaleString()))
        .addTo(layer);
    });

    triggers.filter((t) => hasPin(t) && t.id !== editingId).forEach((t) => {
      L.circle([t.lat, t.lng], {
        radius: TRIGGER_RADIUS_M, color: PIN_COLOR, weight: 1, fillColor: PIN_COLOR, fillOpacity: 0.1, interactive,
      }).addTo(layer);
      L.circleMarker([t.lat, t.lng], {
        radius: 8, color: "#fff", weight: 2, fillColor: PIN_COLOR, fillOpacity: 1, interactive,
      })
        .bindPopup(popup(t.label, t.plan ? `Your plan: ${t.plan}` : kindOf(t.kind).label))
        .addTo(layer);
    });
  }, [cravings, triggers, editingId, pinning]);

  // Frame everything whenever the saved spots change (not while dropping a pin).
  useEffect(() => {
    const map = mapRef.current;
    const spots = [...cravings, ...triggers].filter(hasPin);
    if (map && spots.length) {
      map.fitBounds(L.latLngBounds(spots.map((p) => [p.lat, p.lng])).pad(0.4), { maxZoom: 16 });
    }
  }, [cravings, triggers]);

  // The pin for the trigger in the form, before it's saved.
  useEffect(() => {
    const layer = draftLayer.current;
    if (!layer) return;
    layer.clearLayers();
    if (hasPin(form)) {
      L.circleMarker([form.lat, form.lng], {
        radius: 9, color: PIN_COLOR, weight: 3, dashArray: "3 3", fillColor: "#fff", fillOpacity: 1, interactive: !pinning,
      })
        .bindPopup(editingId ? popup("Your pin", "Save changes to keep it here") : popup("New spot", "Add the trigger to keep it"))
        .addTo(layer);
    }
  }, [form.lat, form.lng, editingId, pinning]);

  // Guard shared by one-off checks and the live watcher.
  const geoAvailable = () => {
    setGeoError("");
    if (!window.isSecureContext) {
      setGeoError("Live location needs a secure (https) connection — it'll work once the site is on https. You can still pin spots by tapping the map.");
      return false;
    }
    if (!("geolocation" in navigator)) {
      setGeoError("Location isn't available on this device or browser.");
      return false;
    }
    return true;
  };

  const nearTrigger = (here) =>
    spotsRef.current.some((spot) => metresBetween(here, spot) < TRIGGER_RADIUS_M);

  // Locate the user and warn if near a past trigger spot.
  const checkMyLocation = () => {
    setDenied(false);
    if (!geoAvailable()) return;
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const here = [p.coords.latitude, p.coords.longitude];
        const map = mapRef.current;
        if (map && meLayer.current) {
          meLayer.current.clearLayers();
          L.circleMarker(here, {
            radius: 9,
            color: "#17c3b2",
            fillColor: "#17c3b2",
            fillOpacity: 1,
          })
            .bindPopup("You are here")
            .addTo(meLayer.current);
          map.setView(here, 15);
        }
        setWarning(nearTrigger(here));
      },
      (err) => {
        // 1 = PERMISSION_DENIED. Browsers won't let us open settings, so guide instead.
        if (err.code === 1) setDenied(true);
        else setGeoError("Couldn't get your location. Please try again.");
      },
      { timeout: 6000, enableHighAccuracy: true }
    );
  };

  // Live reminder while the app is open: watch position and nudge when entering
  // a trigger zone. (Background geofencing needs a native app — noted as WIP.)
  const toggleWatch = () => {
    if (watching) {
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
      setWatching(false);
      return;
    }
    if (!geoAvailable()) return;
    // Ask for device-notification permission so the nudge shows even when
    // you're in another tab (must come from this user gesture).
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
    watchId.current = navigator.geolocation.watchPosition(
      (p) => {
        const here = [p.coords.latitude, p.coords.longitude];
        const near = nearTrigger(here);
        setWarning(near);
        // Nudge at most once every 10 minutes.
        if (near && Date.now() - lastAlert.current > 10 * 60 * 1000) {
          lastAlert.current = Date.now();
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification("Heads up 📍", {
              body: "You're near one of your trigger spots. Got a plan? Craving SOS is one tap away.",
            });
          }
        }
      },
      (err) => {
        if (err.code === 1) setDenied(true);
        setWatching(false);
        watchId.current = null;
      },
      { enableHighAccuracy: true }
    );
    setWatching(true);
  };

  // --- Add / edit a trigger ---
  // Any change to the form clears its old messages ("added", "already have it").
  const change = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setFormError("");
    setMsg("");
  };
  const set = (k, v) => change({ [k]: v });
  const reset = () => {
    setForm(EMPTY);
    setEditingId(null);
    setPinning(false);
    setDropped(false);
  };

  const save = async (e) => {
    e.preventDefault();
    const label = form.label.trim();
    if (!label) return;
    setFormError("");
    setMsg("");
    const same = triggers.find((t) => t.id !== editingId && t.label.toLowerCase() === label.toLowerCase());
    if (same) {
      setFormError(`You already have “${same.label}”. Tap Edit on it to change it.`);
      return;
    }
    setBusy(true);
    const body = { label, kind: form.kind, plan: form.plan.trim() || null, lat: form.lat, lng: form.lng };
    try {
      if (editingId) {
        await api.updateTrigger(editingId, body);
        api.logEvent("trigger_updated", { kind: body.kind, pinned: hasPin(body) });
        setMsg("Trigger saved.");
      } else {
        const added = await api.addTrigger(body);
        if (added.existed) {
          // They already had it (added in SOS or another tab since this list loaded).
          // Don't overwrite it: open it for editing, keeping what's saved unless they typed something.
          await loadTriggers();
          setEditingId(added.id);
          setForm({
            label: added.label,
            kind: added.kind,
            plan: body.plan || added.plan || "",
            lat: hasPin(body) ? body.lat : added.lat,
            lng: hasPin(body) ? body.lng : added.lng,
          });
          setDropped(false);
          setFormError(`You already have “${added.label}”. Check it below and tap Save changes.`);
          return;
        }
        api.logEvent("trigger_added", { from: "triggers", kind: body.kind, pinned: hasPin(body) });
        setMsg("Trigger added.");
      }
      reset();
      await loadTriggers();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const edit = (t) => {
    setEditingId(t.id);
    setForm({ label: t.label, kind: t.kind, plan: t.plan || "", lat: t.lat, lng: t.lng });
    setPinning(false);
    setDropped(false);
    setMsg("");
    setFormError("");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const remove = async (t) => {
    if (!window.confirm(`Delete “${t.label}”? Cravings you tagged with it stay logged.`)) return;
    setError("");
    setMsg("");
    try {
      await api.deleteTrigger(t.id);
      if (editingId === t.id) reset();
      await loadTriggers();
      // cravings tagged with it are now untagged
      api.getCravings().then(setCravings).catch(() => {});
    } catch (e) {
      setError(e.message);
    }
  };

  const startPinning = () => {
    setPinning(true);
    setDropped(false);
    setMsg("");
    mapEl.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // --- Patterns (only once there's enough to say something) ---
  const top = triggers.find((t) => t.cravings > 0);
  const peak = PARTS_OF_DAY
    .map((p) => ({ ...p, n: cravings.filter((c) => p.test(new Date(c.occurred_at).getHours())).length }))
    .sort((a, b) => b.n - a.n)[0];
  const showPatterns = cravings.length >= 3;
  const starters = SUGGESTED_TRIGGERS.filter(
    (s) => !triggers.some((t) => t.label.toLowerCase() === s.label.toLowerCase())
  );
  const spotCount = [...cravings, ...triggers].filter(hasPin).length;

  return (
    <div className="stack">
      <div>
        <h1 className="h1" style={{ fontSize: "1.7rem" }}>My triggers</h1>
        <p className="muted" style={{ margin: "0.15rem 0 0" }}>Know what sets you off, and have a plan ready.</p>
      </div>

      {error && <div className="error">{error}</div>}

      {/* patterns */}
      {showPatterns && (
        <div className="card row" style={{ gap: "0.7rem", alignItems: "flex-start" }}>
          <span className="ico-chip" style={{ background: "#e5eefb", color: "#3b6fd0" }}><Icon name="chart" size={18} /></span>
          <div style={{ fontSize: "0.9rem" }}>
            <strong>Your patterns</strong>
            <div className="muted">
              Cravings hit most {peak.label} ({peak.n} of {cravings.length}).
              {top && <> “{top.label}” comes up the most ({top.cravings}×).</>}
            </div>
          </div>
        </div>
      )}

      {/* my triggers */}
      {triggers.length === 0 ? (
        <div className="card muted">
          No triggers yet. Add the things that set off a craving — a feeling, a place, certain people or a
          time of day — and they'll show up in <strong>Craving SOS</strong> so you can tag them and see your plan.
        </div>
      ) : (
        <div className="stack">
          {triggers.map((t) => {
            const k = kindOf(t.kind);
            return (
              <div key={t.id} className="card">
                <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div className="row" style={{ gap: "0.7rem", alignItems: "flex-start", minWidth: 0 }}>
                    <span className="ico-chip" style={{ background: k.tint, color: k.color }}><Icon name={k.icon} size={18} /></span>
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ overflowWrap: "anywhere" }}>{t.label}</strong>
                      <div className="muted" style={{ fontSize: "0.78rem" }}>
                        {k.label} · {t.cravings ? `came up ${t.cravings} time${t.cravings === 1 ? "" : "s"}` : "not tagged yet"}
                        {hasPin(t) ? " · pinned" : ""}
                      </div>
                    </div>
                  </div>
                  <div className="row" style={{ gap: "0.35rem", flex: "0 0 auto" }}>
                    <button className="ghost" style={{ padding: "0.35rem 0.75rem", fontSize: "0.78rem" }} onClick={() => edit(t)}>Edit</button>
                    <button className="ghost" aria-label={`Delete ${t.label}`} title="Delete" style={{ padding: "0.35rem 0.55rem" }} onClick={() => remove(t)}>
                      <Icon name="trash" size={15} style={{ color: "var(--text-dim)" }} />
                    </button>
                  </div>
                </div>
                {t.plan ? (
                  <div style={planBox}><strong>Your plan:</strong> {t.plan}</div>
                ) : (
                  <p className="muted" style={{ margin: "0.6rem 0 0", fontSize: "0.8rem" }}>
                    No plan yet.{" "}
                    <a href="#" onClick={(e) => { e.preventDefault(); edit(t); }}>Add one</a>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* add / edit */}
      <form ref={formRef} className="card stack" onSubmit={save} style={{ gap: "0.75rem", scrollMarginTop: "4.5rem" }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <strong>{editingId ? "Edit trigger" : "Add a trigger"}</strong>
          {editingId && <button type="button" className="ghost" style={{ padding: "0.3rem 0.7rem", fontSize: "0.78rem" }} onClick={reset}>Cancel</button>}
        </div>

        {!editingId && starters.length > 0 && (
          <div>
            <div className="muted" style={{ fontSize: "0.78rem", marginBottom: "0.4rem" }}>Tap one to start, or type your own</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
              {starters.map((s) => (
                <button key={s.label} type="button" style={chip}
                  className={form.label === s.label ? "cta-dark" : "ghost"}
                  onClick={() => change({ label: s.label, kind: s.kind })}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="field" style={{ margin: 0 }}>
          <label>What sets it off?</label>
          <input maxLength={60} value={form.label} onChange={(e) => set("label", e.target.value)} placeholder="e.g. Exam stress, the bus stop, a certain friend" />
        </div>

        <div>
          <div className="muted" style={{ fontSize: "0.82rem", marginBottom: "0.4rem", fontWeight: 500 }}>Type</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
            {TRIGGER_KINDS.map((k) => (
              <button key={k.key} type="button" aria-pressed={form.kind === k.key}
                className={form.kind === k.key ? "cta-dark" : "ghost"}
                style={{ ...chip, display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                onClick={() => set("kind", k.key)}>
                <Icon name={k.icon} size={14} /> {k.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field" style={{ margin: 0 }}>
          <label>When this happens, I'll… (your plan, optional)</label>
          <textarea rows={2} maxLength={200} value={form.plan} onChange={(e) => set("plan", e.target.value)}
            placeholder="e.g. Put my earphones in and walk it off" />
        </div>

        <div className="row" style={{ gap: "0.5rem", flexWrap: "wrap" }}>
          {hasPin(form) ? (
            <>
              <span className="muted" style={{ ...inlineBadge, alignSelf: "center", color: PIN_COLOR, fontSize: "0.82rem", fontWeight: 600 }}><Icon name="pin" size={14} /> Pinned</span>
              <button type="button" className="ghost" style={chip} onClick={pinning ? () => setPinning(false) : startPinning}>
                {pinning ? "Cancel" : "Move"}
              </button>
              <button type="button" className="ghost" style={chip}
                onClick={() => { change({ lat: null, lng: null }); setPinning(false); setDropped(false); }}>Remove</button>
            </>
          ) : (
            <button type="button" className="ghost" style={{ ...chip, display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
              onClick={pinning ? () => setPinning(false) : startPinning}>
              <Icon name="pin" size={14} /> {pinning ? "Cancel pinning" : "Pin a spot on the map (optional)"}
            </button>
          )}
        </div>

        {formError && <div className="error">{formError}</div>}
        {msg && <div className="badge" style={{ ...inlineBadge, color: "var(--success)" }}>✓ {msg}</div>}

        <button type="submit" className="cta-dark" disabled={busy || !form.label.trim()}>
          {busy ? "Saving…" : editingId ? "Save changes" : "Add trigger"}
        </button>
      </form>

      {/* map */}
      <div className="row" style={{ justifyContent: "space-between" }}>
        <strong>Trigger map</strong>
        <span className="muted" style={{ fontSize: "0.82rem" }}>{spotCount} spot{spotCount === 1 ? "" : "s"}</span>
      </div>

      {denied && (
        <div className="error" style={{ background: "rgba(255,183,3,0.14)", borderColor: "var(--accent)", color: "#7a5b00" }}>
          <strong>Location is switched off for ClearAir.</strong>
          <p style={{ margin: "0.4rem 0 0", fontSize: "0.85rem" }}>
            Browsers don't let apps open settings for you, so it's a quick manual step:
            tap the <strong>🔒 / ⓘ icon</strong> in the address bar → <strong>Permissions</strong> →
            allow <strong>Location</strong>, then tap the button again. On iPhone, also check
            Settings → your browser app → Location. You can still pin spots by tapping the map.
          </p>
        </div>
      )}

      {warning === true && (
        <div className="error">
          ⚠️ You're near one of your trigger spots. Have a plan — move on, breathe, or open Craving SOS.
        </div>
      )}
      {warning === false && (
        <div className="badge" style={{ color: "var(--success)" }}>
          ✓ No known trigger spots right here.
        </div>
      )}

      {(pinning || dropped) && (
        <div className="badge" style={{ ...inlineBadge, color: PIN_COLOR, fontSize: "0.82rem", padding: "0.45rem 0.7rem" }}>
          <Icon name="pin" size={14} />
          {pinning
            ? `Tap the map to drop the pin${form.label.trim() ? ` for “${form.label.trim()}”` : ""}`
            : `Pin dropped. ${editingId ? "Save changes" : "Add the trigger"} above to keep it.`}
        </div>
      )}

      <div
        ref={mapEl}
        style={{
          height: "45vh",
          minHeight: 260,
          width: "100%",
          borderRadius: "var(--radius)",
          overflow: "hidden",
          border: pinning ? `2px solid ${PIN_COLOR}` : "1px solid var(--border)",
          cursor: pinning ? "crosshair" : undefined,
          // keep Leaflet's layers (z-index 400+) inside the map, under the top bar and tab bar
          isolation: "isolate",
        }}
      />

      <div className="row" style={{ gap: "1rem", flexWrap: "wrap", fontSize: "0.74rem", color: "var(--text-dim)", marginTop: "-0.3rem" }}>
        <span className="row" style={{ gap: "0.35rem" }}><i style={{ width: 12, height: 12, borderRadius: "50%", background: PIN_COLOR }} /> Your pinned triggers</span>
        <span className="row" style={{ gap: "0.35rem" }}><i style={{ width: 12, height: 12, borderRadius: "50%", background: CRAVING_COLOR }} /> Where cravings hit</span>
      </div>

      {geoError && <div className="error">{geoError}</div>}

      <button onClick={checkMyLocation}>📍 Check where I am now</button>

      <button className={watching ? "" : "ghost"} onClick={toggleWatch}>
        {watching ? "🔔 Nearby reminders on — tap to stop" : "🔕 Remind me near trigger spots"}
      </button>
      <p className="muted" style={{ fontSize: "0.75rem", margin: "-0.4rem 0 0" }}>
        Reminders work while the app is open. Always-on background alerts need the
        installed app version — coming later. 🚧
      </p>

      {spotCount === 0 && (
        <div className="card muted">
          No spots on the map yet. Pin a trigger above, or use <strong>Craving SOS</strong> with location
          turned on and the places cravings happen will show up here.
        </div>
      )}
    </div>
  );
}
