import { db } from '../../shared/db/index.js';

export const cleanupRepository = {
  async markStaleRoomsFinished(olderThanMs: number): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanMs);
    const { count } = await db.room.updateMany({
      where: {
        status: 'WAITING',
        createdAt: { lt: cutoff },
      },
      data: { status: 'FINISHED' },
    });
    return count;
  },

  async markAbandonedGames(olderThanMs: number): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanMs);

    return db.$transaction(async (tx) => {
      const { count } = await tx.game.updateMany({
        where: {
          status: 'IN_PROGRESS',
          startedAt: { lt: cutoff },
        },
        data: {
          status: 'ABANDONED',
          endedAt: new Date(),
        },
      });

      await tx.room.updateMany({
        where: {
          status: 'IN_GAME',
          games: { none: { status: 'IN_PROGRESS' } },
        },
        data: { status: 'FINISHED' },
      });

      return count;
    });
  },
};
