# Clean Code Practices

This is the code-quality contract for Tacfinity. Every pull request is reviewed against it. If a rule here conflicts with something a library's tutorial shows, this document wins.

If you want to understand _why_ any rule exists, each one has a short rationale. If the rationale doesn't apply to your situation, say so in the PR — rules serve the code, not the other way around.

---

## 1. Philosophy

- **Smaller is better.** Prefer short functions, short files, short PRs. Big things hide bugs.
- **Code is read more than it is written.** Optimize for the next person who reads it (which is usually you, three weeks later).
- **Delete aggressively.** Dead code, commented-out blocks, unused exports, "just in case" utilities — all get removed. Git remembers.
- **No speculative generality.** Do not add a parameter, a config flag, or an abstraction for a need that does not exist _today_. Three similar lines beat a premature abstraction.
- **Boring beats clever.** If two readers will disagree about what a line does, rewrite it.

---

## 2. Naming

- **Variables are nouns**: `currentPlayer`, `winningCells`, `accessToken`.
- **Functions are verbs**: `applyMove`, `parseTgn`, `calculateElo`.
- **Booleans are predicates**: `isGameOver`, `hasWon`, `canJoinRoom`. Never `gameOver` as a boolean.
- **No single-letter names** except loop indices (`i`, `j`) and truly conventional math (`x`, `y` for coordinates).
- **No abbreviations** except domain terms: TGN, ELO, AI, DTO, JWT, UI, API, DB. `usr`, `btn`, `msg` are not acceptable.
- **Match the domain.** If the proposal calls it a "room", don't call it a "lobby" in code. Consistency with the spec is a feature.
- **Constants are `SCREAMING_SNAKE_CASE`**: `MAX_BOARD_SIZE`, `RATING_DECAY_DAYS`.
- **React components are `PascalCase`**: `GameBoard`, `AuthShell`.
- **Hooks are `useCamelCase`**: `useSocket`, `useAuth`.
- **File names mirror their primary export.** `GameBoard.tsx` exports `GameBoard`. `auth.service.ts` exports `authService`. No `utils.ts` files — pick a specific name.

---

## 3. Functions

- **Single responsibility.** If a function's name needs "and" in it, split it.
- **Guideline: ≤40 lines.** Longer is allowed but requires a real reason; if you find yourself writing comments to section a function, those sections are separate functions.
- **Early returns over nested ifs.** Flat is better than pyramidal.

  ```ts
  // bad
  function canMove(cell: Cell, player: Player): boolean {
    if (cell === null) {
      if (isPlayersTurn(player)) {
        return true;
      }
    }
    return false;
  }

  // good
  function canMove(cell: Cell, player: Player): boolean {
    if (cell !== null) return false;
    if (!isPlayersTurn(player)) return false;
    return true;
  }
  ```

- **Pure where possible.** If a function does not need to mutate anything or do I/O, don't let it.
- **Parameters ≤4.** If you have more, pass an object. Name the object type.
- **No boolean flag parameters.** `createUser(data, true)` is unreadable. Split into `createUser` and `createAdminUser`, or use a named options object.

---

## 4. TypeScript

- **Strict mode, no exceptions.** `strict: true`, plus `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedIndexedAccess`.
- **`any` is banned.** Lint rule is `error`. Escape hatch: `unknown`, then narrow with a type guard or Zod.
- **Prefer type inference for locals, explicit types for public surface.** Exported functions, components, and hooks get explicit return types. Locals let TS infer.
- **`import type { X }` for type-only imports.** Required by `isolatedModules` and keeps the JS bundle lean.
- **Derive types from Zod, do not hand-write DTOs.**

  ```ts
  // packages/shared/src/schemas/auth.ts
  export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  });
  export type LoginInput = z.infer<typeof loginSchema>;
  ```

  Both the frontend form and the backend route use `loginSchema`. One source of truth, zero drift.

- **Prefer `type` over `interface`** unless you need declaration merging (rare). `interface` for React component props is fine for consistency with common examples.
- **No enums.** Use `as const` unions: `const STATUS = ['WAITING', 'IN_GAME', 'FINISHED'] as const; type Status = typeof STATUS[number];`. Prisma-generated enums are fine.

---

## 5. Feature Folders

The backend is organized by feature, not by layer. Each feature folder is a self-contained vertical slice.

