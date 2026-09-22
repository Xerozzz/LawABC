// Theme colours — keep brand/accent in sync with backend rewards.catalog.js THEMES.
// bg + hero re-skin the whole app so switching themes is obviously worth the gems.
export const THEME_COLORS = {
  default: {
    brand: "#0d9488", brand2: "#14b8a6", accent: "#b7791f",
    bg: "#f5f7fa", hero: ["#e6f1f0", "#f1f6f8", "#ffffff"], heroBorder: "#dbe7e6",
  },
  sunset: {
    brand: "#ff7b54", brand2: "#ff9e7d", accent: "#ffd56b",
    bg: "#fdf0e9", hero: ["#ffd7bd", "#ffe8d6", "#fff4e4"], heroBorder: "#ffd7bd",
  },
  grape: {
    brand: "#9b5de5", brand2: "#b57bee", accent: "#f15bb5",
    bg: "#f4f0fb", hero: ["#e4d9ff", "#efe8ff", "#faf0ff"], heroBorder: "#e0d3f8",
  },
  ocean: {
    brand: "#4cc9f0", brand2: "#80ffdb", accent: "#7bdff2",
    bg: "#eaf6fb", hero: ["#c6ecff", "#def5ff", "#e7fbf3"], heroBorder: "#c6e9f8",
  },
};

export function applyTheme(key) {
  const t = THEME_COLORS[key] || THEME_COLORS.default;
  const r = document.documentElement.style;
  r.setProperty("--brand", t.brand);
  r.setProperty("--brand-2", t.brand2);
  r.setProperty("--accent", t.accent);
  r.setProperty("--bg", t.bg);
  r.setProperty("--hero-1", t.hero[0]);
  r.setProperty("--hero-2", t.hero[1]);
  r.setProperty("--hero-3", t.hero[2]);
  r.setProperty("--hero-border", t.heroBorder);
}
