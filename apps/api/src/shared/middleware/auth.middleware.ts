import type { Request, Response, NextFunction } from 'express';
import { authRepository } from '../../features/auth/auth.repository.js';
import { authService } from '../../features/auth/auth.service.js';
import { UnauthorizedError } from '../errors/AppError.js';

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.access_token;
    if (typeof token !== 'string' || token.length === 0) {
      throw new UnauthorizedError();
    }

    const { userId } = authService.verifyAccessToken(token);
    const user = await authRepository.findUserById(userId);
    if (!user) throw new UnauthorizedError();

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      rating: user.rating,
    };
    next();
  } catch (err) {
    next(err instanceof UnauthorizedError ? err : new UnauthorizedError());
  }
}