```
features/
└── rooms/
    ├── rooms.routes.ts        # Express router
    ├── rooms.controller.ts    # parse + call service + respond
    ├── rooms.service.ts       # business rules (pure where possible)
    ├── rooms.repository.ts    # ALL Prisma calls for this feature
    ├── rooms.schemas.ts       # Zod schemas (re-exported from shared)
    ├── rooms.sockets.ts       # socket handlers (if any)
    └── rooms.test.ts          # integration test
```

**Rules:**

- **Features do not import from other features.** If `games` needs data from `users`, go through a shared contract in `packages/shared` or a well-defined service method — never reach into another feature's repository.
- **`shared/` is not a dumping ground.** Only truly cross-cutting code belongs there (db client, middleware, error classes, logger, socket bootstrap).
- **When a feature grows past ~6 files,** split internally (e.g., `rooms/join.service.ts`, `rooms/create.service.ts`) before splitting the feature itself.
- **Frontend mirrors the same idea**:
  ```
  features/game/
  ├── components/   # GameBoard, StatusBar
  ├── hooks/        # useGameSocket
  ├── api/          # TanStack Query hooks for REST
  ├── store.ts      # Zustand slice, if any
  ├── schemas.ts    # imports from @tacfinity/shared
  └── index.ts      # public API of the feature
  ```

---

## 6. Error Handling

- **Never `catch (e) {}` with an empty body.** If you truly don't care, at minimum log and comment why.
- **Never catch what you can't handle.** Let it propagate to the global handler.
- **Custom error classes live in `apps/api/src/shared/errors/`:**

  ```ts
  export class AppError extends Error {
    constructor(
      public code: ErrorCode,
      public status: number,
      message: string,
      public details?: unknown
    ) {
      super(message);
    }
  }
  export class NotFoundError extends AppError {
    constructor(resource: string, id: string) {
      super('NOT_FOUND', 404, `${resource} ${id} not found`);
    }
  }
  ```

- **One global error middleware** in `shared/middleware/error.ts` formats every `AppError` into the standard response envelope. Unknown errors → log at `error` level, respond with `INTERNAL`.
- **Controllers use `asyncHandler`** (a tiny wrapper) so thrown errors reach the middleware. No try/catch in controllers.
- **Frontend mirrors by error code**, not by HTTP status or message string. `if (err.code === 'UNAUTHORIZED') redirectToLogin()`.

---

## 7. Logging

- **Structured JSON only.** `pino` is the logger. Configured once in `shared/lib/logger.ts`.
- **Every request gets a `request_id`.** Middleware generates a UUID; every log line within that request includes it.
- **Log levels**: `debug` (developer only, off in prod), `info` (business events: user_registered, game_ended), `warn` (recoverable issues), `error` (unhandled / 5xx).
- **Never log:** passwords, tokens (access or refresh), full email bodies, TGN move strings of ongoing games (spoils replays).
- **Do log:** user_id (not email), request path, latency, error codes.
- **No `console.log` in committed code.** Lint rule enforces.

---

## 8. Async

- **Always `async/await`.** No `.then().catch()` chains except at top-level event-handler boundaries where you cannot make the caller async.
- **No floating promises.** Lint rule `@typescript-eslint/no-floating-promises: error`. If you want fire-and-forget, explicitly `void myPromise()` and leave a comment saying why.
- **Timeouts everywhere that hits a network.** Every outbound HTTP call has an `AbortController` with a timeout. DB queries inherit Prisma's default.
- **`Promise.all` for parallelism**, but only if operations are truly independent. Don't parallelize things that mutate the same row.

---

## 9. React Specifics

- **Function components only.** No class components anywhere.
- **Hooks:**
  - Extract logic into custom hooks when it is shared across two components _or_ when a component has three+ effects.
  - `useEffect` is a last resort. Most "on mount" work belongs in an event handler, an initializer, or a `useQuery`.
  - Follow the dependency array exactly. Suppressing the lint warning is a code smell that requires a PR-level justification.
- **Server state belongs in TanStack Query.** Anything fetched from the API: `useQuery`/`useMutation`. Do not stash server state in Zustand or Context.
- **Client state belongs in Zustand (when shared) or `useState` (when local).**
- **No prop drilling past two levels.** If a prop threads through three or more components untouched, lift it to a context or a Zustand slice.
- **Components are small.** If a `.tsx` file passes ~200 lines, split the component or extract hooks.
- **Accessibility is not optional.** Every interactive element gets a role/label. Every image gets alt text. Color alone never conveys meaning (required for Lighthouse ≥90).

