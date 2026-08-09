// Theme colours — keep in sync with backend rewards.catalog.js THEMES.
export const THEME_COLORS = {
  default: { brand: "#17c3b2", brand2: "#22d3a6", accent: "#ffb703" },
  sunset: { brand: "#ff7b54", brand2: "#ff9e7d", accent: "#ffd56b" },
  grape: { brand: "#9b5de5", brand2: "#b57bee", accent: "#f15bb5" },
  ocean: { brand: "#4cc9f0", brand2: "#80ffdb", accent: "#7bdff2" },
};

export function applyTheme(key) {
  const t = THEME_COLORS[key] || THEME_COLORS.default;
  const r = document.documentElement.style;
  r.setProperty("--brand", t.brand);
  r.setProperty("--brand-2", t.brand2);
  r.setProperty("--accent", t.accent);
}
