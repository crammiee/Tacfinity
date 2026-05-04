# Tacfinity Development Plan

> Living document. Update this when scope, stack, or deadlines change.

## Context

Tacfinity is being scaled from a solo, offline-only React/TS game (the existing `src/` tree) into a chess.com-style full-stack platform for CMSC 126. The course rubric grades on clean code, layered separation, security, real-time support, offline/PWA support, Lighthouse ≥90, and a cron-job feature. The original vibe-coded codebase is kept only as a reference — we are starting the repo over with a proper monorepo, feature-based architecture, and documented conventions so every future change (by a teammate or by an AI agent) follows the same rules.

This plan covers (1) the target architecture and folder layout, (2) a phased build plan aligned to the course deadlines, and (3) the reference documents that serve as the contract for all future code.

## Tech Stack (Locked)

| Area       | Choice                                                                          |
| ---------- | ------------------------------------------------------------------------------- |
| Repo       | pnpm monorepo (`apps/web`, `apps/api`, `packages/shared`)                       |
| Frontend   | React + TypeScript + Vite + TailwindCSS + shadcn/ui                             |
| FE state   | TanStack Query (server) + Zustand (client) + React Router                       |
| Backend    | Node.js + Express + TypeScript, feature-based layered architecture              |
| DB         | PostgreSQL via Prisma (schema-first, generated types)                           |
| Realtime   | Socket.io (authoritative server, client sends intent)                           |
| Validation | Zod schemas in `packages/shared`, used by both FE and BE                        |
| Auth       | httpOnly cookie + refresh-token rotation (access 15m, refresh 7d)               |
| Cron       | node-cron registered in `apps/api/src/shared/cron/`                             |
| Testing    | Vitest + Testing Library + Playwright + Supertest                               |
| Tooling    | ESLint (flat config) + Prettier + Husky + lint-staged + commitlint              |
| Deployment | Deployment-agnostic: Dockerfile per app + `.env.example`; provider chosen later |

## Target Repo Structure

