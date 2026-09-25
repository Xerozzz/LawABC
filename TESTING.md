# ClearAir — User Testing Methodology

A practical plan for testing the ClearAir prototype with youths and counsellors, and turning
their feedback into decisions. Tailored to the features that exist today and the in-app analytics
already collected.

> **Read this first — this is a youth + health + sensitive-topic study.** Participants are likely
> minors trying to quit an addictive product. Sections **4 (Ethics & Safeguarding)** and
> **3 (Participants)** are not optional boilerplate — settle them *before* recruiting anyone.

---

## 1. Purpose & research questions

**Overarching question:** Does ClearAir provide the *accessible, continuous, effective* support
that youths lack at home — and will they actually use it to quit vaping?

| # | Research question | Feature(s) it probes |
|---|-------------------|----------------------|
| RQ1 | Can youths sign up and set up a quit plan without help? | Consent, onboarding |
| RQ2 | When a craving hits, does the app help them get through it? | Craving SOS, trigger map |
| RQ3 | Do the progress tools feel motivating enough to come back to? | Health timeline, savings, notifications |
| RQ4 | Does the anonymous community feel safe and supportive? *(only if `COMMUNITY_ENABLED=true` — closed by default while testing)* | Peer reflections |
| RQ4b | Do youths recognise their own triggers, and does having a plan ready help? | My triggers, Craving SOS |
| RQ5 | Do youths trust the app with their data? | Consent, privacy controls |
| RQ6 | Does the help/crisis signposting work and feel appropriate? | Help screen |
| RQ7 | Between touchpoints, do they keep using it? | Overall engagement (analytics) |

---

## 2. Approach — mixed-methods, two phases

Small studies find most issues; real behaviour needs real time. So run both:

**Phase A — Moderated usability sessions** (week 1)
5–8 youths + 2–3 counsellors, ~30–45 min each, in person or video. Task-based "think-aloud."
Purpose: find and fix usability blockers fast before the wider pilot. (~5 users surface the
majority of usability problems.)

**Phase B — Field pilot** (2–4 weeks)
15–30 youths using it in daily life via school counsellors / the quit programme. Purpose:
real-world engagement, retention, and helpfulness — measured with the built-in analytics plus
pre/post surveys and short interviews.

Fix critical issues from Phase A before Phase B starts.

---

## 3. Participants & recruitment

- **Primary users:** youths who currently vape or are trying to quit (the real audience — recruit
  through school counsellors or the cessation programme, not a general convenience sample).
- **Secondary users:** counsellors/teachers who would recommend or co-use it.
- **Sample size:** 5–8 (Phase A), 15–30 (Phase B). Aim for a mix of genders, quit stages, and
  home-support levels (the problem statement centres on youths *lacking* home support).
- **Exclude:** anyone for whom participation could cause harm, per counsellor judgement.

**Recruitment materials needed:** a short screener, a plain-language study info sheet, and consent
forms (see §4). Keep the ask low-pressure and voluntary.

---

## 4. Ethics & safeguarding  ⚠️

Non-negotiable for this population. Confirm with the school / programme / an ethics reviewer.

- **Consent & assent:** for minors, get **parental/guardian consent** *and* the youth's own assent.
  Participation is voluntary; they can stop anytime with no penalty and no effect on their care.
- **Approvals:** check whether the school and/or an ethics board (IRB-equivalent) must sign off
  before you collect data.
- **Data handling:** the app already records in-app consent and lets users export/delete their data.
  For *research* data (notes, recordings, surveys): anonymise (use participant codes, not names),
  store securely, restrict access, and delete on a stated schedule. Don't link survey answers to
  identities unless necessary.
- **Distress protocol (write this before you start):** the topic can surface anxiety, low mood, or
  disclosures of risk. If a participant shows distress or discloses harm:
  1. Pause the task — their wellbeing comes before the test.
  2. Point them to the in-app **Help** resources and/or their counsellor.
  3. Escalate per the school's safeguarding policy; for immediate danger, emergency services (995).
  Have the counsellor present or on-call for youth sessions.
