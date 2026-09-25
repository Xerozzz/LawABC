// Trigger types — keep keys in sync with backend/src/routes/triggers.routes.js KINDS.
// Tints/colours reuse the Craving SOS tool palette.
export const TRIGGER_KINDS = [
  { key: "feeling", label: "Feeling", icon: "heart", tint: "#fdeaea", color: "var(--danger)" },
  { key: "place", label: "Place", icon: "pin", tint: "#e5eefb", color: "#3b6fd0" },
  { key: "people", label: "People", icon: "users", tint: "#ece9fb", color: "#6a5bd6" },
  { key: "time", label: "Time", icon: "clock", tint: "#fdf1d6", color: "#b7791f" },
  { key: "other", label: "Other", icon: "zap", tint: "#e5f7f0", color: "#0b6b62" },
];

export const kindOf = (key) =>
  TRIGGER_KINDS.find((k) => k.key === key) || TRIGGER_KINDS[TRIGGER_KINDS.length - 1];

// One-tap starters, so nobody has to think up their triggers from a blank box.
export const SUGGESTED_TRIGGERS = [
  { label: "Stressed", kind: "feeling" },
  { label: "Bored", kind: "feeling" },
  { label: "Feeling down", kind: "feeling" },
  { label: "Friends vaping", kind: "people" },
  { label: "After school", kind: "time" },
  { label: "Late at night", kind: "time" },
  { label: "After eating", kind: "time" },
  { label: "Parties", kind: "place" },
];
