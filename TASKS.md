# ClearAir — Task List & Developer Split

App: **ClearAir** (LawABC) — an interactive, always-on app that supports youths in quitting vaping.
Stack: React (Vite) + Express + PostgreSQL + Docker Compose (skeleton already scaffolded).

This list is organized into **epics**. Each epic is a mostly-independent vertical slice (UI + API + DB)
so two developers can own separate features and rarely touch the same files.

---

## How to split (recommended)

**Phase 0 (Shared Foundation)** is done first — pair on it or have one person build it while the
other reads up. After that, split by feature vertical:

| Owner | Epics |
|-------|-------|
| **Dev A** — Progress & Data | E1 Auth/Profile · E2 Health Recovery Timeline · E3 Savings Tracker · E7 Milestone research |
| **Dev B** — Support & Community | E4 Craving SOS Toolkit · E5 Trigger Environment Mapping · E6 Anonymous Peer Support |
| **Both** | E0 Foundation · E8 Cross-cutting (privacy, moderation, deploy) |

Alternative split (by layer): one owns all Express/DB/API, the other owns all React/UI. Feature-vertical
is recommended for an MVP because it gives each person a shippable slice and avoids blocking.

Legend: `[ ]` = todo · **S/M/L** = rough effort · → = depends on

---

## E0 — Shared Foundation  *(do first, together)*

- [ ] **S** Confirm skeleton boots: `docker compose up --build`, frontend↔backend↔db all green
- [ ] **M** Define the Postgres schema & migrations (see Data Model below). Pick a tool (raw SQL in `db/init`, or add `node-pg-migrate` / Prisma / Knex)
- [ ] **S** Establish shared API conventions: base path `/api`, JSON error shape, status codes
- [ ] **M** Frontend app shell: routing (React Router), bottom-nav / tab layout, shared UI kit (buttons, cards), colour theme (gamified, youth-centric per slide 3)
- [ ] **S** Environment/config: `.env` for API keys (maps), CORS, `VITE_API_URL`
- [ ] **S** Linting/formatting (ESLint + Prettier) and a basic CI check
- [ ] **S** Decide auth approach for MVP (see E1) so both devs code against the same user context

---

## E1 — Auth & User Profile  *(Dev A)*  → E0

- [ ] **M** User model + registration/login (email+password or anonymous device account — youths may want low-friction/anonymous)
- [ ] **S** JWT or session middleware on Express; protect `/api` routes
- [ ] **S** Onboarding flow: quit date, vaping cost/frequency (feeds Savings & Timeline), quit goal
- [ ] **S** Profile screen: view/edit quit date & goals
- [ ] **S** Store consent for location tracking & anonymised data sharing (privacy — see E8)

---

## E2 — Health Recovery Timeline  *(Dev A)*  → E1, E7

*Slide 4: visualise improving health (nicotine clearing, cardiovascular risk reducing).*
*Built from a **researched, static milestone dataset** (see E7) — no external programme sync.*

- [ ] **S** Encode the milestone dataset from E7 as seed/reference data (time-since-quit → benefit)
- [ ] **M** API: given user quit date, return achieved + upcoming milestones with progress %
- [ ] **M** UI: horizontal recovery timeline (like the reference infographic), current status highlighted, animated
- [ ] **S** Cite the source for each milestone in the UI (builds trust; important for a health app)
- [ ] **S** Milestone reached → celebratory state (ties into peer reflections in E6)

---

## E3 — Savings Tracker  *(Dev A)*  → E1

*Slide 4: real-time savings since quitting; progress toward a savings target.*

- [ ] **S** API: compute savings from quit date + spend rate (real-time / on request)
- [ ] **S** Let user set a savings goal (e.g. "new headphones — $150")
- [ ] **M** UI: running total, progress bar to goal, "you've saved X since quitting"
- [ ] **S** Edge cases: relapse handling, editing spend rate recalculates history

---

## E4 — Craving SOS & 60-Second Toolkit  *(Dev B)*  → E1

*Slide 5: a craving button that launches a 60s distraction — breathing exercise, mini-game, or motivational story.*

- [ ] **S** Prominent "Craving" button reachable from anywhere (floating action button)
- [ ] **M** 60-second breathing exercise (animated timer/guide)
- [ ] **M** Simple mini-game (tap/reaction) sized to ~60s
- [ ] **S** Motivational story/quote component (rotating content, seedable list)
- [ ] **S** Post-SOS check-in: "did the craving pass?" → logs outcome
- [ ] **M** API: log each craving event (time, chosen tool, outcome) → feeds E5 map & counselor data (EMA, slide 8)

---

## E5 — Trigger Environment Mapping  *(Dev B)*  → E4

*Slide 5: track location/time/context of cravings, plot a trigger map, warn near risky environments.*

