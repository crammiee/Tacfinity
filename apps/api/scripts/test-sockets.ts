/// <reference types="node" />
/**
 * Socket smoke test — requires a running API server.
 *
 * Run:
 *   pnpm --filter @tacfinity/api dev
 *   pnpm --filter @tacfinity/api test:sockets
 */

import { io, type Socket } from 'socket.io-client';

const HTTP_BASE = 'http://localhost:3001';
const AUTH_BASE = `${HTTP_BASE}/api/v1/auth`;

type QueueMatchedPayload = {
  gameId: string;
  yourSymbol: 'X' | 'O';
  yourRating: number;
  opponentUsername: string;
  opponentRating: number;
};

type GameUpdatePayload = {
  gameId: string;
  tgnToken: string;
  nextPlayer: 'X' | 'O';
};

type GameEndPayload = {
  gameId: string;
  winner: 'X' | 'O' | 'draw';
  ratingDelta: { X: number; O: number };
};

type GameErrorPayload = {
  error: {
    code: string;
    message: string;
  };
};

let passed = 0;
let failed = 0;

function section(title: string): void {
  console.log(`\n=== ${title} ===`);
}

function check(label: string, result: boolean): void {
  if (result) {
    console.log(`  ✓ ${label}`);
    passed++;
    return;
  }
  console.error(`  ✗ ${label}`);
  failed++;
}

function waitForEvent<T>(socket: Socket, event: string, timeoutMs = 5000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, onEvent);
      reject(new Error(`Timeout waiting for "${event}"`));
    }, timeoutMs);

    const onEvent = (payload: T) => {
      clearTimeout(timer);
      socket.off(event, onEvent);
      resolve(payload);
    };

    socket.on(event, onEvent);
  });
}

async function postAuth(path: '/register' | '/login', body: unknown): Promise<Response> {
  return fetch(`${AUTH_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function extractCookie(setCookie: string[], name: string): string | null {
  for (const header of setCookie) {
    const match = header.match(new RegExp(`^${name}=([^;]+)`));
    if (match) return `${name}=${match[1]}`;
  }
  return null;
}

async function makeAuthedSocket(
  usernamePrefix: string
): Promise<{ socket: Socket; username: string }> {
  const now = Date.now();
  const username = `${usernamePrefix}_${now}`;
  const email = `${username}@example.com`;
  const password = 'Password123!';

  const registerRes = await postAuth('/register', { username, email, password });
  if (registerRes.status !== 201) {
    throw new Error(`Register failed for ${username} with status ${registerRes.status}`);
  }

  const loginRes = await postAuth('/login', { email, password });
  if (loginRes.status !== 200) {
    throw new Error(`Login failed for ${username} with status ${loginRes.status}`);
  }

  const setCookies = loginRes.headers.getSetCookie?.() ?? [];
  const accessCookie = extractCookie(setCookies, 'access_token');
  if (!accessCookie) {
    throw new Error(`No access_token cookie found for ${username}`);
  }

  const socket = io(HTTP_BASE, {
    autoConnect: false,
    withCredentials: true,
    transportOptions: {
      polling: { extraHeaders: { Cookie: accessCookie } },
      websocket: { extraHeaders: { Cookie: accessCookie } },
    },
  });

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Connect timeout for ${username}`)), 5000);
    socket.once('connect', () => {
      clearTimeout(timeout);
      resolve();
    });
    socket.once('connect_error', (err: Error) => {
      clearTimeout(timeout);
      reject(err);
    });
    socket.connect();
  });

  return { socket, username };
}

