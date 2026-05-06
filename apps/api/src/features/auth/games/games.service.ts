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
} from '@tacfinity/shared';
import { ValidationError } from '../../../shared/errors/AppError.js';
import { gamesRepository } from './games.repository.js';

interface GameSession {
  gameId: string;
  gs: GameState;
  wd: WinDetector;
  players: { X: User; O: User };
  moves: Move[];
}

const sessions = new Map<string, GameSession>();

async function createGameSession(xUser: User, oUser: User): Promise<{ gameId: string }> {
  const { game } = await gamesRepository.createRoomAndGame(
    xUser.id,
    oUser.id,
    xUser.rating,
    oUser.rating
  );

  const gs = new GameState();
  gs.configure({ cols: 11, rows: 11, winLen: 5, mode: 'ai', difficulty: 'hard', humanSide: 'X' });
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
    xRatingBefore: xBefore,
    xRatingAfter: xAfter,
    oId: players.O.id,
    oRatingBefore: oBefore,
    oRatingAfter: oAfter,
  });

  io.to(`game:${gameId}`).emit('game:end', {
    gameId,
    winner: winner ?? 'draw',
    ratingDelta: {
      X: xAfter - xBefore,
      O: oAfter - oBefore,
    },
  });

  sessions.delete(gameId);
}

export const gamesService = {
  createGameSession,
  applyMove,
};
