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
import { AppError, ForbiddenError, NotFoundError } from '../../shared/errors/AppError.js';

export async function createGameSession(
  xUser: User,
  oUser: User
): Promise<{ gameId: string; roomCode: string }> {
  const { game, room } = await gamesRepository.createRoomAndGame(
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

  return { gameId: game.id, roomCode: room.code.replace(/^MM-/, '') };
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

export async function syncGame(
  identifier: { gameId: string } | { roomCode: string },
  socketUserId: string
): Promise<GameSyncPayload> {
  let gameId: string;
  let roomCode: string;

  if ('gameId' in identifier) {
    const found = await gamesRepository.findGameByGameId(identifier.gameId);
    if (!found) throw new NotFoundError('Game');
    if (found.gameStatus !== 'IN_PROGRESS')
      throw new AppError('GAME_ENDED', 400, 'This match has already ended');
    gameId = identifier.gameId;
    roomCode = found.roomCode.replace(/^MM-/, '');
  } else {
    const found = await gamesRepository.findGameByRoomCode(identifier.roomCode);
    if (!found) throw new NotFoundError('Game');
    if (found.gameStatus !== 'IN_PROGRESS')
      throw new AppError('GAME_ENDED', 400, 'This match has already ended');
    gameId = found.gameId;
    roomCode = found.roomCode.replace(/^MM-/, '');
  }

  const session = sessions.get(gameId);
  if (!session) throw new AppError('GAME_ENDED', 400, 'This match has already ended');

  const { players, gameState, moves } = session;
  const isPlayerX = players.X.id === socketUserId;
  const isPlayerO = players.O.id === socketUserId;
  if (!isPlayerX && !isPlayerO) throw new ForbiddenError('You are not a player in this game');

  clearDisconnectTimer(socketUserId);

  const yourSymbol: Player = isPlayerX ? 'X' : 'O';
  const opponent = isPlayerX ? players.O : players.X;

  return {
    gameId,
    roomCode,
    board: gameState.board,
    moves: moves.map((move) => `${move.player}:${move.row},${move.col}`),
    nextPlayer: gameState.currentPlayer,
    yourSymbol,
    opponentUsername: opponent.username,
    opponentRating: opponent.rating,
    yourRating: players[yourSymbol].rating,
  };
}
