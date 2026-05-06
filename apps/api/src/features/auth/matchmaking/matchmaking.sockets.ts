import type { Server, Socket } from 'socket.io';
import type { User } from '@prisma/client';
import type { ClientToServerEvents, ServerToClientEvents } from '@tacfinity/shared';
import { matchmakingService } from './matchmaking.service.js';

type AuthedSocket = Socket<ClientToServerEvents, ServerToClientEvents> & {
  data: { user: User };
};

export function registerMatchmakingHandlers(
  socket: AuthedSocket,
  io: Server<ClientToServerEvents, ServerToClientEvents>
): void {
  socket.on('queue:join', async () => {
    await matchmakingService.joinQueue(socket, io);
  });

  socket.on('disconnect', () => {
    matchmakingService.cancelQueue(socket);
  });
}
