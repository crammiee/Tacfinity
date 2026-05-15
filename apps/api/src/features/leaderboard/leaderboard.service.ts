import { leaderboardRepository, type LeaderboardRow } from './leaderboard.repository.js';

export type LeaderboardEntry = LeaderboardRow & { rank: number };

const CACHE_TTL_MS = 60_000;
const MAX_CACHED = 100;

let cache: { items: LeaderboardEntry[]; builtAt: number } | null = null;

export const leaderboardService = {
  async getLeaderboard(limit: number): Promise<LeaderboardEntry[]> {
    if (cache && Date.now() - cache.builtAt < CACHE_TTL_MS) {
      return cache.items.slice(0, limit);
    }
    const users = await leaderboardRepository.getTopUsers(MAX_CACHED);
    cache = {
      items: users.map((user, index) => ({ rank: index + 1, ...user })),
      builtAt: Date.now(),
    };
    return cache.items.slice(0, limit);
  },

  invalidate(): void {
    cache = null;
  },
};
