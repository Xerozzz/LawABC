// Guards for values read from JSON bodies. Anything that isn't the expected
// shape becomes "" / null here instead of reaching Postgres, where it would throw.

// A string with control characters removed (Postgres can't store NUL), trimmed
// and capped at `max` characters — counted by code point so emoji aren't split.
export const text = (v, max) => {
  if (typeof v !== "string") return "";
  // eslint-disable-next-line no-control-regex
  const clean = v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim();
  return Array.from(clean).slice(0, max).join("").trim();
};

// A coordinate within ±limit, or null. Only numbers and numeric strings count.
export const coord = (v, limit) => {
  if (typeof v !== "number" && (typeof v !== "string" || !v.trim())) return null;
  const n = Number(v);
  return Number.isFinite(n) && Math.abs(n) <= limit ? n : null;
};

// A lat/lng pair, or both null — half a coordinate is no location at all.
export const latLng = (lat, lng) => {
  const a = coord(lat, 90);
  const b = coord(lng, 180);
  return a != null && b != null ? { lat: a, lng: b } : { lat: null, lng: null };
};

// A row id that fits a Postgres INT (number or digit string), or null.
export const rowId = (v) => {
  if (typeof v !== "number" && typeof v !== "string") return null;
  const s = String(v).trim();
  return /^\d{1,9}$/.test(s) ? Number(s) : null;
};
