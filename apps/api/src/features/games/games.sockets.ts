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

  socket.on('game:sync', ({ gameId }) => {
    const payload = gamesService.syncGame(gameId, socket.data.user.id);
    if (!payload) {
      socket.emit('game:error', {
        error: { code: 'NOT_FOUND', message: 'Game not found or you are not a player' },
      });
      return;
    }
    // intentional: emit below targets this socket directly, not the room — join can settle after
    void socket.join(`game:${gameId}`);
    socket.emit('game:sync', payload);
  });

  socket.on('game:resign', async ({ gameId }) => {
    try {
      await gamesService.resignGame(gameId, socket.data.user.id, io);
    } catch (err) {
      const code = err instanceof AppError ? err.code : 'INTERNAL';
      const message = err instanceof Error ? err.message : 'Server error';
      socket.emit('game:error', { error: { code, message } });
    }
  });

  socket.on('game:draw-offer', ({ gameId }) => {
    const accepted = gamesService.offerDraw(gameId, socket.data.user.id);
    if (accepted) {
      socket.to(`game:${gameId}`).emit('game:draw-offered');
    }
  });

  socket.on('game:draw-response', async ({ gameId, accepted }) => {
    try {
      if (accepted) {
        await gamesService.acceptDraw(gameId, socket.data.user.id, io);
      } else {
        const declined = gamesService.declineDraw(gameId, socket.data.user.id);
        if (declined) socket.to(`game:${gameId}`).emit('game:draw-declined');
      }
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
      // best-effort — timer started; forfeit fires after reconnection window
    }
  });
}