async function main(): Promise<void> {
  section('1. Matchmaking');

  const a = await makeAuthedSocket('socka');
  const b = await makeAuthedSocket('sockb');

  const matchedAPromise = waitForEvent<QueueMatchedPayload>(a.socket, 'queue:matched');
  const matchedBPromise = waitForEvent<QueueMatchedPayload>(b.socket, 'queue:matched');

  a.socket.emit('queue:join');
  b.socket.emit('queue:join');

  const matchedA = await matchedAPromise;
  const matchedB = await matchedBPromise;

  check('both clients received queue:matched', !!matchedA.gameId && !!matchedB.gameId);
  check('both clients matched to same gameId', matchedA.gameId === matchedB.gameId);
  check('symbols are X and O', matchedA.yourSymbol !== matchedB.yourSymbol);
  check('opponent username is wired for A', matchedA.opponentUsername === b.username);
  check('opponent username is wired for B', matchedB.opponentUsername === a.username);

  const gameId = matchedA.gameId;
  const x = matchedA.yourSymbol === 'X' ? a.socket : b.socket;
  const o = matchedA.yourSymbol === 'O' ? a.socket : b.socket;

  section('2. Gameplay updates');

  const update1X = waitForEvent<GameUpdatePayload>(x, 'game:update');
  const update1O = waitForEvent<GameUpdatePayload>(o, 'game:update');
  x.emit('game:move', { gameId, row: 0, col: 0 });
  const u1x = await update1X;
  const u1o = await update1O;
  check('first move broadcasts X:0,0 to X', u1x.tgnToken === 'X:0,0');
  check('first move broadcasts X:0,0 to O', u1o.tgnToken === 'X:0,0');
  check('nextPlayer after first move is O', u1x.nextPlayer === 'O' && u1o.nextPlayer === 'O');

  const update2X = waitForEvent<GameUpdatePayload>(x, 'game:update');
  const update2O = waitForEvent<GameUpdatePayload>(o, 'game:update');
  o.emit('game:move', { gameId, row: 1, col: 1 });
  const u2x = await update2X;
  const u2o = await update2O;
  check('second move broadcasts O:1,1 to X', u2x.tgnToken === 'O:1,1');
  check('second move broadcasts O:1,1 to O', u2o.tgnToken === 'O:1,1');
  check('nextPlayer after second move is X', u2x.nextPlayer === 'X' && u2o.nextPlayer === 'X');

  section('3. Validation errors');

  const occupiedCellErr = waitForEvent<GameErrorPayload>(x, 'game:error');
  x.emit('game:move', { gameId, row: 0, col: 0 });
  const occupiedErrorPayload = await occupiedCellErr;
  check(
    'occupied cell emits VALIDATION_ERROR to sender',
    occupiedErrorPayload.error.code === 'VALIDATION_ERROR'
  );

  const wrongTurnErr = waitForEvent<GameErrorPayload>(o, 'game:error');
  o.emit('game:move', { gameId, row: 2, col: 2 });
  const wrongTurnErrorPayload = await wrongTurnErr;
  check(
    'wrong turn emits VALIDATION_ERROR to sender',
    wrongTurnErrorPayload.error.code === 'VALIDATION_ERROR'
  );

  section('4. Game end');

  // Existing board:
  // X:0,0 ; O:1,1
  // We want X to win row 0 with cols 0-4.
  const endX = waitForEvent<GameEndPayload>(x, 'game:end', 8000);
  const endO = waitForEvent<GameEndPayload>(o, 'game:end', 8000);

  // 3rd move (X)
  const u3x = waitForEvent<GameUpdatePayload>(x, 'game:update');
  const u3o = waitForEvent<GameUpdatePayload>(o, 'game:update');
  x.emit('game:move', { gameId, row: 0, col: 1 });
  await Promise.all([u3x, u3o]);

  // 4th move (O)
  const u4x = waitForEvent<GameUpdatePayload>(x, 'game:update');
  const u4o = waitForEvent<GameUpdatePayload>(o, 'game:update');
  o.emit('game:move', { gameId, row: 1, col: 2 });
  await Promise.all([u4x, u4o]);

  // 5th move (X)
  const u5x = waitForEvent<GameUpdatePayload>(x, 'game:update');
  const u5o = waitForEvent<GameUpdatePayload>(o, 'game:update');
  x.emit('game:move', { gameId, row: 0, col: 2 });
  await Promise.all([u5x, u5o]);

  // 6th move (O)
  const u6x = waitForEvent<GameUpdatePayload>(x, 'game:update');
  const u6o = waitForEvent<GameUpdatePayload>(o, 'game:update');
  o.emit('game:move', { gameId, row: 1, col: 3 });
  await Promise.all([u6x, u6o]);

  // 7th move (X)
  const u7x = waitForEvent<GameUpdatePayload>(x, 'game:update');
  const u7o = waitForEvent<GameUpdatePayload>(o, 'game:update');
  x.emit('game:move', { gameId, row: 0, col: 3 });
  await Promise.all([u7x, u7o]);

  // 8th move (O)
  const u8x = waitForEvent<GameUpdatePayload>(x, 'game:update');
  const u8o = waitForEvent<GameUpdatePayload>(o, 'game:update');
  o.emit('game:move', { gameId, row: 1, col: 4 });
  await Promise.all([u8x, u8o]);

  // 9th move (X) -> should end
  x.emit('game:move', { gameId, row: 0, col: 4 });
  const [endPayloadX, endPayloadO] = await Promise.all([endX, endO]);

  check('both clients received game:end for same game', endPayloadX.gameId === endPayloadO.gameId);
  check('winner is X', endPayloadX.winner === 'X' && endPayloadO.winner === 'X');
  check(
    'rating deltas have opposite signs',
    endPayloadX.ratingDelta.X > 0 && endPayloadX.ratingDelta.O < 0
  );

  a.socket.disconnect();
  b.socket.disconnect();

  console.log(`\n=== Done — ${passed} passed, ${failed} failed ===\n`);
  if (failed > 0) process.exit(1);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`\nSmoke test failed: ${message}\n`);
  process.exit(1);
});
