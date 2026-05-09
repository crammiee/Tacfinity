import type { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@tacfinity/shared';
import { AppError } from '../../shared/errors/AppError.js';
import { type AuthedSocket } from '../../shared/types/socket.js';
import { gamesService } from './games.service.js';

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
      socket.emit('game:error', { error: { code, message } });
    }
  });

  socket.on('disconnect', async () => {
    try {
      await gamesService.handlePlayerDisconnect(socket.data.user.id, io);
    } catch {
      // best-effort forfeit on disconnect
    }
  });
}
