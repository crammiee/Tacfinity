# API Patterns

This document is the contract for every HTTP endpoint and socket event in Tacfinity. Its main purpose is consistency — so that any new feature, any test, and any reviewer (human or an AI agent) has exactly one pattern to follow.

**It also serves as the testing scaffold.** When an AI agent adds a new endpoint, it should copy the canonical test template in §12 verbatim and adapt it. You should not have to re-explain the test shape each time.

---

## 1. URL Conventions

- All endpoints are prefixed with `/api/v1/`. The version bump happens only on breaking changes.
- Resources are **plural nouns**: `/users`, `/rooms`, `/games`, `/leaderboard` (leaderboard is a singleton noun — fine).
- **Path segments are `camelCase`** when multi-word: `/api/v1/rooms/:code/roomPlayers`. (There is no kebab-case in this project, anywhere.)
- IDs in paths are **cuid strings**, not integers. Example: `/api/v1/games/clx0a2b3c4d5e6f7g8h9i0j`.
- Nested resources go one level deep, maximum: `/rooms/:code/players` is fine; `/rooms/:code/players/:id/scores` is not — flatten it.

---

## 2. HTTP Verbs

| Verb     | Use                                                    |
| -------- | ------------------------------------------------------ |
| `GET`    | Read. Never mutates. Safe to retry.                    |
| `POST`   | Create a resource, or an action that doesn't fit REST. |
| `PATCH`  | Partial update.                                        |
| `PUT`    | Full replacement. Rare — most updates are partial.     |
| `DELETE` | Remove a resource.                                     |

- **No verbs in URLs.** Bad: `POST /api/v1/games/forfeitGame`. Good: `POST /api/v1/games/:id/forfeit` (sub-resource action) _or_ `PATCH /api/v1/games/:id` with `{ status: 'FORFEITED' }` in the body. Prefer the PATCH when it's a state transition.
- **Status codes align with intent.** 200 for successful reads, 201 for created resources, 204 for deletes with no body, 400 for validation, 401 for missing/invalid auth, 403 for authenticated-but-forbidden, 404 for not found, 409 for conflict (e.g. duplicate room code), 429 for rate limit, 500 for server bugs.

---

## 3. Response Envelope

**Every** response uses one of two shapes. Status code and envelope always agree.

**Success:**

```json
{ "data": <T> }
```

