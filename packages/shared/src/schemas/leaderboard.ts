import { z } from 'zod';

export const leaderboardEntrySchema = z.object({
  rank: z.number().int(),
  id: z.string(),
  username: z.string(),
  rating: z.number(),
});

export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;
