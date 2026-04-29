/**
 * Smoke test for Canete's Phase 1 foundation work.
 *
 * Tests (no server required):
 *   1. Zod auth schemas   — registerSchema, loginSchema
 *   2. AppError classes   — correct code + statusCode per subclass
 *   3. asyncHandler       — forwards thrown errors to next()
 *   4. respond util       — ok() wraps data in { data } envelope
 *
 * Run: pnpm --filter @tacfinity/api tsx scripts/test-foundation.ts
 */

import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../src/shared/errors/AppError.js';
import { asyncHandler } from '../src/shared/middleware/asyncHandler.js';
import { ok } from '../src/shared/utils/respond.js';
import { loginSchema, registerSchema } from '@tacfinity/shared';
import type { NextFunction, Request, Response } from 'express';

// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function check(label: string, result: boolean): void {
  if (result) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
}

function section(title: string): void {
  console.log(`\n=== ${title} ===`);
}

// ---------------------------------------------------------------------------
section('1. registerSchema');

const validRegister = registerSchema.safeParse({
  username: 'canete',
  email: 'x@example.com',
  password: 'password123',
});
check('accepts valid input', validRegister.success);

check(
  'rejects username shorter than 3 chars',
  !registerSchema.safeParse({ username: 'ab', email: 'x@example.com', password: 'password123' })
    .success
);

check(
  'rejects username longer than 20 chars',
  !registerSchema.safeParse({
    username: 'a'.repeat(21),
    email: 'x@example.com',
    password: 'password123',
  }).success
);

check(
  'rejects invalid email',
  !registerSchema.safeParse({ username: 'canete', email: 'not-an-email', password: 'password123' })
    .success
);

check(
  'rejects password shorter than 8 chars',
  !registerSchema.safeParse({ username: 'canete', email: 'x@example.com', password: 'short' })
    .success
);

check('rejects missing fields', !registerSchema.safeParse({}).success);

// ---------------------------------------------------------------------------
section('2. loginSchema');

check(
  'accepts valid credentials',
  loginSchema.safeParse({ email: 'x@example.com', password: 'anypassword' }).success
);

check(
  'rejects invalid email',
  !loginSchema.safeParse({ email: 'bad', password: 'anypassword' }).success
);

check('rejects missing password', !loginSchema.safeParse({ email: 'x@example.com' }).success);

// ---------------------------------------------------------------------------
section('3. AppError subclasses');

const cases: [AppError, string, number][] = [
  [new UnauthorizedError(), 'UNAUTHORIZED', 401],
  [new ForbiddenError(), 'FORBIDDEN', 403],
  [new NotFoundError('User'), 'NOT_FOUND', 404],
  [new ConflictError('Already exists'), 'CONFLICT', 409],
  [new ValidationError('Bad input'), 'VALIDATION_ERROR', 400],
];

for (const [err, code, status] of cases) {
  check(`${err.constructor.name} has code ${code}`, err.code === code);
  check(`${err.constructor.name} has statusCode ${status}`, err.statusCode === status);
  check(`${err.constructor.name} is instanceof AppError`, err instanceof AppError);
}

check(
  'NotFoundError message includes resource name',
  new NotFoundError('Room').message === 'Room not found'
);

check(
  'NotFoundError message includes id when provided',
  new NotFoundError('Room', 'abc123').message === 'Room abc123 not found'
);

// ---------------------------------------------------------------------------
section('4. asyncHandler');

const mockReq = {} as Request;
const mockRes = {} as Response;

// error path: next() should receive the thrown error
await new Promise<void>((resolve) => {
  const err = new UnauthorizedError('test error');
  const handler = asyncHandler(async () => {
    throw err;
  });
  const next: NextFunction = (receivedErr) => {
    check('forwards thrown error to next()', receivedErr === err);
    resolve();
  };
  handler(mockReq, mockRes, next);
});

// happy path: next() should NOT be called
await new Promise<void>((resolve) => {
  let nextCalled = false;
  const handler = asyncHandler(async (_req, res) => {
    (res as unknown as { ended: boolean }).ended = true;
  });
  const next: NextFunction = () => {
    nextCalled = true;
  };
  const res = { ended: false } as unknown as Response;
  handler(mockReq, res, next);
  setTimeout(() => {
    check('does not call next() on success', !nextCalled);
    resolve();
  }, 10);
});

// ---------------------------------------------------------------------------
section('5. respond util — ok()');

let capturedStatus: number | undefined;
let capturedBody: unknown;

const fakeRes = {
  status(code: number) {
    capturedStatus = code;
    return this;
  },
  json(body: unknown) {
    capturedBody = body;
  },
} as unknown as Response;

ok(fakeRes, { id: '123', username: 'canete' });
check('sets status 200 by default', capturedStatus === 200);
check(
  'wraps payload in { data }',
  JSON.stringify(capturedBody) === JSON.stringify({ data: { id: '123', username: 'canete' } })
);

ok(fakeRes, 'created', 201);
check('accepts custom status code', capturedStatus === 201);

// ---------------------------------------------------------------------------
console.log(`\n=== Done — ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