```
tacfinity/
├── apps/
│   ├── web/                      # React + Vite PWA
│   │   └── src/
│   │       ├── features/         # vertical slices
│   │       │   ├── auth/         # components, hooks, api, store, schemas
│   │       │   ├── lobby/
│   │       │   ├── game/         # online multiplayer UI
│   │       │   ├── offline-bot/  # offline game UI (ports AI engine)
│   │       │   ├── leaderboard/
│   │       │   ├── profile/
│   │       │   └── matchmaking/
│   │       ├── shared/
│   │       │   ├── ui/           # shadcn/ui components (owned)
│   │       │   ├── layouts/      # AppShell, AuthShell
│   │       │   ├── hooks/        # useSocket, useAuth
│   │       │   ├── lib/          # query client, axios, socket client
│   │       │   └── styles/
│   │       ├── routes.tsx
│   │       ├── main.tsx
│   │       └── pwa/              # service worker, offline fallback
│   ├── api/                      # Express + Prisma
│   │   └── src/
│   │       ├── features/         # vertical slices
│   │       │   ├── auth/         # .routes .controller .service .repo .schemas .test
│   │       │   ├── users/
│   │       │   ├── rooms/
│   │       │   ├── games/        # REST (result/replay) + socket handlers
│   │       │   ├── matchmaking/  # in-memory queue + socket handlers
│   │       │   ├── leaderboard/
│   │       │   └── rating/       # ELO calc, pure functions
│   │       ├── shared/
│   │       │   ├── db/           # Prisma client singleton
│   │       │   ├── middleware/   # auth, error, rate-limit, request-id, logger
│   │       │   ├── sockets/      # socket.io bootstrap, auth middleware, registry
│   │       │   ├── cron/         # cron registry + jobs
│   │       │   ├── errors/       # AppError, HttpError classes
│   │       │   └── utils/
│   │       ├── config/           # env parsing via Zod
│   │       └── server.ts
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── migrations/
├── packages/
│   └── shared/                   # consumed by both apps
│       ├── src/
│       │   ├── schemas/          # Zod schemas → source of truth for types
│       │   ├── tgn/              # parser, serializer, tests
│       │   ├── game-logic/       # WinDetector, board helpers (ported)
│       │   ├── ai/               # AIFactory + engines (ported, pure functions)
│       │   └── types/            # derived from Zod schemas
│       └── package.json
├── docs/
│   ├── development-plan.md       # this document
│   ├── clean-code-practices.md
│   ├── api-patterns.md
│   └── Tacfinity_Proposal.md
├── .github/workflows/ci.yml
├── docker-compose.yml            # postgres for local dev
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

## Existing Code to Port (not rewrite)

These modules are proven by use and should move to `packages/shared/` as pure functions, not be reimplemented:

- `src/game/WinDetector.ts` → `packages/shared/src/game-logic/win-detector.ts`
- `src/game/GameState.ts` logic (the pure parts — board mutation, switchPlayer) → `packages/shared/src/game-logic/board.ts`
- `src/ai/*` (AIPlayer, EasyAI, MediumAI, HardAI, AIFactory, BoardEvaluator, MinimaxEngine, HeuristicEngine) → `packages/shared/src/ai/`
- `src/types.ts` (Player, Cell, GameSettings) → `packages/shared/src/types/`

What gets rewritten fresh:

- All UI (`src/components/*`, `src/styles/*`, `index.html`) — new React + shadcn/ui implementation.
- `src/main.ts` — replaced by `apps/web/src/main.tsx` + router.
- `src/game/GameController.ts` — split into an `apps/web/src/features/offline-bot/controller.ts` (offline) and the authoritative server-side `apps/api/src/features/games/game.service.ts` (online).

## Data Model (Prisma)

Close to the proposal, with three corrections applied:

- `User.rating` default → **1000** (matches proposal narrative; 800 was a typo).
- `Room.type` is an enum (`CASUAL` | `RANKED`); `Room.status` is an enum (`WAITING` | `IN_GAME` | `FINISHED`).
- `RoomPlayer.role` is `PLAYER` | `SPECTATOR` (proposal conflated the column name with the enum).
- `Game.moves` stores TGN (stringified) as planned — written once on game end, null during play.

## Server-Authoritative Real-time Flow

Non-negotiable: the server is the single source of truth for every game. This prevents cheating and makes replays/reconnections trivial.

1. Client sends `game:move` with `{ gameId, row, col }` only — no symbol, no move number.
2. Server: `gameService.applyMove()` — verifies turn, verifies cell empty, verifies player is in the game, pushes to in-memory `moves[]`, runs `WinDetector`, broadcasts `game:update` with the authoritative TGN token (`"X:0,2"`) to the room.
3. On win/draw: server writes the full TGN string + winner_id + ended_at to Postgres in **one** UPDATE, runs ELO adjustment, emits `game:end`.
4. On disconnect: server keeps moves[] in memory. On reconnect, server re-serializes → sends `game:sync` with the full TGN string. Client reconstructs the board by replaying.

## Phased Build Plan (aligned to course deadlines)

Course deadlines: weekly reports April 24, May 1, May 8; final PR May 16. The plan fits inside that runway with deliberate slack for Lighthouse tuning and bug-fix week.

### Phase 0 — Foundation (Week of Apr 22–24)

- Initialize pnpm monorepo, workspace config, shared TS config.
- Scaffold `apps/web` (Vite + React + TS + Tailwind + shadcn/ui init), `apps/api` (Express + TS), `packages/shared`.
- docker-compose with Postgres; Prisma schema v1; first migration.
- ESLint / Prettier / Husky / lint-staged configured once, inherited by every package.
- CI: lint + typecheck + test on PR.
- Port AI engine + WinDetector + TGN parser into `packages/shared`. Verified by a manual demo script (`packages/shared/scripts/demo.ts`) that exercises each subsystem end-to-end. Vitest coverage is deferred — see Phase 3.
- Reference docs (`clean-code-practices.md`, `api-patterns.md`, `README (for onboarding dev teammates)`) finalized before any feature code lands, so the team is aligned.

### Phase 1 — Auth + Offline game (Week of Apr 24–May 1)

- `features/auth` on both sides: register, login, refresh, logout. httpOnly cookies, bcrypt, rate limiting on login.
- `apps/web` offline game path ported fully: board, setup panel, status bar — in React + shadcn. Uses shared AI engine. Works with no backend.
- PWA scaffold: manifest, service worker, offline detection hook.
- First weekly report milestone: auth works end-to-end, offline game playable, shared package tests green.

### Phase 2 — Online play + Rooms (Week of May 1–May 8) — 4-day sprint

**Scope change from original plan:** room customization, rematch, reconnection, Play a Friend, and the profile/standalone leaderboard pages are deferred to Phase 3. The leaderboard now lives on the home page, not a separate route. Game mode is fixed at **11×11 board, 5-in-a-row win condition** — no configuration UI.

**Fixed game settings (hardcoded, no UI controls):**

- Board: 11×11
- Win condition: 5 in a row (horizontal, vertical, diagonal)
- Room type defaults to CASUAL for Phase 2; RANKED deferred.

**Team split:**

| Who                | Deliverable                                                                                                                                                                                                                                                            |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canete (fullstack) | Page scaffolds + routing: home (unauth + auth), `/login`, `/register`, `/play/online`, `/play/bot`. Rough layout only — no styling polish. Auth guard on `/play/*`.                                                                                                    |
| Backend            | Socket.io bootstrap + auth middleware. Matchmaking queue (in-memory, fixed settings). Game service: move validation, win detection (11×11 / 5-in-a-row), `game:end` + ELO write. Socket events: `queue:join`, `queue:matched`, `game:move`, `game:update`, `game:end`. |
| Frontend ×3        | Shared component library built in parallel: `Sidebar`, `TopBar`, `HeroSection`, `PlayMenu`, `Leaderboard`, `GameBoard`, `PlayerLabel`, `RightPanel`, `MatchmakingTimer`, `DifficultyPicker`. Wire into Canete's scaffolds once they land.                              |

**Deferred to Phase 3:** room customization, rematch button, reconnection (`game:sync`), Play a Friend / custom rooms, profile page, standalone leaderboard page, Playwright E2E.

- Second weekly report milestone: home page renders (both auth states), routing works, online matchmaking queues two browser windows into a live game.

### Phase 3 — Polish, Cron, Lighthouse, Tests (Week of May 8–May 16)

- Cron jobs: abandoned game cleanup (hourly), rating decay (daily), queue timeout (minute).
- Leaderboard + profile pages.
- Playwright E2E for critical flows (auth, offline game, online game, reconnect).
- Lighthouse tuning: code-split routes, compress images, preload shadcn fonts, audit CLS on board render.
- Final code review pass: every feature folder audited against `clean-code-practices.md`.
- Submit PR on May 16.

## Reference Documents

These are the contracts every future PR is graded against. Read them before writing code.

- [`clean-code-practices.md`](./clean-code-practices.md) — naming, functions, TypeScript, error handling, logging, async, React and backend specifics, security, git, testing norms. Enforced by ESLint + Husky + PR review.
- [`api-patterns.md`](./api-patterns.md) — URL conventions, response envelope, error codes, validation, auth, pagination, idempotency, socket event contracts, **canonical test template** (§12), REST and socket catalogs.

## Reuse Map

| Existing file                      | New home                                                                    | Treatment                          |
| ---------------------------------- | --------------------------------------------------------------------------- | ---------------------------------- |
| `src/ai/*`                         | `packages/shared/src/ai/`                                                   | Move verbatim, add Vitest tests    |
| `src/game/WinDetector.ts`          | `packages/shared/src/game-logic/win-detector.ts`                            | Move verbatim                      |
| `src/types.ts`                     | `packages/shared/src/types/game.ts`                                         | Move, widen with Zod-derived types |
| `src/game/GameState.ts`            | Split: pure helpers → shared; stateful class → offline-bot feature          | Refactor                           |
| `src/game/GameController.ts`       | Delete; logic split between offline-bot feature (FE) and games feature (BE) | Rewrite                            |
| `src/components/*`, `src/styles/*` | Delete                                                                      | Rewrite in React + shadcn          |

## Verification Checkpoints

1. After Phase 0: `pnpm install` at repo root succeeds; `pnpm -r typecheck` passes; ported AI / WinDetector tests green via `pnpm --filter shared test`.
2. After Phase 1: manually register → login → play offline against AI → refresh page → still authenticated. `pnpm --filter api test` green.
3. After Phase 2: two browser windows play a live game, one refreshes mid-game, board reconstructs from server TGN. Playwright flow covers it.
4. Before PR submission: `pnpm -r lint && pnpm -r typecheck && pnpm -r test` green; Lighthouse ≥90 on desktop + mobile for `/`, `/play`, `/leaderboard`; `api-patterns.md` endpoint catalog matches actual routes (CI script).

## Changelog

Record scope / stack / deadline changes here so the history is auditable.

- **2026-04-22** — Initial plan approved. Stack locked. Phase 0 begins.
