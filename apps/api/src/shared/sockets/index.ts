import type { Server as HttpServer } from 'http';
import { Server, type Socket } from 'socket.io';
import type { User } from '@prisma/client';
import type { ClientToServerEvents, ServerToClientEvents } from '@tacfinity/shared';
import { env } from '../../config/env.js';
import { authService } from '../../features/auth/auth.service.js';
import { authRepository } from '../../features/auth/auth.repository.js';
import { registerMatchmakingHandlers } from '../../features/auth/matchmaking/matchmaking.sockets.js';
import { registerGameHandlers } from '../../features/auth/games/games.sockets.js';

type AuthedSocket = Socket<ClientToServerEvents, ServerToClientEvents> & {
  data: { user: User };
};

export function initSockets(httpServer: HttpServer): void {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: env.SOCKET_CORS_ORIGIN,
      credentials: true,
    },
  });

  // Runs before every socket connection is accepted
  io.use(async (socket, next) => {
    try {
      const rawCookie = socket.handshake.headers.cookie ?? '';
      const token = parseCookie(rawCookie, 'access_token');

      if (!token) {
        return next(new Error('UNAUTHORIZED'));
      }

      const { userId } = authService.verifyAccessToken(token);
      const user = await authRepository.findUserById(userId);

      if (!user) {
        return next(new Error('UNAUTHORIZED'));
      }

      (socket as AuthedSocket).data.user = user;
      return next();
    } catch {
      return next(new Error('UNAUTHORIZED'));
    }
  });

  io.on('connection', (socket) => {
    const authedSocket = socket as AuthedSocket;
    registerMatchmakingHandlers(authedSocket, io);
    registerGameHandlers(authedSocket, io);
  });
}

function parseCookie(raw: string, key: string): string | undefined {
  const parts = raw.split(';').map((part) => part.trim());
  for (const part of parts) {
    const [k, ...rest] = part.split('=');
    if (k === key) {
      return rest.join('=');
    }
  }
  return undefined;
}
