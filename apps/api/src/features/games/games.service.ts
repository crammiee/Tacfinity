import type { User } from '@prisma/client';
import type { Server } from 'socket.io';
import {
  GameState,
  WinDetector,
  serializeGame,
  calculateElo,
  calculateDrawElo,
  type Move,
  type Player,
  type ClientToServerEvents,
  type ServerToClientEvents,
  type GameSyncPayload,
} from '@tacfinity/shared';
import { ValidationError } from '../../shared/errors/AppError.js';
import { logger } from '../../shared/lib/logger.js';
import { gamesRepository } from './games.repository.js';
import { leaderboardService } from '../leaderboard/leaderboard.service.js';

const RECONNECT_WINDOW_MS = 30_000;

interface GameSession {
  gameId: string;
  gs: GameState;
  wd: WinDetector;
  players: { X: User; O: User };
  moves: Move[];
}

const sessions = new Map<string, GameSession>();
// userId → pending forfeit timer (cleared on successful reconnect or game end)
const disconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();

function clearDisconnectTimer(userId: string): void {
  const timer = disconnectTimers.get(userId);
  if (timer) {
    clearTimeout(timer);
    disconnectTimers.delete(userId);
  }
}

async function createGameSession(xUser: User, oUser: User): Promise<{ gameId: string }> {
  const { game } = await gamesRepository.createRoomAndGame(
    xUser.id,
    oUser.id,
    xUser.rating,
    oUser.rating
  );

  const gs = new GameState();
  gs.configure({ cols: 15, rows: 15, winLen: 5, mode: '2p', difficulty: 'hard', humanSide: 'X' });
  gs.resetBoard();

  sessions.set(game.id, {
    gameId: game.id,
    gs,
    wd: new WinDetector(),
    players: { X: xUser, O: oUser },
    moves: [],
  });

  return { gameId: game.id };
}

async function applyMove(
  gameId: string,
  socketUserId: string,
  row: number,
  col: number,
  io: Server<ClientToServerEvents, ServerToClientEvents>
): Promise<void> {
  const session = sessions.get(gameId);
  if (!session) throw new ValidationError('Game session not found');

  const { gs, wd, players, moves } = session;
  let playerSymbol: Player;
  if (players.X.id === socketUserId) {
    playerSymbol = 'X';
  } else if (players.O.id === socketUserId) {
    playerSymbol = 'O';
  } else {
    throw new ValidationError('Player not in game');
  }

  if (gs.currentPlayer !== playerSymbol) throw new ValidationError('Not your turn');
  if (row < 0 || row >= gs.rows || col < 0 || col >= gs.cols)
    throw new ValidationError('Move out of bounds');

  const idx = row * gs.cols + col;
  if (gs.board[idx]) throw new ValidationError('Cell already occupied');

  gs.placeMove(idx, playerSymbol);
  moves.push({ player: playerSymbol, row, col });

  const hasWin = wd.checkWin(gs.board, playerSymbol, gs.winLen, gs.cols, gs.rows);
  if (hasWin) {
    await endGame(session, playerSymbol, io);
    return;
  }

  if (wd.isDraw(gs.board)) {
    await endGame(session, null, io);
    return;
  }

  gs.switchPlayer();
  io.to(`game:${gameId}`).emit('game:update', {
    gameId,
    tgnToken: `${playerSymbol}:${row},${col}`,
    nextPlayer: gs.currentPlayer,
  });
}

async function handlePlayerDisconnect(
  socketUserId: string,
  io: Server<ClientToServerEvents, ServerToClientEvents>
): Promise<void> {
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

function syncGame(gameId: string, socketUserId: string): GameSyncPayload | null {
  const session = sessions.get(gameId);
  if (!session) return null;

  const { players, gs, moves } = session;
  const isX = players.X.id === socketUserId;
  const isO = players.O.id === socketUserId;
  if (!isX && !isO) return null;

  // Cancel the pending forfeit timer — this player made it back in time
  clearDisconnectTimer(socketUserId);

  const yourSymbol: Player = isX ? 'X' : 'O';
  const opponent = isX ? players.O : players.X;

  return {
    gameId,
    board: gs.board,
    moves: moves.map((m) => `${m.player}:${m.row},${m.col}`),
    nextPlayer: gs.currentPlayer,
    yourSymbol,
    opponentUsername: opponent.username,
    opponentRating: opponent.rating,
    yourRating: players[yourSymbol].rating,
  };
}

async function endGame(
  session: GameSession,
  winner: Player | null,
  io: Server<ClientToServerEvents, ServerToClientEvents>
): Promise<void> {
  const { gameId, players, moves } = session;
  const xBefore = players.X.rating;
  const oBefore = players.O.rating;

  let xAfter = xBefore;
  let oAfter = oBefore;

  if (winner === 'X') {
    const r = calculateElo(xBefore, oBefore);
    xAfter = r.newWinner;
    oAfter = r.newLoser;
  } else if (winner === 'O') {
    const r = calculateElo(oBefore, xBefore);
    oAfter = r.newWinner;
    xAfter = r.newLoser;
  } else {
    const r = calculateDrawElo(xBefore, oBefore);
    xAfter = r.newA;
    oAfter = r.newB;
  }

  await gamesRepository.saveGameResult({
    gameId,
    moves: serializeGame(moves),
    winnerId: winner ? players[winner].id : null,
    xId: players.X.id,
    xRatingAfter: xAfter,
    oId: players.O.id,
    oRatingAfter: oAfter,
  });

  leaderboardService.invalidate();

  io.to(`game:${gameId}`).emit('game:end', {
    gameId,
    winner: winner ?? 'draw',
    ratingDelta: {
      X: xAfter - xBefore,
      O: oAfter - oBefore,
    },
  });

  clearDisconnectTimer(players.X.id);
  clearDisconnectTimer(players.O.id);
  sessions.delete(gameId);
}

export const gamesService = {
  createGameSession,
  applyMove,
  handlePlayerDisconnect,
  syncGame,
};