- [x] **S** Capture geolocation + timestamp + context when a craving is logged (done: CravingSOS grabs coords on check-in when consent is on)
- [x] **M** API: store craving locations; return them for the user (done: `POST/GET /api/cravings`. Server-side "hot spot" aggregation still TODO — currently plotted client-side)
- [x] **M** Map UI (Leaflet + OpenStreetMap) plotting past trigger points (done: `TriggerMap.jsx`, Map tab)
- [x] **L** Proximity warning: warn when near a known trigger zone (done: foreground check within 200m via "Check where I am now". Background geofencing still flagged for native/PWA later)
- [ ] **S** Privacy controls: view/delete location history

---

## E6 — Anonymous Peer Support  *(Dev B)*  → E1

*Slides 5–6: share reflections at milestones; read reflections from others at the same point; makes quitting less lonely.*

- [ ] **M** API: post an anonymous reflection tagged to a milestone/quit-stage
- [ ] **M** API: fetch reflections from others at a similar stage
- [ ] **M** UI: write-reflection prompt at milestones; feed of peers' reflections
- [ ] **S** Anonymity model: no identifying data exposed; internal user id kept private
- [ ] **M** Moderation basics (report button, profanity filter, hide/remove) — see E8; important for a youth platform

---

## E7 — Health Milestone Research  *(Dev A)*  — blocks E2

*Replaces the earlier Healthy 365 sync. The timeline is driven by our own researched dataset instead
of pulling from an external programme.*

- [x] **M** Source **vaping-specific** health-recovery milestones from credible research
      (done: nicotine-focused timeline sourced from Truth Initiative, Cleveland Clinic, Smokefree.gov/NCI,
      Frontiers. Combustion-specific milestones — carbon monoxide, tar, lung cancer — dropped.)
- [x] **S** ~~Smoking placeholder~~ replaced with the researched vaping dataset in `backend/src/milestones.seed.js`
- [x] **S** Each milestone recorded as `{ minutes, time_label, title, description, source, inferred }`;
      `inferred: true` items (20 min, 3 months, 1 year) are flagged in the UI as extrapolated from smoking data
- [ ] **S** Have a counsellor / health advisor sanity-check the final dataset before pilot

### Live dataset (vaping — in `milestones.seed.js`, version `vaping-v1`)

| Time after quitting | Benefit | Evidence |
|---------------------|---------|----------|
| 20 minutes | Heart rate & blood pressure drop | inferred |
| 4–24 hours | Withdrawal begins (cravings, irritability) | direct |
| 24 hours | Most nicotine cleared (~2h half-life) | direct |
| 2–3 days | Withdrawal peaks, then eases | direct |
| 1 week | Mood & cravings turn a corner | direct |
| 2 weeks | Circulation & breathing improve | direct |
| 2–4 weeks | Physical withdrawal resolves | direct |
| 3 months | Dopamine system rebalances | inferred |
| 1 year | Cardiovascular risk falls | inferred |

*"inferred" = extrapolated from smoking/nicotine studies; vaping-specific longitudinal data is still emerging.*

---

## E8 — Cross-Cutting  *(Both)*

- [~] **M** Privacy & data protection: sensitive youth health + location data.
      (done: consent flag, view/delete location history, data export, account+data deletion via Privacy screen.
      TODO: consent screens at signup, minimal-retention policy, encryption-at-rest review before pilot)
- [~] **M** Content moderation: report-to-hide implemented for reflections.
      TODO: profanity filter, moderator review queue (Phase 3 on slide 10)
- [x] **S** Notifications (milestone celebrations, streaks, savings-goal): event-based, generated server-side,
      in-app feed + bell badge + optional browser Notification opt-in.
      TODO: scheduled craving-time / nighttime push needs a service worker + push server (flagged for later)
- [ ] **S** Analytics for success metrics (slide 10): weekly active use, relapse/craving logs, feature engagement
- [ ] **S** Accessibility & mobile-first responsive design
- [ ] **M** Deployment: containerised deploy target, secrets management, DB backups (slide 9 budget: cloud hosting + secure auth)

---

## Data Model (starting point — refine in E0)

- **users** — id, quit_date, vape_spend_per_period, savings_goal, consent flags, created_at
- **health_milestones** *(reference)* — id, time_after_quit, title, description, source_citation
- **savings_goals** — id, user_id, label, target_amount
- **craving_events** — id, user_id, occurred_at, tool_used, outcome, lat, lng, context
- **reflections** — id, user_id (private), quit_stage/milestone_id, body, created_at, status (for moderation)
- **peer_reports** — id, reflection_id, reporter_id, reason, created_at

---

## Roadmap (from slide 10)

1. **Phase 1 — Build MVP:** Craving SOS, savings tracker, recovery timeline, trigger mapping
2. **Phase 2 — Pilot:** small pilot with schools/counsellors; test usability, engagement, privacy
3. **Phase 3 — Improve:** refine UX, strengthen moderation
4. **Phase 4 — Partner & Scale:** partner with HPB / schools / counsellors, expand access
   *(note: no longer relying on Healthy 365 data sync — timeline is self-contained researched milestones)*

**Success indicators:** lower relapse rates · high weekly usage · fewer repeat offences · positive youth/counsellor feedback.
