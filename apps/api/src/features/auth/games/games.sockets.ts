import type { User } from '@prisma/client';
import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@tacfinity/shared';
import { AppError } from '../../../shared/errors/AppError.js';
import { gamesService } from './games.service.js';

type AuthedSocket = Socket<ClientToServerEvents, ServerToClientEvents> & {
  data: { user: User };
};

type GameErrorPayload = {
  error: { code: string; message: string };
};

type GameErrorEmitter = {
  emit(event: 'game:error', payload: GameErrorPayload): boolean;
};

export function registerGameHandlers(
  socket: AuthedSocket,
  io: Server<ClientToServerEvents, ServerToClientEvents>
): void {
  socket.on('game:move', async ({ gameId, row, col }) => {
    try {
      await gamesService.applyMove(gameId, socket.data.user.id, row, col, io);
    } catch (err) {
      const code = err instanceof AppError ? err.code : 'INTERNAL';
      const message = err instanceof Error ? err.message : 'Server error';
      (socket as unknown as GameErrorEmitter).emit('game:error', { error: { code, message } });
    }
  });
}
