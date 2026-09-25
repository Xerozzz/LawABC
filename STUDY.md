# Running the 2-week pilot

How participation is measured, where the data lives, and how to pull it at payout.

## What counts as a day

Days are cut **midnight to midnight in `STUDY_TZ`** (default `Asia/Singapore`),
not in UTC and not in the participant's device timezone.

Each day lands in one of three states:

| State | Meaning |
|-------|---------|
| **active** | At least one *deliberate action* — this is the qualifying day |
| **opened** | The app was opened but nothing was done (a bare `screen_view`) |
| **missed** | No signal at all |

A deliberate action is any of:

- checking in on Home ("How is today going?" — the one-tap `daily_checkin`)
- logging a craving through Craving SOS (`craving_events`)
- finishing a breathing exercise, playing a game, watching a video, reading a story
- posting in the community, or joining someone's post (the community is closed
  while testing — `COMMUNITY_ENABLED=false` — so this doesn't apply by default)
- adding or editing a trigger
- updating the profile, opening notifications, unlocking a shop item

Opening the app and immediately closing it does **not** count. That distinction is
the whole point of splitting *opened* from *active* — you can see who was going
through the motions.

## Where the data comes from

There is no separate tracking table. Participation is computed on the fly from
the tables that already record what happened (`events`, `craving_events`,
`reflections`, `reflection_joins`, `unlocks`) — see `backend/src/activity.js`.

That matters for two promises the app already makes: `/api/profile/export` still
exports everything, and deleting an account still erases the participant from
the study data via `ON DELETE CASCADE`. Nothing to keep in sync.

## Configuration

| Variable | Default | Notes |
|----------|---------|-------|
| `ADMIN_TOKEN` | *(unset)* | Shared secret for `/api/admin/*`. Unset ⇒ the API is disabled, not open. |
| `STUDY_DAYS` | `14` | Length of each participant's window |
| `STUDY_TZ` | `Asia/Singapore` | Timezone the days are cut on |
| `STUDY_START_DATE` | *(unset)* | Fixed cohort start (`YYYY-MM-DD`). Unset ⇒ each participant's 14 days begin the day they accept consent. |

Terraform generates `ADMIN_TOKEN` automatically. Read it with:

```bash
cd infra && terraform output -raw admin_token
```

## Pulling the data

```bash
APP=http://<your-app-host>
TOKEN=$(cd infra && terraform output -raw admin_token)

# Is the study alive? (participants, median active days, distribution)
curl -s -H "x-admin-token: $TOKEN" "$APP/api/admin/summary"

# The payout spreadsheet — one row per participant, one column per day
curl -s -H "x-admin-token: $TOKEN" "$APP/api/admin/participation.csv" -o participation.csv

# One participant's complete log, to read feedback alongside their usage
curl -s -H "x-admin-token: $TOKEN" "$APP/api/admin/users/7/logs" | jq .
```

`participation.csv` carries `active_days` per participant plus `day_1`…`day_14`
action counts, so the reward rule ("N of 14 active days") is a single spreadsheet
filter — and a participant can verify the same number from their own grid.

## What participants see

The Progress screen shows each participant their own 14-day grid: active days
filled, opened-only days dashed, and the same rule text as above.

The 🔥 streak on Home uses the same "active day" rule, with one difference: a day
on which they log "I vaped" (in Craving SOS, or "Vaped today? Log it honestly" on
Home, stored as a craving with `tool_used = 'checkin'`) breaks the streak (it still counts as
an active day for participation — logging a slip honestly is engagement). Days
vape-free and the health-recovery milestones (they are "time since nicotine"
facts) also restart from a logged vape; money saved keeps counting from the quit
date. See `backend/src/streak.js`.

This drives compliance, but be aware it also makes the target visible — expect
some late-evening token actions. Read the qualitative feedback with that in mind.

## Backups

The reward data lives in a Postgres container on a single instance. `ops/backup-db.sh`
runs nightly at 03:15 SGT and is installed automatically on first boot. To also
copy dumps off the instance, set `S3_BUCKET` in `/etc/cron.d/clearair-backup`
(the instance needs an IAM role with `s3:PutObject` for that bucket — and the
bucket must **not** be public: dumps contain participant PII and password hashes).

```bash
# on the instance
sudo /opt/clearair/ops/backup-db.sh          # run one now
ls -lh /var/backups/clearair                 # last 30 days
```

## Before you recruit

Tracking is not retroactive — you only get data from the moment this is deployed.
Deploy first, verify with `curl .../api/admin/summary`, then onboard participants.
