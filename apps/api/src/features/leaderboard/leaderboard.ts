import { Router, Request, Response } from 'express';
import { prisma } from '../leaderboard/prisma.js';

interface LeaderboardUser {
  id: string;
  username: string;
  rating: number;
}

interface LeaderboardEntry extends LeaderboardUser {
  rank: number;
}

async function getTopUsers(n: number): Promise<LeaderboardEntry[]> {
  const users = await prisma.user.findMany({
    orderBy: { rating: 'desc' },
    take: n,
    select: { id: true, username: true, rating: true },
  });

  return users.map(
    (user: LeaderboardUser, index: number): LeaderboardEntry => ({ rank: index + 1, ...user })
  );
}

export const leaderboardRouter: Router = Router();

leaderboardRouter.get('/api/v1/leaderboard', async (req: Request, res: Response) => {
  const n = Math.min(Number(req.query.n) || 10, 100);
  const users = await getTopUsers(n);
  res.json(users);
});
