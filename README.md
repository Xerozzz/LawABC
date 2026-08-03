# ClearAir (LawABC)

An interactive, always-on app that supports youths in quitting vaping. Base version:
**React** (Vite) frontend, **Express** backend, **PostgreSQL**, wired with **Docker Compose**.

See [TASKS.md](TASKS.md) for the full feature roadmap and the two-developer split.

## Structure

```
LawABC/
├── docker-compose.yml            # Orchestrates db + backend + frontend
├── .env.example                  # Credentials + host ports (copy to .env)
├── frontend/                     # React + Vite
│   └── src/
│       ├── AuthContext.jsx       # Token auth state
│       ├── api.js                # API client
│       ├── theme.css             # Youth-centric theme
│       ├── components/           # Layout, SOS tools (breathing/game/story)
│       └── screens/              # Auth, Onboarding, Home, Timeline, Savings, SOS, Community, Profile
└── backend/                      # Express + pg
    └── src/
        ├── index.js              # App entry, route mounting
        ├── db.js                 # Pool + idempotent schema/seed on startup
        ├── schema.sql            # Tables
        ├── milestones.seed.js    # Health-recovery milestones (smoking placeholder — see TASKS.md E7)
        ├── auth.js               # JWT sign + requireAuth middleware
        └── routes/               # auth, profile, milestones, savings, cravings, reflections
```

## Run everything with Docker

```bash
docker compose up --build
```

Then open:

- Frontend: http://localhost:5173
- Backend health: http://localhost:4000/api/health
- Postgres: localhost:5432 (user/pass/db default to `lawabc`)

Stop with `Ctrl+C`; `docker compose down` removes containers (add `-v` to also wipe the DB volume).

### Port already in use?

The host ports are configurable so ClearAir can run alongside other projects. Copy `.env.example`
to `.env` and change any of `BACKEND_PORT`, `FRONTEND_PORT`, `DB_PORT` — the frontend automatically
points at whatever `BACKEND_PORT` you choose. One-off example:

```bash
BACKEND_PORT=4100 FRONTEND_PORT=5174 docker compose up
```

## Run services individually (without Docker)

Requires Node 20+ and a local Postgres.

```bash
# Backend
cd backend
npm install
DATABASE_URL=postgres://lawabc:lawabc_password@localhost:5432/lawabc npm run dev

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

## Features in this base version

- **Auth & onboarding** — sign up, set quit date, weekly spend, and a savings goal
- **Health Recovery Timeline** — milestone progress from a researched, cited **vaping-specific** dataset (`milestones.seed.js`); items extrapolated from smoking data are flagged as inferred
- **Savings Tracker** — real-time savings since quitting + goal progress
- **Craving SOS** — 60-second breathing exercise, tap mini-game, or motivational story, then logs the outcome (with optional location)
- **Trigger Map** — Leaflet map of where cravings happened + a proximity warning near past trigger spots
- **Anonymous Peer Support** — post/read reflections; author identity is never exposed; basic report-to-hide moderation
- **Notifications** — milestone / streak / savings-goal celebrations, in-app feed + bell badge, optional device notifications
- **Privacy & data** — view/delete location history, export all data as JSON, delete account (cascades all data)

## API endpoints

| Method | Path                        | Auth | Description                          |
|--------|-----------------------------|------|--------------------------------------|
| GET    | `/api/health`               | no   | Liveness check                       |
| POST   | `/api/auth/register`        | no   | Create account → `{ token, user }`   |
| POST   | `/api/auth/login`           | no   | Log in → `{ token, user }`           |
| GET    | `/api/profile`              | yes  | Current user profile                 |
| PUT    | `/api/profile`              | yes  | Update profile / complete onboarding |
| GET    | `/api/profile/export`       | yes  | Export all of the user's data (JSON) |
| DELETE | `/api/profile`              | yes  | Delete account + all data (cascade)  |
| GET    | `/api/milestones`           | yes  | Timeline with per-user progress      |
| GET    | `/api/savings`              | yes  | Savings + goal progress              |
| POST   | `/api/cravings`             | yes  | Log a craving event                  |
| GET    | `/api/cravings`             | yes  | Craving history                      |
| GET    | `/api/cravings/stats`       | yes  | Totals for dashboard                 |
| DELETE | `/api/cravings/:id`         | yes  | Delete one craving (privacy)         |
| DELETE | `/api/cravings`             | yes  | Clear all craving/location history   |
| GET    | `/api/notifications`        | yes  | Feed + unread count (auto-generates) |
| POST   | `/api/notifications/read`   | yes  | Mark all notifications read          |
| GET    | `/api/reflections`          | yes  | Anonymous reflection feed            |
| POST   | `/api/reflections`          | yes  | Post an anonymous reflection         |
| POST   | `/api/reflections/:id/report` | yes | Report → hide a reflection          |

Authenticated requests send `Authorization: Bearer <token>`.
