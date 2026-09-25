// Researched health-recovery milestones for QUITTING VAPING / NICOTINE.
//
// Because vaping involves NO combustion, the classic smoking milestones tied to
// carbon monoxide, tar, and lung-cancer risk do NOT transfer and are deliberately
// omitted. These are re-centred on nicotine pharmacology (heart rate, blood
// pressure, receptor/dopamine recovery, withdrawal) and aerosol-irritant effects.
//
// Withdrawal-timeline items rest on strong nicotine-specific evidence. Items marked
// `inferred: true` (cardiovascular / dopamine / 20-min) are extrapolated from
// cigarette-smoking research — vaping-specific longitudinal data is still emerging.
// Sources fetched during research (Aug 2026); re-verify periodically.
//
// `affirmation` is the encouraging line shown when a milestone is reached (health
// recovery card + notification). Kept free of "vape"/"nicotine" wording so it's
// safe to show on a lock screen. Editing it does not need a version bump.

const MIN = 1;
const HOUR = 60;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

// Bump this when the milestone set changes — the DB re-seeds on version change.
export const MILESTONE_VERSION = "vaping-v1";

export const milestones = [
  {
    minutes: 20 * MIN,
    time_label: "20 minutes",
    title: "Heart rate & blood pressure drop",
    description:
      "Nicotine's stimulant effect fades fast — elevated heart rate and blood pressure start returning toward normal.",
    inferred: true,
    source: "Truth Initiative (nicotine-driven, from smoking-cessation data)",
    affirmation: "Your heart is already calmer. That's all you.",
  },
  {
    minutes: 4 * HOUR,
    time_label: "4–24 hours",
    title: "Withdrawal begins",
    description:
      "As blood nicotine falls, early withdrawal sets in — cravings, irritability and trouble concentrating. This is normal and temporary.",
    inferred: false,
    source: "Cleveland Clinic — Nicotine Withdrawal",
    affirmation: "This feeling means it's working. You're stronger than it.",
  },
  {
    minutes: 24 * HOUR,
    time_label: "24 hours",
    title: "Most nicotine cleared",
    description:
      "Nicotine has a ~2-hour half-life, so most has left your bloodstream within about a day.",
    inferred: false,
    source: "Frontiers in Behavioral Neuroscience — nicotine pharmacokinetics",
    affirmation: "A full day clear. Your body is already thanking you.",
  },
  {
    minutes: 2 * DAY,
    time_label: "2–3 days",
    title: "Withdrawal peaks, then eases",
    description:
      "Irritability, anxiety, cravings and sleep disruption are usually most intense around now — after this they ease a little each day.",
    inferred: false,
    source: "Cleveland Clinic; Smokefree.gov (NCI)",
    affirmation: "You're getting through the hardest part. It only gets easier from here.",
  },
  {
    minutes: 1 * WEEK,
    time_label: "1 week",
    title: "Mood & cravings turn a corner",
    description:
      "Negative mood and craving intensity tend to peak in the first week, then start declining. Urges get shorter and weaker.",
    inferred: false,
    source: "Smokefree.gov (NCI) — Nicotine Withdrawal and Vaping",
    affirmation: "One week in. You're taking your control back.",
  },
  {
    minutes: 2 * WEEK,
    time_label: "2 weeks",
    title: "Circulation & breathing improve",
    description:
      "Blood circulation improves and, as airway irritation from the aerosol settles, coughing and shortness of breath begin to ease.",
    inferred: false,
    source: "Truth Initiative — immediate benefits of quitting vaping",
    affirmation: "Every breath is a little easier. You earned that.",
  },
  {
    minutes: 4 * WEEK,
    time_label: "2–4 weeks",
    title: "Physical withdrawal resolves",
    description:
      "Most physical withdrawal (headaches, appetite changes, sleep problems, irritability) fades. Occasional psychological cravings persist but keep weakening.",
    inferred: false,
    source: "Cleveland Clinic; Smokefree.gov (NCI)",
    affirmation: "The worst is behind you. You proved you can do this.",
  },
  {
    minutes: 3 * MONTH,
    time_label: "3 months",
    title: "Dopamine system rebalances",
    description:
      "Nicotine's suppression of the brain's dopamine production (a ~15–20% drop) largely reverses, helping mood, motivation and focus stabilise.",
    inferred: true,
    source: "Truth Initiative — 'Re-thinking Nicotine' (imaging from smokers)",
    affirmation: "The calm, focused you is back. Be proud of how far you've come.",
  },
  {
    minutes: 1 * YEAR,
    time_label: "1 year",
    title: "Cardiovascular risk falls",
    description:
      "Sustained time off nicotine lowers longer-term strain on your heart, reducing coronary heart-disease risk.",
    inferred: true,
    source: "Truth Initiative / AHA (extrapolated from smoking-cessation research)",
    affirmation: "A whole year. You changed your life. Celebrate it.",
  },
];
