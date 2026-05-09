import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@tacfinity/shared';
import { env } from '../../config/env.js';
import { authService } from '../../features/auth/auth.service.js';
import { authRepository } from '../../features/auth/auth.repository.js';
import { type AuthedSocket } from '../types/socket.js';
import { registerMatchmakingHandlers } from '../../features/matchmaking/matchmaking.sockets.js';
import { registerGameHandlers } from '../../features/games/games.sockets.js';

export function initSockets(httpServer: HttpServer): void {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: env.CLIENT_URL ?? true,
      credentials: true,
    },
  });

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
    registerMatchmakingHandlers(authedSocket);
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