**Error:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "email must be a valid address",
    "details": { "field": "email" }
  }
}
```

- `data` is never `null` on a 2xx response. If there's no payload (e.g. a 204), the body is empty, not `{ "data": null }`.
- `error.details` is optional and can be any shape — Zod issues, an array of conflicting IDs, etc.
- **No top-level fields other than `data` or `error`.** No `success: true`, no `status: 'ok'`. The HTTP status code is authoritative.

A helper lives in `apps/api/src/shared/utils/respond.ts`:

```ts
export const ok = <T>(res: Response, data: T, status = 200) => res.status(status).json({ data });
```

---

## 4. Error Codes

Enumerated, stable strings. Client code pattern-matches on these, never on messages.

| Code               | HTTP | Meaning                                                            |
| ------------------ | ---- | ------------------------------------------------------------------ |
| `VALIDATION_ERROR` | 400  | Zod parse failed. `details` is the issue list.                     |
| `UNAUTHORIZED`     | 401  | No auth or expired/invalid token.                                  |
| `FORBIDDEN`        | 403  | Authenticated but not allowed.                                     |
| `NOT_FOUND`        | 404  | Resource does not exist.                                           |
| `CONFLICT`         | 409  | Duplicate or state conflict (room code collision, already joined). |
| `RATE_LIMITED`     | 429  | Too many requests. `details.retryAfter` in seconds.                |
| `INTERNAL`         | 500  | Unexpected. Never contains stack traces in the response.           |

One `AppError` subclass per code lives in `apps/api/src/shared/errors/`. The global error middleware maps the thrown error → envelope + status.

---

## 5. Validation

- **Every endpoint starts with a Zod parse.** `req.body`, `req.query`, `req.params` — all validated. Unvalidated input is a bug.
- Schemas live in `features/<name>/<name>.schemas.ts`, **and** are re-exported from `packages/shared/src/schemas/` for client reuse.

  ```ts
  // packages/shared/src/schemas/rooms.ts
  export const createRoomSchema = z.object({
    boardSize: z.number().int().min(3).max(20),
    winCondition: z.number().int().min(3),
    type: z.enum(['CASUAL', 'RANKED']),
  });
  export type CreateRoomInput = z.infer<typeof createRoomSchema>;
  ```

- A middleware `validate(schema, 'body' | 'query' | 'params')` factors out the parse for brevity; the thrown `ZodError` is caught by the global handler and translated to `VALIDATION_ERROR`.

---

## 6. Auth

- **Protected routes** use the `requireAuth` middleware. It reads the access-token cookie, verifies the JWT, looks up the user, and attaches `req.user`.
- **Public routes** explicitly opt out by _not_ importing `requireAuth`. There is no "public by default" — every new router file starts with `router.use(requireAuth)` and relaxes individual routes by using a separate public router. This prevents accidentally-public endpoints.
- **Authorization (who-can-do-what)** happens in the service, not in middleware. Example: `roomsService.join()` verifies the caller is not already in another room — it does not assume the controller checked.
- **Socket auth** uses the same cookie. Socket.io middleware parses the cookie from the handshake and attaches `socket.data.user`. Same JWT, same user.

---

## 7. Pagination

Cursor-based, never offset-based.

**Request:**

```
GET /api/v1/leaderboard?cursor=clx0abc&limit=20
```

**Response:**

```json
{
  "data": {
    "items": [...],
    "nextCursor": "clx0xyz"
  }
}
```

- `limit` defaults to 20, max 100.
- `nextCursor` is `null` when there are no more pages.
- Sort order is server-determined and stable. Client cannot choose sort unless the endpoint explicitly documents `?sort=`.

---

## 8. Idempotency

POSTs that could be retried by network flakiness (matchmaking queue entry, move submission) accept an optional `Idempotency-Key` header. The server deduplicates for 24 hours based on `(userId, idempotencyKey)`.

This is critical for `game:move` submissions over socket — but sockets handle it differently (see §9).

---

## 9. Socket Events

Socket.io events follow the same contract as REST.

- **Typed contracts** in `packages/shared/src/sockets.ts`:

  ```ts
  export interface ClientToServerEvents {
    'queue:join': (payload: QueueJoinPayload, ack: AckFn<QueueJoinResult>) => void;
    'game:move': (payload: GameMovePayload, ack: AckFn<void>) => void;
    'room:join': (payload: RoomJoinPayload, ack: AckFn<RoomJoinResult>) => void;
  }
  export interface ServerToClientEvents {
    'game:update': (payload: GameUpdatePayload) => void;
    'game:end': (payload: GameEndPayload) => void;
    'game:sync': (payload: GameSyncPayload) => void;
    'queue:matched': (payload: QueueMatchedPayload) => void;
  }
  ```

  Both client and server import these types. No payload shape drift.

- **Payloads are validated with Zod** inside every handler — the same as an HTTP controller.
- **Acks for request/response events.** `queue:join`, `room:join`, `game:move` all accept a third-arg ack callback that returns `{ ok: true, data }` or `{ ok: false, error }` — symmetric with REST envelopes.
- **Broadcasts are fire-and-forget.** `game:update` has no ack; clients reconcile state on reconnect via `game:sync`.
- **Naming**: `<resource>:<verb>`. Never `gameMove`, always `game:move`.

---

## 10. Testing Fixtures

Every integration test uses a shared fixtures API. **Tests do not insert rows manually.**

```ts
// apps/api/tests/fixtures/index.ts
export async function makeUser(overrides?: Partial<User>): Promise<User> { ... }
export async function makeRoom(host: User, overrides?: Partial<Room>): Promise<Room> { ... }
export async function makeGame(room: Room, players: [User, User]): Promise<Game> { ... }

/** Returns a Supertest agent with a valid auth cookie for the given user. */
export async function authedClient(user: User): Promise<TestAgent> { ... }
```

**Rules:**

- Fixtures generate realistic random data by default. Tests only pass `overrides` for the fields that matter to the test.
- If a test needs a helper that doesn't exist yet, add it to fixtures — do not copy-paste raw Prisma calls into tests.
- Fixtures are the only place `prisma.*.create(...)` is allowed outside `repositories/`.

---

## 11. Test Database Strategy

- **Testcontainers Postgres**, one container per Vitest worker.
- Each test starts with a clean DB via `TRUNCATE TABLE … RESTART IDENTITY CASCADE` in `beforeEach`.
- Migrations run once on container startup (`prisma migrate deploy`).
- **No DB mocks.** Prisma is real; SQL is real; the only difference from production is the host.
- Environment: `DATABASE_URL` for tests is injected by the Testcontainers setup file (`apps/api/tests/setup.ts`), not from `.env`.

---

## 12. Canonical Test Template

**Every HTTP integration test follows this shape.** Copy-paste and adapt.

```ts
// apps/api/src/features/rooms/rooms.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { resetDb } from '../../../tests/helpers/reset-db';
import { makeUser, authedClient } from '../../../tests/fixtures';

