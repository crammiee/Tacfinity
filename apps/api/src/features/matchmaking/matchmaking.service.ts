import { type AuthedSocket } from '../../shared/types/socket.js';
import { gamesService } from '../games/games.service.js';
import { logger } from '../../shared/lib/logger.js';

const queue = new Map<AuthedSocket, number>(); // socket → joinedAt ms

async function joinQueue(socket: AuthedSocket): Promise<void> {
  queue.set(socket, Date.now());
  logger.debug({ userId: socket.data.user.id, queueSize: queue.size }, 'socket joined queue');

  if (queue.size < 2) return;

  const [s1, s2] = [...queue.keys()];
  queue.delete(s1);
  queue.delete(s2);

  await pair(s1, s2);
}

function cancelQueue(socket: AuthedSocket): void {
  queue.delete(socket);
  logger.debug({ userId: socket.data.user.id, queueSize: queue.size }, 'socket left queue');
}

function timeoutQueue(timeoutMs: number): void {
  const now = Date.now();
  logger.debug({ queueSize: queue.size }, 'queue timeout cron tick');
  for (const [socket, joinedAt] of queue) {
    if (now - joinedAt >= timeoutMs) {
      queue.delete(socket);
      logger.info({ userId: socket.data.user.id }, 'queue timeout — no match found');
      socket.emit('queue:timeout', {
        message: 'No one seems to be in queue right now — try again later.',
      });
    }
  }
}

async function pair(s1: AuthedSocket, s2: AuthedSocket): Promise<void> {
  const { gameId, roomCode } = await gamesService.createGameSession(s1.data.user, s2.data.user);
  const room = `game:${gameId}`;

  s1.join(room);
  s2.join(room);

  s1.emit('queue:matched', {
    gameId,
    roomCode,
    yourSymbol: 'X',
    yourRating: s1.data.user.rating,
    opponentUsername: s2.data.user.username,
    opponentRating: s2.data.user.rating,
  });

  s2.emit('queue:matched', {
    gameId,
    roomCode,
    yourSymbol: 'O',
    yourRating: s2.data.user.rating,
    opponentUsername: s1.data.user.username,
    opponentRating: s1.data.user.rating,
  });
}

export const matchmakingService = {
  joinQueue,
  cancelQueue,
  timeoutQueue,
};
