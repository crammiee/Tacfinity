# Tacfinity

Online multiplayer Tic Tac Toe platform — rooms, real-time gameplay, ELO ratings, and offline bot support.

## Prerequisites

- [Node.js](https://nodejs.org) v20+ (Prisma 6 requires it)
- [pnpm](https://pnpm.io) v9+ — `npm install -g pnpm` (or use [the standalone installer](https://pnpm.io/installation))
- [Docker](https://docs.docker.com/get-docker/) — runs the local Postgres database

> **Linux users:** if `docker` commands give you `permission denied`, either run them with `sudo` or add yourself to the docker group: `sudo usermod -aG docker $USER && newgrp docker`.

## Quick Setup

```bash
# 1. Install dependencies (this creates pnpm-lock.yaml and node_modules/)
pnpm install

# 2. Set up the API env file
cp apps/api/.env.example apps/api/.env

# 3. Start the Postgres container (runs in the background)
docker compose up -d

# 4. Apply the database schema
pnpm db:migrate

# 5. Start the dev servers (web + api in parallel)
pnpm dev
```

If everything works:

| Service | URL |
|---|---|
| Web (Vite) | http://localhost:5173 |
| API (Express) | http://localhost:3001 |
| API health check | http://localhost:3001/health |
| Postgres | `localhost:5433` (user: `tacfinity`, password: `tacfinity`, db: `tacfinity`) |

> **Why port 5433?** Some systems already run Postgres on the default 5432. We use 5433 for our Docker container to avoid the conflict. The connection URL in `.env.example` already points to 5433.

## Database Commands

```bash
# Start Postgres (run once per dev session, container persists)
docker compose up -d

# Stop Postgres (data persists in the named volume)
docker compose stop

# Stop AND delete data (start fresh)
docker compose down -v

# Apply pending migrations
pnpm db:migrate

# Open a GUI to browse tables and edit rows
pnpm db:studio

# Wipe the database and re-run all migrations from scratch
pnpm db:reset
```

`pnpm db:studio` opens a browser at http://localhost:5555 — handy for confirming your code wrote what you expected.

## Monorepo Structure

```
apps/
├── web/          # React + Vite + Tailwind + shadcn/ui
└── api/          # Express + Prisma + Socket.io
packages/
└── shared/       # Zod schemas, game logic, AI engine — used by both apps
```

## Common Commands

```bash
pnpm dev                              # run all dev servers in parallel
pnpm build                            # build all packages
pnpm --filter @tacfinity/web dev      # web only
pnpm --filter @tacfinity/api dev      # api only
pnpm --filter @tacfinity/shared test  # run shared package tests
pnpm -r test                          # run all tests
```

## Adding a shadcn/ui Component

```bash
pnpm --filter @tacfinity/web dlx shadcn@latest add button
```

Components are placed in `apps/web/src/shared/ui/`.

## Troubleshooting

**`docker compose up` fails with "port is already allocated"**
Another Postgres (or another app) is already on 5433. Stop it, or change the host port in `docker-compose.yml` and update `DATABASE_URL` in `apps/api/.env` to match.

**`pnpm db:migrate` fails with `P1001` (cannot reach database)**
Make sure the container is running: `docker compose ps`. If it isn't, run `docker compose up -d`.

**`pnpm db:migrate` fails with `P1010` (user denied access)**
You're probably hitting a different Postgres than the Docker one. Confirm `DATABASE_URL` in `apps/api/.env` ends with `:5433/tacfinity`.

**Schema changed but Prisma Client types are stale**
Run `pnpm --filter @tacfinity/api db:generate` to regenerate the client.

**`docker compose ps` shows nothing on Linux but you started it with `sudo`**
Containers started as root are invisible to non-root commands. Either keep using `sudo`, or add yourself to the docker group (see Prerequisites).

## Tech Stack

| Area | Tech |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS v4, shadcn/ui |
| State | TanStack Query, Zustand, React Router v7 |
| Backend | Express 5, TypeScript, Socket.io |
| Database | PostgreSQL 16 via Prisma 6 |
| Validation | Zod (shared between FE and BE) |
| Testing | Vitest, Playwright, Supertest |
| Package manager | pnpm workspaces |

## Docs

- `refdocs/api-patterns.md` — API and socket event contracts (read before touching routes)
- `refdocs/clean-code-practices.md` — naming, structure, and style rules (read before writing code)