- **No coercive incentives.** Modest thank-you only, and never contingent on "using it more."
- **Anonymity:** reassure participants that community reflections are anonymous to other users
  (only relevant if the community is switched on — it is closed by default while testing).

---

## 5. What we test — task scenarios (Phase A)

Give **goals**, not click-by-click instructions, and let them figure it out (that's the point).
Observe silently; use think-aloud prompts ("what are you expecting here?").

1. **Get started.** "Set yourself up in the app as if today's the day you're quitting."
   → consent, onboarding (quit date, spend, goal)
2. **Beat a craving.** "Imagine you just got a strong urge to vape. Use the app to get through the
   next minute." → Craving SOS (breathing / game / story) + check-in
   *(Follow-up: "Say you did vape today — how would you tell the app?" → "I vaped" in SOS, or
   "Vaped today? Log it honestly" on Home. Watch how they react to the streak resetting.)*
3. **See your progress.** "Find out what's improving in your body since you stopped." → Health timeline
4. **Money saved.** "Check how much you've saved, and set something you're saving toward." → Savings
5. **Know your triggers.** "Add something that usually sets off a craving for you, and what you'll do
   instead. Then use SOS and say what set it off." → My triggers (Triggers tab) + Craving SOS
   *(If `COMMUNITY_ENABLED=true`: "See what others going through this have said, and share something
   yourself." → Community)*
6. **Get real help.** "You're worried about a friend who's struggling — find proper support." → Help
7. **Your data, your call.** "You've decided you want your information removed." → Privacy & data

**Per task capture:** completed unaided? / needed a hint? / failed?; where they hesitated; quotes.

---

## 6. Metrics

### Usability (Phase A)
- **Task success rate** (unaided / assisted / failed) per task — target ≥ 80% unaided on core tasks (1–4).
- **Time on task** and **error/ hesitation points**.
- **SUS (System Usability Scale)** — 10 items, gives a 0–100 score you can benchmark (see §7). Target ≥ 68 (above average); aim 75+.

### Engagement (Phase B — from the built-in analytics)
The app logs `events` (screen views + key actions) and `craving_events`. These map directly to the
slide-10 success indicators:

| Slide-10 indicator | Measure from data |
|--------------------|-------------------|
| High weekly app usage | Weekly active users; median sessions/user/week |
| Fewer craving relapses | Share of logged cravings with outcome = `passed` vs `vaped` |
| Feature value | Reach per feature (screen views by path); SOS starts; reflections posted |
| Retention | % of users active in week 2, 3, 4 |

Example queries in §8.

### Attitudes / efficacy signals (pre & post survey)
- Confidence to stay vape-free (1–10), quit readiness, perceived helpfulness, trust in privacy,
  likelihood to recommend (NPS-style). Self-reported cravings/slips over the pilot.

---

## 7. Instruments (ready to use / adapt)

### 7a. Moderated session script
1. **Welcome (2 min):** thanks; it's the *app* being tested, not them; no right answers; think aloud;
   they can stop anytime. Confirm consent/assent. Ask permission to take notes (and record, if used).
2. **Warm-up (2 min):** "Tell me about a time you (or a friend) tried to cut down on vaping."
3. **Tasks (20–25 min):** the 7 scenarios in §5, one at a time. Stay quiet; prompt only when stuck.
4. **Debrief (5 min):** best/worst part? what was confusing? would you use this for real? what's missing?
5. **SUS (2 min)** and thanks.

### 7b. SUS — 10 statements (respond 1 = strongly disagree … 5 = strongly agree)
1. I think I would like to use ClearAir frequently.
2. I found ClearAir unnecessarily complex.
3. I thought ClearAir was easy to use.
4. I think I would need help from a person to use ClearAir.
5. I found the various functions in ClearAir well integrated.
6. I thought there was too much inconsistency in ClearAir.
7. I imagine most people would learn to use ClearAir very quickly.
8. I found ClearAir very awkward to use.
9. I felt very confident using ClearAir.
10. I needed to learn a lot before I could get going with ClearAir.
*Scoring: odd items → (response − 1); even items → (5 − response); sum × 2.5 = 0–100.*

### 7c. Post-pilot survey (5–10 min)
- Overall, how helpful was ClearAir in your effort to quit? (1–5)
- Which feature helped most? (Craving SOS / Check-in streak / Health timeline / Savings / My triggers & map / Notifications)
- The Craving SOS helped me get through urges. (1–5)
- I felt my information was private and safe. (1–5)
- I would recommend ClearAir to a friend trying to quit. (0–10)
- Compared with when you started, how confident are you about staying vape-free? (1–10)
- What did you like most? / What frustrated you? / What's missing? (open text)

### 7d. Counsellor interview guide (semi-structured)
- Where does this fit alongside your existing support? What gap does it fill / not fill?
- Would you recommend it to the youths you work with? What would stop you?
- Concerns about safety, moderation, or privacy? What would you need to feel comfortable?

### 7e. In-app feedback
Add a one-tap "Send feedback" in-app so testers can report a bug or reaction *in the moment*
(higher-quality than recall). *(Not built yet — see §10; it stores to the DB alongside analytics.)*

---

## 8. Reading the analytics (example SQL)

Run against the Postgres DB (`docker compose exec db psql -U clearair`). Exclude the demo seed user.

```sql
-- Weekly active users
SELECT date_trunc('week', created_at) AS week, count(DISTINCT user_id) AS active_users
FROM events GROUP BY 1 ORDER BY 1;

-- Craving outcomes (did the SOS help?)
SELECT outcome, count(*) FROM craving_events GROUP BY outcome;

-- Feature reach (which screens get used)
SELECT meta->>'path' AS screen, count(*) AS views
FROM events WHERE type = 'screen_view' GROUP BY 1 ORDER BY 2 DESC;

-- SOS usage by tool chosen
SELECT meta->>'tool' AS tool, count(*) FROM events WHERE type = 'sos_started' GROUP BY 1;

-- Retention: users active in each week since signup
SELECT date_trunc('week', created_at) AS week, count(DISTINCT user_id)
FROM events GROUP BY 1 ORDER BY 1;
```

---

## 9. Procedure & timeline (indicative)

| When | Activity |
|------|----------|
| Week 0 | Approvals + consent forms; recruit; **enable HTTPS** (needed to test geolocation & notifications); confirm helpline numbers; optional: add in-app feedback |
| Week 1 | Phase A moderated sessions → severity-rank issues → fix criticals |
| Weeks 2–5 | Phase B field pilot; weekly check-ins with counsellors; watch analytics |
| Week 6 | Post-survey + interviews; pull analytics; synthesise |

---

## 10. Analysis & decisions

- **Usability:** list issues, severity-rank (blocker / major / minor), fix blockers before pilot.
- **Engagement:** compare analytics to targets (§6); note which features earn repeat use vs get ignored.
- **Qualitative:** thematic analysis of think-aloud, interviews, and open-text — group into themes,
  quote representative voices.
- **Synthesise** into: keep / fix / cut / add — feeding Phase 3 ("Improve") of the roadmap.

### Suggested go/iterate criteria (set your own before starting)
- SUS ≥ 68 and ≥ 80% unaided success on core tasks (1–4)
- A meaningful share of cravings logged as `passed`
- Users returning in weeks 2–4 (not just day 1)
- Majority report equal-or-higher confidence to stay vape-free
- **Zero mishandled safeguarding incidents** (a hard gate, not a metric)

---

## 11. Dependencies before you recruit

- **HTTPS + domain** — the trigger-map geolocation and device notifications won't work over plain
  HTTP, so testers can't fairly evaluate them. (See DEPLOY.md.)
- **Verify helpline numbers** on the Help screen with your programme partners.
- **(Recommended) In-app feedback capture** so testers can report issues in the moment.
- **(Recommended) A nightly DB backup** so a pilot's worth of data can't vanish.