---

## 10. Backend Specifics

- **Controllers are thin.** The body looks like: parse input → call service → respond.

  ```ts
  export const createRoom = asyncHandler(async (req, res) => {
    const input = createRoomSchema.parse(req.body);
    const room = await roomsService.create(input, req.user.id);
    res.status(201).json({ data: room });
  });
  ```

- **Services own business rules.** Pure where possible; they take plain inputs and return plain outputs. No `req`/`res` in services.
- **Repositories own Prisma.** No `prisma.*` call exists outside a repository file. If a service needs data, it calls `roomsRepository.findByCode(code)`.
- **No Prisma imports in services or controllers.** Lint rule enforces via `no-restricted-imports`.
- **Sockets follow the same shape.** Socket handler = controller; calls a service; service is identical whether invoked from HTTP or socket.
- **Never trust the client for game state.** Client sends intent (`{ row, col }`); server decides outcome. This is non-negotiable.

---

## 11. Security Hygiene

- **Every endpoint validates input with Zod.** No endpoint accepts `req.body` without parsing. Validation happens first, before any DB call.
- **Rate-limit auth endpoints.** `/auth/login`, `/auth/register`, `/auth/refresh` all have stricter limits than generic endpoints.
- **Helmet is on** with sensible defaults. CORS is a strict allowlist, no wildcards in production.
- **Passwords:** bcrypt with cost factor ≥12. Never stored, logged, or sent in any response.
- **Tokens:** httpOnly + SameSite=Strict cookies. Access 15 min, refresh 7 days with rotation (every refresh invalidates the old refresh token and issues a new one).
- **CSRF:** SameSite=Strict covers the common case. Still add an anti-CSRF token on state-changing requests from the browser if we ever allow SameSite=Lax.
- **Never interpolate user input into SQL.** Prisma prevents this by default, but raw queries must use parameterized placeholders.
- **Environment:** never commit `.env`; `.env.example` documents every variable; `config/env.ts` parses `process.env` with Zod at boot and fails fast on missing vars.

---

## 12. Git Hygiene

- **Conventional Commits.** `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`. Enforced by commitlint.
- **Small PRs.** Target ≤400 lines changed. Big refactors land as a stack of small PRs, not one megadiff.
- **No direct pushes to `main`.** PRs only, with at least one review.
- **Every PR links to a task** (GitHub issue or the project board).
- **PR titles follow commit conventions.** The merge commit inherits them.
- **PR description template:** What, Why, How to test, Screenshots (for UI).
- **Rebase, don't merge, for updating a feature branch off main.** Keeps history linear.

---

## 13. Testing Norms

- **Pure logic → unit test (Vitest).** Every exported function in `packages/shared` has a test. No exceptions for AI, TGN, ELO, WinDetector.
- **HTTP routes → integration test (Supertest + real DB).** See `api-patterns.md` for the canonical template.
- **User flows → E2E (Playwright).** One test per critical flow: register → login, play offline, play online, reconnect mid-game.
- **No mocks of the database.** Use Testcontainers Postgres or a test DB with TRUNCATE between tests.
- **No mocks of your own code.** Mocks of your own modules are a smell — write the code to be testable instead. External boundaries (Stripe, email provider) can be faked; internal services cannot.
- **One logical assertion per test.** Multiple `expect`s are fine; testing two unrelated behaviors in one test is not.
- **Test names describe behavior, not implementation.**

  ```ts
  // bad
  it('calls roomsRepository.create', ...)
  // good
  it('creates a room with a unique 6-char code', ...)
  ```

- **Coverage is not a goal.** 100% coverage of garbage is still garbage. Cover the branches that matter.

---

## Enforcement

These rules are enforced in three places:

1. **ESLint + Prettier** run on every save via editor integration and on every PR via CI.
2. **Husky + lint-staged** block commits that would fail CI.
3. **PR review.** Reviewers cite the section number when requesting changes (`§6 — catch block has no handling`). This makes feedback fast and impersonal.

When a rule is wrong, fix this document — do not silently work around it.
