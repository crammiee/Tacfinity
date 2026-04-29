import { Router, type Router as ExpressRouter } from 'express';
import rateLimit from 'express-rate-limit';
import { AppError } from '../../shared/errors/AppError.js';
import { requireAuth } from '../../shared/middleware/auth.middleware.js';
import { login, logout, refresh, register } from './auth.controller.js';

const ONE_MINUTE_MS = 60 * 1000;

function authLimiter(limit: number) {
  return rateLimit({
    windowMs: ONE_MINUTE_MS,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(new AppError('RATE_LIMITED', 429, 'Too many requests'));
    },
  });
}

export const authRouter: ExpressRouter = Router();

authRouter.post('/register', authLimiter(5), register);
authRouter.post('/login', authLimiter(10), login);
authRouter.post('/refresh', authLimiter(30), refresh);
authRouter.post('/logout', requireAuth, logout);
