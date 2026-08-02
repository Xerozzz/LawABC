// Researched health-recovery milestones.
//
// PLACEHOLDER: this is SMOKING cessation data (from the reference infographic in
// the ideation deck). Vaping has no combustion, so several rows (carbon monoxide,
// tar/lung-cancer) do not map cleanly and are flagged. Replace with vaping-specific,
// citable milestones before pilot — see TASKS.md E7.

const MIN = 1;
const HOUR = 60;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

export const MILESTONE_SOURCE =
  "Placeholder: smoking cessation timeline (CDC/US Surgeon General). Pending vaping-specific data.";

export const milestones = [
  {
    minutes: 20 * MIN,
    time_label: "20 minutes",
    title: "Heart rate & blood pressure drop",
    description: "Your heart rate and blood pressure begin to decrease.",
  },
  {
    minutes: 3 * DAY,
    time_label: "A few days",
    title: "Carbon monoxide clears",
    description:
      "Carbon monoxide levels return to normal. (Combustion-specific — likely N/A for vaping.)",
  },
  {
    minutes: 3 * WEEK,
    time_label: "2–9 weeks",
    title: "Circulation improves",
    description: "Circulation and lung function improve.",
  },
  {
    minutes: 3 * MONTH,
    time_label: "1–12 months",
    title: "Lungs heal",
    description: "Lungs continue to heal; less coughing and shortness of breath.",
  },
  {
    minutes: 1 * YEAR,
    time_label: "1–2 years",
    title: "Heart disease risk falls",
    description: "Risk of coronary heart disease and heart attack is reduced.",
  },
  {
    minutes: 5 * YEAR,
    time_label: "5–10 years",
    title: "Cancer & stroke risk falls",
    description:
      "Risk of mouth, throat and voice-box cancer halved; cervical cancer and stroke risk decline toward a non-user's.",
  },
  {
    minutes: 10 * YEAR,
    time_label: "10 years",
    title: "Lung-cancer risk halved",
    description:
      "Lung-cancer mortality risk about 50% lower; bladder, esophagus and kidney cancer risk decreases.",
  },
  {
    minutes: 15 * YEAR,
    time_label: "15 years",
    title: "Back to baseline",
    description: "Risk of coronary disease is close to that of someone who never used.",
  },
];
