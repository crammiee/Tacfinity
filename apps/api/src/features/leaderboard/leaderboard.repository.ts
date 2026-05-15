import { db } from '../../shared/db/index.js';

export type LeaderboardRow = {
  id: string;
  username: string;
  rating: number;
};

export const leaderboardRepository = {
  async getTopUsers(limit: number): Promise<LeaderboardRow[]> {
    return db.user.findMany({
      orderBy: { rating: 'desc' },
      take: limit,
      select: { id: true, username: true, rating: true },
    });
  },
};
