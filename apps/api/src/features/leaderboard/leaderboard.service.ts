import { leaderboardRepository, type LeaderboardRow } from './leaderboard.repository.js';

export type LeaderboardEntry = LeaderboardRow & { rank: number };

export const leaderboardService = {
  async getLeaderboard(limit: number): Promise<LeaderboardEntry[]> {
    const users = await leaderboardRepository.getTopUsers(limit);
    return users.map((user, index) => ({ rank: index + 1, ...user }));
  },
};
