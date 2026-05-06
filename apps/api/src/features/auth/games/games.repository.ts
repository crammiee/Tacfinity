import { PlayerSymbol, RoomStatus, RoomType } from '@prisma/client';
import { db } from '../../../shared/db/index.js';

export const gamesRepository = {
  async createRoomAndGame(
    xUserId: string,
    oUserId: string,
    xRatingBefore: number,
    oRatingBefore: number
  ) {
    return db.$transaction(async (tx) => {
      const room = await tx.room.create({
        data: {
          code: `MM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          hostId: xUserId,
          boardSize: 11,
          winCondition: 5,
          type: RoomType.CASUAL,
          status: RoomStatus.IN_GAME,
        },
      });

      const game = await tx.game.create({
        data: {
          roomId: room.id,
          gamePlayers: {
            create: [
              { userId: xUserId, symbol: PlayerSymbol.X, ratingBefore: xRatingBefore },
              { userId: oUserId, symbol: PlayerSymbol.O, ratingBefore: oRatingBefore },
            ],
          },
        },
      });

      return { room, game };
    });
  },

  async saveGameResult(opts: {
    gameId: string;
    moves: string;
    winnerId: string | null;
    xId: string;
    xRatingBefore: number;
    xRatingAfter: number;
    oId: string;
    oRatingBefore: number;
    oRatingAfter: number;
  }) {
    await db.$transaction([
      db.game.update({
        where: { id: opts.gameId },
        data: {
          moves: opts.moves,
          winnerId: opts.winnerId,
          status: 'FINISHED',
          endedAt: new Date(),
        },
      }),
      db.gamePlayer.update({
        where: { gameId_userId: { gameId: opts.gameId, userId: opts.xId } },
        data: { ratingBefore: opts.xRatingBefore, ratingAfter: opts.xRatingAfter },
      }),
      db.gamePlayer.update({
        where: { gameId_userId: { gameId: opts.gameId, userId: opts.oId } },
        data: { ratingBefore: opts.oRatingBefore, ratingAfter: opts.oRatingAfter },
      }),
      db.user.update({ where: { id: opts.xId }, data: { rating: opts.xRatingAfter } }),
      db.user.update({ where: { id: opts.oId }, data: { rating: opts.oRatingAfter } }),
    ]);
  },
};
