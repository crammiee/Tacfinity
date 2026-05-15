import type { User } from '@prisma/client';
import { GameState, WinDetector, type Player, type GameSyncPayload } from '@tacfinity/shared';
import { logger } from '../../shared/lib/logger.js';
import { gamesRepository } from './games.repository.js';
import {
  RECONNECT_WINDOW_MS,
  type IoServer,
  sessions,
  disconnectTimers,
  clearDisconnectTimer,
} from './games.state.js';
import { endGame } from './games.end.js';

export async function createGameSession(xUser: User, oUser: User): Promise<{ gameId: string }> {
  const { game } = await gamesRepository.createRoomAndGame(
    xUser.id,
    oUser.id,
    xUser.rating,
    oUser.rating
  );

  const gameState = new GameState();
  gameState.configure({
    cols: 15,
    rows: 15,
    winLen: 5,
    mode: '2p',
    difficulty: 'hard',
    humanSide: 'X',
  });
  gameState.resetBoard();

  sessions.set(game.id, {
    gameId: game.id,
    gameState,
    winDetector: new WinDetector(),
    players: { X: xUser, O: oUser },
    moves: [],
    pendingDrawOfferId: null,
  });

  return { gameId: game.id };
}

export async function handlePlayerDisconnect(socketUserId: string, io: IoServer): Promise<void> {
  for (const [, session] of sessions) {
    const { players, gameId } = session;
    if (players.X.id !== socketUserId && players.O.id !== socketUserId) continue;

    const disconnectedSymbol: Player = players.X.id === socketUserId ? 'X' : 'O';
    const winner: Player = disconnectedSymbol === 'X' ? 'O' : 'X';

    const timer = setTimeout(() => {
      disconnectTimers.delete(socketUserId);
      if (sessions.has(gameId)) {
        void endGame(session, winner, io).catch((err: unknown) => {
          logger.error({ err }, 'forfeit endGame failed');
        });
      }
    }, RECONNECT_WINDOW_MS);

    disconnectTimers.set(socketUserId, timer);
    return;
  }
}

export function syncGame(gameId: string, socketUserId: string): GameSyncPayload | null {
  const session = sessions.get(gameId);
  if (!session) return null;

  const { players, gameState, moves } = session;
  const isPlayerX = players.X.id === socketUserId;
  const isPlayerO = players.O.id === socketUserId;
  if (!isPlayerX && !isPlayerO) return null;

  clearDisconnectTimer(socketUserId);

  const yourSymbol: Player = isPlayerX ? 'X' : 'O';
  const opponent = isPlayerX ? players.O : players.X;

  return {
    gameId,
    board: gameState.board,
    moves: moves.map((move) => `${move.player}:${move.row},${move.col}`),
    nextPlayer: gameState.currentPlayer,
    yourSymbol,
    opponentUsername: opponent.username,
    opponentRating: opponent.rating,
    yourRating: players[yourSymbol].rating,
  };
}
