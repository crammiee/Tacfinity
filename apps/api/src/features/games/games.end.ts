import type { User } from '@prisma/client';
import { serializeGame, calculateElo, calculateDrawElo, type Player } from '@tacfinity/shared';
import { ValidationError } from '../../shared/errors/AppError.js';
import { gamesRepository } from './games.repository.js';
import { leaderboardService } from '../leaderboard/leaderboard.service.js';
import {
  type GameSession,
  type IoServer,
  sessions,
  clearDisconnectTimer,
  resolvePlayerSymbol,
} from './games.state.js';

function computeEloDeltas(
  players: { X: User; O: User },
  winner: Player | null
): { xAfter: number; oAfter: number } {
  const xBefore = players.X.rating;
  const oBefore = players.O.rating;

  if (winner === 'X') {
    const eloResult = calculateElo(xBefore, oBefore);
    return { xAfter: eloResult.newWinner, oAfter: eloResult.newLoser };
  }
  if (winner === 'O') {
    const eloResult = calculateElo(oBefore, xBefore);
    return { xAfter: eloResult.newLoser, oAfter: eloResult.newWinner };
  }
  const eloResult = calculateDrawElo(xBefore, oBefore);
  return { xAfter: eloResult.newA, oAfter: eloResult.newB };
}

export async function endGame(
  session: GameSession,
  winner: Player | null,
  io: IoServer
): Promise<void> {
  const { gameId, players, moves } = session;
  const { xAfter, oAfter } = computeEloDeltas(players, winner);

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
    ratingDelta: { X: xAfter - players.X.rating, O: oAfter - players.O.rating },
  });

  clearDisconnectTimer(players.X.id);
  clearDisconnectTimer(players.O.id);
  sessions.delete(gameId);
}

export async function resignGame(
  gameId: string,
  socketUserId: string,
  io: IoServer
): Promise<void> {
  const session = sessions.get(gameId);
  if (!session) throw new ValidationError('Game session not found');

  const resigningSymbol = resolvePlayerSymbol(session, socketUserId);
  const winner: Player = resigningSymbol === 'X' ? 'O' : 'X';
  await endGame(session, winner, io);
}
