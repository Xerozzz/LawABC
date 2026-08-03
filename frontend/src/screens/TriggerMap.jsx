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

  // Load craving events that have coordinates.
  useEffect(() => {
    api
      .getCravings()
      .then((rows) => setCravings(rows.filter((r) => r.lat != null && r.lng != null)))
      .catch((e) => setError(e.message));
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

  // Locate the user and warn if near a past trigger spot.
  const checkMyLocation = () => {
    setError("");
    if (!("geolocation" in navigator)) {
      setError("Location isn't available on this device/browser.");
      return;
    }
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
        const near = cravings.some((c) => metresBetween(here, [c.lat, c.lng]) < TRIGGER_RADIUS_M);
        setWarning(near);
      },
      () => setError("Couldn't get your location. Check permissions."),
      { timeout: 6000, enableHighAccuracy: true }
    );
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

      {cravings.length === 0 && (
        <div className="card muted">
          No trigger spots yet. When you use <strong>Craving SOS</strong> with location turned on,
          the places cravings happen will show up here.
        </div>
      )}
    </div>
  );
}
