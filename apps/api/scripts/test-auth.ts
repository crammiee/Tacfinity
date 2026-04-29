/// <reference types="node" />
/**
 * Auth API smoke test — requires a running server.
 *
 * Run:
 *   pnpm --filter @tacfinity/api dev          (terminal 1)
 *   pnpm --filter @tacfinity/api test:auth    (terminal 2)
 */

const BASE = 'http://localhost:3001/api/v1/auth';

const TEST_USER = {
  username: 'smoketest',
  email: `smoketest_${Date.now()}@example.com`,
  password: 'Password123!',
};

let passed = 0;
let failed = 0;
let cookieJar = '';

function get(obj: unknown, ...keys: string[]): unknown {
  let cur = obj;
  for (const key of keys) {
    if (typeof cur !== 'object' || cur === null) return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

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

async function post(path: string, body?: unknown, cookies?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (cookies) headers['Cookie'] = cookies;

  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const setCookies = res.headers.getSetCookie?.() ?? [];
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }

  return { status: res.status, json, setCookies };
}

function extractCookie(setCookies: string[], name: string): string | null {
  for (const header of setCookies) {
    const match = header.match(new RegExp(`^${name}=([^;]+)`));
    if (match) return `${name}=${match[1]}`;
  }
  return null;
}

function isCookieCleared(setCookies: string[], name: string): boolean {
  for (const header of setCookies) {
    if (!header.startsWith(`${name}=`)) continue;
    const maxAgeMatch = header.match(/Max-Age=(\d+)/i);
    if (maxAgeMatch && Number(maxAgeMatch[1]) === 0) return true;
    const expiresMatch = header.match(/Expires=([^;]+)/i);
    if (expiresMatch && new Date(expiresMatch[1]).getTime() <= Date.now()) return true;
  }
  return false;
}

async function main() {
  // -------------------------------------------------------------------------
  section('1. Register');

  const reg1 = await post('/register', TEST_USER);
  check('201 on valid registration', reg1.status === 201);
  check('returns data.user.id', typeof get(reg1.json, 'data', 'user', 'id') === 'string');
  check(
    'returns data.user.username',
    get(reg1.json, 'data', 'user', 'username') === TEST_USER.username
  );
  check('returns data.user.email', get(reg1.json, 'data', 'user', 'email') === TEST_USER.email);
  check('returns data.user.rating', typeof get(reg1.json, 'data', 'user', 'rating') === 'number');
  const userObj = get(reg1.json, 'data', 'user');
  check(
    'does not expose passwordHash',
    typeof userObj === 'object' && userObj !== null && !('passwordHash' in userObj)
  );

  const reg2 = await post('/register', TEST_USER);
  check('409 CONFLICT on duplicate email', reg2.status === 409);
  check('error.code === CONFLICT', get(reg2.json, 'error', 'code') === 'CONFLICT');

  const reg3 = await post('/register', { username: 'x', email: 'bad' });
  check('400 VALIDATION_ERROR on missing/invalid fields', reg3.status === 400);
  check('error.code === VALIDATION_ERROR', get(reg3.json, 'error', 'code') === 'VALIDATION_ERROR');

  // -------------------------------------------------------------------------
  section('2. Login');

  const loginOk = await post('/login', { email: TEST_USER.email, password: TEST_USER.password });
  check('200 on valid login', loginOk.status === 200);
  check(
    'sets access_token cookie',
    loginOk.setCookies.some((c) => c.startsWith('access_token='))
  );
  check(
    'sets refresh_token cookie',
    loginOk.setCookies.some((c) => c.startsWith('refresh_token='))
  );
  check(
    'access_token is httpOnly',
    loginOk.setCookies.some((c) => c.startsWith('access_token=') && /HttpOnly/i.test(c))
  );
  check(
    'refresh_token is httpOnly',
    loginOk.setCookies.some((c) => c.startsWith('refresh_token=') && /HttpOnly/i.test(c))
  );

  const accessCookie = extractCookie(loginOk.setCookies, 'access_token');
  const refreshCookie = extractCookie(loginOk.setCookies, 'refresh_token');
  cookieJar = [accessCookie, refreshCookie].filter(Boolean).join('; ');

  const loginBad = await post('/login', { email: TEST_USER.email, password: 'wrongpassword' });
  check('401 UNAUTHORIZED on wrong password', loginBad.status === 401);
  check('error.code === UNAUTHORIZED', get(loginBad.json, 'error', 'code') === 'UNAUTHORIZED');

  // -------------------------------------------------------------------------
  section('3. Refresh');

  const refreshOk = await post('/refresh', undefined, refreshCookie ?? '');
  check('200 on valid refresh', refreshOk.status === 200);
  check(
    'rotates access_token cookie',
    refreshOk.setCookies.some((c) => c.startsWith('access_token='))
  );
  check(
    'rotates refresh_token cookie',
    refreshOk.setCookies.some((c) => c.startsWith('refresh_token='))
  );

  const newAccessCookie = extractCookie(refreshOk.setCookies, 'access_token');
  const newRefreshCookie = extractCookie(refreshOk.setCookies, 'refresh_token');
  cookieJar = [newAccessCookie, newRefreshCookie].filter(Boolean).join('; ');

  const refreshNoAuth = await post('/refresh');
  check('401 on refresh with no cookie', refreshNoAuth.status === 401);

  // -------------------------------------------------------------------------
  section('4. Logout');

  const logoutOk = await post('/logout', undefined, cookieJar);
  check('204 on valid logout', logoutOk.status === 204);
  check('clears access_token cookie', isCookieCleared(logoutOk.setCookies, 'access_token'));
  check('clears refresh_token cookie', isCookieCleared(logoutOk.setCookies, 'refresh_token'));

  const logoutNoAuth = await post('/logout');
  check('401 on logout with no cookie', logoutNoAuth.status === 401);

  // -------------------------------------------------------------------------
  section('5. Rate limiting');

  const rateLimitResults = await Promise.all(
    Array.from({ length: 6 }, () =>
      post('/register', { username: 'x', email: 'rate@test.com', password: 'password123' })
    )
  );
  check(
    '429 RATE_LIMITED after exceeding register limit',
    rateLimitResults.some((r) => r.status === 429)
  );
  check(
    'error.code === RATE_LIMITED',
    rateLimitResults.some((r) => get(r.json, 'error', 'code') === 'RATE_LIMITED')
  );

  // -------------------------------------------------------------------------
  console.log(`\n=== Done — ${passed} passed, ${failed} failed ===\n`);
  if (failed > 0) process.exit(1);
}

main();
