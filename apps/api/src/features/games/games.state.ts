import type { User } from '@prisma/client';
import type { Server } from 'socket.io';
import type { Move, Player, ClientToServerEvents, ServerToClientEvents } from '@tacfinity/shared';
import { GameState, WinDetector } from '@tacfinity/shared';
import { ValidationError } from '../../shared/errors/AppError.js';

export const RECONNECT_WINDOW_MS = 30_000;

export interface GameSession {
  gameId: string;
  gameState: GameState;
  winDetector: WinDetector;
  players: { X: User; O: User };
  moves: Move[];
  pendingDrawOfferId: string | null;
}

export type IoServer = Server<ClientToServerEvents, ServerToClientEvents>;

export const sessions = new Map<string, GameSession>();
export const disconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();

function clearDisconnectTimer(userId: string): void {
  const timer = disconnectTimers.get(userId);
  if (timer) {
    clearTimeout(timer);
    disconnectTimers.delete(userId);
  }
}

function resolvePlayerSymbol(session: GameSession, socketUserId: string): Player {
  if (session.players.X.id === socketUserId) return 'X';
  if (session.players.O.id === socketUserId) return 'O';
  throw new ValidationError('Player not in game');
}

export const gameStateUtils = {
  clearDisconnectTimer,
  resolvePlayerSymbol,
};
