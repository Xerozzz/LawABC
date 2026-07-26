# LawABC

Skeleton full-stack app: **React** (Vite) frontend, **Express** backend, **PostgreSQL** database, wired together with **Docker Compose**.

## Structure

```
LawABC/
├── docker-compose.yml       # Orchestrates all three services
├── .env.example             # Postgres credentials (copy to .env)
├── frontend/                # React + Vite
│   ├── src/App.jsx          # Calls the backend
│   └── Dockerfile
├── backend/                 # Express + pg
│   ├── src/index.js         # API routes
│   ├── src/db.js            # Postgres pool
│   └── Dockerfile
└── db/
    └── init/01_init.sql     # Runs on first DB startup
```

## Run everything with Docker

```bash
docker compose up --build
```

Then open:

- Frontend: http://localhost:5173
- Backend health: http://localhost:4000/api/health
- Backend DB check: http://localhost:4000/api/db-time
- Postgres: localhost:5432 (user/pass/db default to `lawabc`)

Stop with `Ctrl+C`, and `docker compose down` to remove containers (add `-v` to also wipe the database volume).

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

## Endpoints

| Method | Path            | Description                     |
|--------|-----------------|---------------------------------|
| GET    | `/api/health`   | Liveness check                  |
| GET    | `/api/db-time`  | Returns `NOW()` from Postgres   |
