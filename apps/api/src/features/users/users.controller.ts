import type { Request, RequestHandler, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../shared/middleware/asyncHandler.js';
import { NotFoundError } from '../../shared/errors/AppError.js';
import { ok } from '../../shared/utils/respond.js';
import { usersService } from './users.service.js';

export const getUserProfile: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string() }).parse(req.params);
  const user = await usersService.getPublicProfile(id);
  if (!user) throw new NotFoundError('User', id);
  ok(res, { user });
});
