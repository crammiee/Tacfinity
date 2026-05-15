import type { Request, RequestHandler, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../shared/middleware/asyncHandler.js';
import { ok } from '../../shared/utils/respond.js';
import { leaderboardService } from './leaderboard.service.js';

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const getLeaderboard: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const { limit } = querySchema.parse(req.query);
  const items = await leaderboardService.getLeaderboard(limit);
  ok(res, { items });
});
