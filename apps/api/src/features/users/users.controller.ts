import type { Request, RequestHandler, Response } from 'express';
import { asyncHandler } from '../../shared/middleware/asyncHandler.js';
import { NotFoundError } from '../../shared/errors/AppError.js';
import { ok } from '../../shared/utils/respond.js';
import { usersRepository } from './users.repository.js';

export const getUserProfile: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params['id'] as string;
  const profile = await usersRepository.findPublicProfile(id);
  if (!profile) throw new NotFoundError('User', id);
  ok(res, { profile });
});
