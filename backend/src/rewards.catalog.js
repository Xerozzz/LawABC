// Cosmetic shop catalog. Gems are earned from streaks + engagement (never from
// self-reported abstinence, which can't be verified). Real-world rewards would
// need partnerships + counsellor verification — out of scope here.

export const AVATARS = [
  { key: "ava_seedling", type: "avatar", label: "Seedling", emoji: "🌱", cost: 0 },
  { key: "ava_fox", type: "avatar", label: "Fox", emoji: "🦊", cost: 20 },
  { key: "ava_turtle", type: "avatar", label: "Turtle", emoji: "🐢", cost: 20 },
  { key: "ava_star", type: "avatar", label: "Star", emoji: "🌟", cost: 40 },
  { key: "ava_rocket", type: "avatar", label: "Rocket", emoji: "🚀", cost: 40 },
  { key: "ava_dragon", type: "avatar", label: "Dragon", emoji: "🐉", cost: 80 },
];

export const THEMES = [
  { key: "default", type: "theme", label: "Teal", cost: 0, colors: { brand: "#17c3b2", brand2: "#22d3a6", accent: "#ffb703" } },
  { key: "sunset", type: "theme", label: "Sunset", cost: 30, colors: { brand: "#ff7b54", brand2: "#ff9e7d", accent: "#ffd56b" } },
  { key: "grape", type: "theme", label: "Grape", cost: 30, colors: { brand: "#9b5de5", brand2: "#b57bee", accent: "#f15bb5" } },
  { key: "ocean", type: "theme", label: "Ocean", cost: 50, colors: { brand: "#4cc9f0", brand2: "#80ffdb", accent: "#7bdff2" } },
];

export const CATALOG = [...AVATARS, ...THEMES];
export const FREE_KEYS = CATALOG.filter((i) => i.cost === 0).map((i) => i.key);
export const byKey = (k) => CATALOG.find((i) => i.key === k);

// Gems awarded for reaching each streak length (cumulative).
export const STREAK_GEMS = [
  { days: 1, gems: 5 }, { days: 3, gems: 10 }, { days: 7, gems: 20 },
  { days: 14, gems: 30 }, { days: 30, gems: 50 }, { days: 60, gems: 75 },
  { days: 100, gems: 150 }, { days: 365, gems: 365 },
];