describe('POST /api/v1/rooms', () => {
  beforeEach(resetDb);

  it('creates a room and returns 201 with the room in the data envelope', async () => {
    // Arrange
    const host = await makeUser();
    const client = await authedClient(host);

    // Act
    const res = await client
      .post('/api/v1/rooms')
      .send({ boardSize: 5, winCondition: 4, type: 'CASUAL' });

    // Assert — response
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      data: {
        code: expect.stringMatching(/^[A-Z0-9]{6}$/),
        hostId: host.id,
        boardSize: 5,
        winCondition: 4,
        type: 'CASUAL',
        status: 'WAITING',
      },
    });

    // Assert — DB side-effect
    const row = await prisma.room.findUnique({ where: { code: res.body.data.code } });
    expect(row).not.toBeNull();
    expect(row!.hostId).toBe(host.id);
  });

  it('returns 400 VALIDATION_ERROR when boardSize is below 3', async () => {
    const host = await makeUser();
    const client = await authedClient(host);

    const res = await client
      .post('/api/v1/rooms')
      .send({ boardSize: 2, winCondition: 3, type: 'CASUAL' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toContainEqual(expect.objectContaining({ path: ['boardSize'] }));
  });

  it('returns 401 UNAUTHORIZED when no auth cookie is present', async () => {
    const res = await request(app)
      .post('/api/v1/rooms')
      .send({ boardSize: 5, winCondition: 4, type: 'CASUAL' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});
```

**Anatomy:**

- One `describe` per endpoint (`METHOD /path`).
- `beforeEach(resetDb)` is always first.
- **Arrange / Act / Assert**, separated by blank lines and comments. Every test.
- Assert **response** (status + body shape via `toMatchObject`) and assert **DB side-effect** (Prisma read) when the endpoint mutates.
- Error tests assert both HTTP status **and** `error.code`. Never assert on `error.message` — messages are for humans and will be reworded.
- Use `authedClient(user)` for protected routes; use the raw `request(app)` supertest for testing unauth paths.

Socket tests follow the same Arrange/Act/Assert shape, with a `makeSocketClient(user)` fixture that returns a connected, authed socket and a promise helper `waitForEvent(socket, 'game:update')`.

---

## 13. REST Endpoint Catalog

This table is the source of truth. **When you add or change an endpoint, you update this table in the same PR.** CI runs a grep check: every router handler must have a matching row.

| Method | Path                    | Auth           | Body schema                  | Response                               | Rate limit  |
| ------ | ----------------------- | -------------- | ---------------------------- | -------------------------------------- | ----------- |
| POST   | `/api/v1/auth/register` | —              | `registerSchema`             | `{ data: { user } }`                   | 5/min/ip    |
| POST   | `/api/v1/auth/login`    | —              | `loginSchema`                | `{ data: { user } }` (sets cookies)    | 10/min/ip   |
| POST   | `/api/v1/auth/refresh`  | refresh cookie | —                            | `{ data: { user } }` (rotates cookies) | 30/min/ip   |
| POST   | `/api/v1/auth/logout`   | access cookie  | —                            | 204                                    | —           |
| GET    | `/api/v1/users/me`      | access         | —                            | `{ data: { user } }`                   | —           |
| GET    | `/api/v1/users/:id`     | access         | —                            | `{ data: { user } }`                   | —           |
| POST   | `/api/v1/rooms`         | access         | `createRoomSchema`           | `{ data: { room } }`                   | 20/min/user |
| GET    | `/api/v1/rooms/:code`   | access         | —                            | `{ data: { room } }`                   | —           |
| GET    | `/api/v1/games/:id`     | access         | —                            | `{ data: { game } }`                   | —           |
| GET    | `/api/v1/leaderboard`   | —              | query: `{ cursor?, limit? }` | `{ data: { items, nextCursor } }`      | 60/min/ip   |

(Updated as endpoints are added. Anything live must appear here.)

---

## 14. Socket Event Catalog

All payload types are defined in `packages/shared/src/sockets.ts`. Import from there — never define payload shapes locally in either app.

| Event           | Direction | Payload                                                                                      | Auth     |
| --------------- | --------- | -------------------------------------------------------------------------------------------- | -------- |
| `queue:join`    | C→S       | —                                                                                            | required |
| `queue:matched` | S→C       | `MatchedPayload` (`gameId, yourSymbol, yourRating, opponentUsername, opponentRating`)        | —        |
| `game:move`     | C→S       | `{ gameId: string; row: number; col: number }`                                               | required |
| `game:update`   | S→C       | `GameUpdatePayload` (`gameId, tgnToken, nextPlayer: 'X'\|'O'`)                               | —        |
| `game:end`      | S→C       | `GameEndPayload` (`gameId, winner: 'X'\|'O'\|'draw', ratingDelta: { X: number; O: number }`) | —        |

Same rule as REST: this table is kept in sync with handlers in the same PR.

---

## Enforcement

- **CI runs a script** (`scripts/check-api-catalog.ts`) that parses Express routers and compares them to §13. Mismatch = CI fails.
- A similar script does the same for socket handlers vs §14.
- PR template has a checkbox: "I updated `api-patterns.md`" — required when the diff touches any router or socket handler.

When a convention here is wrong, **update this document first, then update the code.** The doc leads; the code follows.
