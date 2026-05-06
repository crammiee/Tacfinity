import type { User } from '@prisma/client';
import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@tacfinity/shared';
import { gamesService } from '../games/games.service.js';

export type AuthedSocket = Socket<ClientToServerEvents, ServerToClientEvents> & {
  data: { user: User };
};

const queue = new Set<AuthedSocket>();

async function joinQueue(
  socket: AuthedSocket,
  io: Server<ClientToServerEvents, ServerToClientEvents>
): Promise<void> {
  queue.add(socket);

  if (queue.size < 2) return;

  const [s1, s2] = [...queue];
  queue.delete(s1);
  queue.delete(s2);

  await pair(s1, s2, io);
}

function cancelQueue(socket: AuthedSocket): void {
  queue.delete(socket); // idempotent
}

async function pair(
  s1: AuthedSocket,
  s2: AuthedSocket,
  _io: Server<ClientToServerEvents, ServerToClientEvents>
): Promise<void> {
  // X = first queued, O = second queued
  const { gameId } = await gamesService.createGameSession(s1.data.user, s2.data.user);
  const room = `game:${gameId}`;

  s1.join(room);
  s2.join(room);

  s1.emit('queue:matched', {
    gameId,
    yourSymbol: 'X',
    yourRating: s1.data.user.rating,
    opponentUsername: s2.data.user.username,
    opponentRating: s2.data.user.rating,
  });

  s2.emit('queue:matched', {
    gameId,
    yourSymbol: 'O',
    yourRating: s2.data.user.rating,
    opponentUsername: s1.data.user.username,
    opponentRating: s1.data.user.rating,
  });
}

export const matchmakingService = {
  joinQueue,
  cancelQueue,
};
