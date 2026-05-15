import { GameStatus } from '@prisma/client';
import type { PublicProfile } from '@tacfinity/shared';
import { db } from '../../shared/db/index.js';

export const usersRepository = {
  async findPublicProfile(userId: string): Promise<PublicProfile | null> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, rating: true },
    });

    if (!user) return null;

    const gamePlayers = await db.gamePlayer.findMany({
      where: { userId, game: { status: GameStatus.FINISHED } },
      select: {
        ratingBefore: true,
        ratingAfter: true,
        game: {
          select: {
            id: true,
            winnerId: true,
            endedAt: true,
            gamePlayers: {
              select: { userId: true, user: { select: { id: true, username: true } } },
            },
          },
        },
      },
      orderBy: { game: { endedAt: 'desc' } },
      take: 20,
    });

    const gameHistory = gamePlayers.map((gp) => {
      const opponent = gp.game.gamePlayers.find((p) => p.userId !== userId);
      const result: 'win' | 'loss' | 'draw' =
        gp.game.winnerId === null ? 'draw' : gp.game.winnerId === userId ? 'win' : 'loss';

      return {
        gameId: gp.game.id,
        opponent: opponent?.user ?? { id: '', username: 'Unknown' },
        result,
        ratingBefore: gp.ratingBefore,
        ratingAfter: gp.ratingAfter,
        endedAt: gp.game.endedAt?.toISOString() ?? null,
      };
    });

    return { ...user, gameHistory };
  },
};
