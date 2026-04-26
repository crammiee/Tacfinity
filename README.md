# Tacfinity

Online multiplayer Tic Tac Toe platform — rooms, real-time gameplay, ELO ratings, and offline bot support.

## Prerequisites

- [Node.js](https://nodejs.org) v18+
- [pnpm](https://pnpm.io) v9+ — `npm install -g pnpm`
- [Docker](https://docs.docker.com/get-docker/) — for the local Postgres database

## Quick Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Copy env files
cp apps/api/.env.example apps/api/.env

# 3. Start the database
docker compose up -d

# 4. Run migrations
pnpm --filter @tacfinity/api exec prisma migrate dev

# 5. Start everything
pnpm dev
```

| Service | URL |
|---|---|
| Web (Vite) | http://localhost:5173 |
| API (Express) | http://localhost:3001 |
| Health check | http://localhost:3001/health |

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

## Tech Stack

| Area | Tech |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS v4, shadcn/ui |
| State | TanStack Query, Zustand, React Router v7 |
| Backend | Express 5, TypeScript, Socket.io |
| Database | PostgreSQL via Prisma |
| Validation | Zod (shared between FE and BE) |
| Testing | Vitest, Playwright, Supertest |
| Package manager | pnpm workspaces |

## Docs

- `refdocs/api-patterns.md` — API and socket event contracts (read before touching routes)
- `refdocs/clean-code-practices.md` — naming, structure, and style rules (read before writing code)
