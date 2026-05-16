import { GameStatus, PlayerSymbol, RoomStatus, RoomType, type Prisma } from '@prisma/client';
import { db } from '../../shared/db/index.js';

function normalizeRoomCode(rawCode: string): string {
  return `MM-${rawCode.replace(/^MM-/i, '').toUpperCase()}`;
}

async function generateUniqueRoomCode(tx: Prisma.TransactionClient): Promise<string> {
  for (;;) {
    const code = `MM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const existing = await tx.room.findUnique({ where: { code } });
    if (!existing) return code;
  }
}

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
          code: await generateUniqueRoomCode(tx),
          hostId: xUserId,
          boardSize: 11,
          winCondition: 5,
          type: RoomType.RANKED,
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

  async findGameByRoomCode(
    rawCode: string
  ): Promise<{ gameId: string; gameStatus: GameStatus; roomCode: string } | null> {
    const code = normalizeRoomCode(rawCode);
    const room = await db.room.findUnique({
      where: { code },
      select: {
        code: true,
        games: {
          orderBy: { startedAt: 'desc' },
          take: 1,
          select: { id: true, status: true },
        },
      },
    });
    const game = room?.games[0];
    if (!room || !game) return null;
    return { gameId: game.id, gameStatus: game.status, roomCode: room.code };
  },

  async findGameByGameId(
    gameId: string
  ): Promise<{ gameStatus: GameStatus; roomCode: string } | null> {
    const game = await db.game.findUnique({
      where: { id: gameId },
      select: { status: true, room: { select: { code: true } } },
    });
    if (!game) return null;
    return { gameStatus: game.status, roomCode: game.room.code };
  },

  async saveGameResult(opts: {
    gameId: string;
    moves: string;
    winnerId: string | null;
    xId: string;
    xRatingAfter: number;
    oId: string;
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
        data: { ratingAfter: opts.xRatingAfter },
      }),
      db.gamePlayer.update({
        where: { gameId_userId: { gameId: opts.gameId, userId: opts.oId } },
        data: { ratingAfter: opts.oRatingAfter },
      }),
      db.user.update({ where: { id: opts.xId }, data: { rating: opts.xRatingAfter } }),
      db.user.update({ where: { id: opts.oId }, data: { rating: opts.oRatingAfter } }),
    ]);
  },
};
