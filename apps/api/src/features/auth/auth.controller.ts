import type { CookieOptions, Request, RequestHandler, Response } from 'express';
import { loginSchema, registerSchema } from '@tacfinity/shared';
import { asyncHandler } from '../../shared/middleware/asyncHandler.js';
import { UnauthorizedError } from '../../shared/errors/AppError.js';
import { ok } from '../../shared/utils/respond.js';
import { authService } from './auth.service.js';

const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

const ACCESS_MAX_AGE = 15 * 60 * 1000;
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  res.cookie('access_token', accessToken, { ...COOKIE_OPTIONS, maxAge: ACCESS_MAX_AGE });
  res.cookie('refresh_token', refreshToken, { ...COOKIE_OPTIONS, maxAge: REFRESH_MAX_AGE });
}

export const register: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const input = registerSchema.parse(req.body);
  const user = await authService.register(input);
  ok(res, { user }, 201);
});

export const login: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const input = loginSchema.parse(req.body);
  const { user, accessToken, refreshToken } = await authService.login(input);
  setAuthCookies(res, accessToken, refreshToken);
  ok(res, { user });
});

export const refresh: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refresh_token;
  if (typeof refreshToken !== 'string' || refreshToken.length === 0) {
    throw new UnauthorizedError();
  }

  const result = await authService.refresh(refreshToken);
  setAuthCookies(res, result.accessToken, result.refreshToken);
  ok(res, { user: result.user });
});

export const logout: RequestHandler = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie('access_token', COOKIE_OPTIONS);
  res.clearCookie('refresh_token', COOKIE_OPTIONS);
  res.sendStatus(204);
});
