import { z } from 'zod';

export const gameHistoryEntrySchema = z.object({
  gameId: z.string(),
  opponent: z.object({ id: z.string(), username: z.string() }),
  result: z.enum(['win', 'loss', 'draw']),
  ratingBefore: z.number(),
  ratingAfter: z.number().nullable(),
  endedAt: z.string().nullable(),
});

export const publicProfileSchema = z.object({
  id: z.string(),
  username: z.string(),
  rating: z.number(),
  gameHistory: z.array(gameHistoryEntrySchema),
});

export type GameHistoryEntry = z.infer<typeof gameHistoryEntrySchema>;
export type PublicProfile = z.infer<typeof publicProfileSchema>;
