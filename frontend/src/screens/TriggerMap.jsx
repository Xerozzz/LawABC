import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { api } from "../api.js";

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

export default function TriggerMap() {
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const pointsLayer = useRef(null);
  const meLayer = useRef(null);

  const [cravings, setCravings] = useState([]);
  const [warning, setWarning] = useState(null);
  const [error, setError] = useState("");
  const [denied, setDenied] = useState(false);
  const [watching, setWatching] = useState(false);
  const watchId = useRef(null);
  const lastAlert = useRef(0);
  const cravingsRef = useRef([]);
  useEffect(() => { cravingsRef.current = cravings; }, [cravings]);

  // Load craving events that have coordinates.
  useEffect(() => {
    api
      .getCravings()
      .then((rows) => setCravings(rows.filter((r) => r.lat != null && r.lng != null)))
      .catch((e) => setError(e.message));
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
    mapRef.current = map;
    // container may have been sized after mount
    setTimeout(() => map.invalidateSize(), 200);
  }, []);

  // Plot craving points whenever they change.
  useEffect(() => {
    const map = mapRef.current;
    const layer = pointsLayer.current;
    if (!map || !layer) return;
    layer.clearLayers();

    cravings.forEach((c) => {
      // translucent "zone" + solid centre dot
      L.circle([c.lat, c.lng], {
        radius: TRIGGER_RADIUS_M,
        color: "#ff5d5d",
        weight: 1,
        fillColor: "#ff5d5d",
        fillOpacity: 0.12,
      }).addTo(layer);
      L.circleMarker([c.lat, c.lng], {
        radius: 7,
        color: "#ff5d5d",
        fillColor: "#ff5d5d",
        fillOpacity: 0.9,
      })
        .bindPopup(
          `${c.context ? c.context : "Craving"}<br/>${new Date(c.occurred_at).toLocaleString()}`
        )
        .addTo(layer);
    });

    if (cravings.length) {
      const bounds = L.latLngBounds(cravings.map((c) => [c.lat, c.lng]));
      map.fitBounds(bounds.pad(0.4));
    }
  }, [cravings]);

  // Guard shared by one-off checks and the live watcher.
  const geoAvailable = () => {
    setError("");
    if (!window.isSecureContext) {
      setError("Live location needs a secure (https) connection — it'll work once the site is on https.");
      return false;
    }
    if (!("geolocation" in navigator)) {
      setError("Location isn't available on this device or browser.");
      return false;
    }
    return true;
  };

  const nearTrigger = (here) =>
    cravingsRef.current.some((c) => metresBetween(here, [c.lat, c.lng]) < TRIGGER_RADIUS_M);

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
        else setError("Couldn't get your location. Please try again.");
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
              body: "You're near a spot where a craving hit before. Got a plan? Craving SOS is one tap away.",
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

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Trigger map 📍</h1>
        <p className="muted">
          Spots where cravings hit before. Knowing them helps you plan ahead.
        </p>
      </div>

      {error && <div className="error">{error}</div>}

      {denied && (
        <div className="error" style={{ background: "rgba(255,183,3,0.14)", borderColor: "var(--accent)", color: "#7a5b00" }}>
          <strong>Location is switched off for ClearAir.</strong>
          <p style={{ margin: "0.4rem 0 0", fontSize: "0.85rem" }}>
            Browsers don't let apps open settings for you, so it's a quick manual step:
            tap the <strong>🔒 / ⓘ icon</strong> in the address bar → <strong>Permissions</strong> →
            allow <strong>Location</strong>, then tap the button again. On iPhone, also check
            Settings → your browser app → Location.
          </p>
        </div>
      )}

      {warning === true && (
        <div className="error">
          ⚠️ You're near a spot where a craving hit before. Have a plan — move on, breathe, or open Craving SOS.
        </div>
      )}
      {warning === false && (
        <div className="badge" style={{ color: "var(--success)" }}>
          ✓ No known trigger spots right here.
        </div>
      )}

      <div
        ref={mapEl}
        style={{
          height: "55vh",
          width: "100%",
          borderRadius: "var(--radius)",
          overflow: "hidden",
          border: "1px solid var(--border)",
        }}
      />

      <button onClick={checkMyLocation}>📍 Check where I am now</button>

      <button className={watching ? "" : "ghost"} onClick={toggleWatch}>
        {watching ? "🔔 Nearby reminders on — tap to stop" : "🔕 Remind me near trigger spots"}
      </button>
      <p className="muted" style={{ fontSize: "0.75rem", margin: "-0.4rem 0 0" }}>
        Reminders work while the app is open. Always-on background alerts need the
        installed app version — coming later. 🚧
      </p>

      {cravings.length === 0 && (
        <div className="card muted">
          No trigger spots yet. When you use <strong>Craving SOS</strong> with location turned on,
          the places cravings happen will show up here.
        </div>
      )}
    </div>
  );
}
