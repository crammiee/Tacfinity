import { type Player } from '@tacfinity/shared';
import { ValidationError } from '../../shared/errors/AppError.js';
import { type GameSession, type IoServer, sessions, gameStateUtils } from './games.state.js';
import { gameEnd } from './games.end.js';

export const gameMoves = {
  apply: applyMove,
};

async function applyMove(
  gameId: string,
  socketUserId: string,
  row: number,
  col: number,
  io: IoServer
): Promise<void> {
  const session = sessions.get(gameId);
  if (!session) throw new ValidationError('Game session not found');

  const { gameState, moves } = session;
  const playerSymbol = gameStateUtils.resolvePlayerSymbol(session, socketUserId);

  if (gameState.currentPlayer !== playerSymbol) throw new ValidationError('Not your turn');
  if (row < 0 || row >= gameState.rows || col < 0 || col >= gameState.cols)
    throw new ValidationError('Move out of bounds');

  const idx = row * gameState.cols + col;
  if (gameState.board[idx]) throw new ValidationError('Cell already occupied');

  gameState.placeMove(idx, playerSymbol);
  moves.push({ player: playerSymbol, row, col });

  const isGameOver = await checkAndResolveOutcome(session, playerSymbol, io);
  if (isGameOver) return;

  gameState.switchPlayer();
  io.to(`game:${gameId}`).emit('game:update', {
    gameId,
    tgnToken: `${playerSymbol}:${row},${col}`,
    nextPlayer: gameState.currentPlayer,
  });
}

async function checkAndResolveOutcome(
  session: GameSession,
  playerSymbol: Player,
  io: IoServer
): Promise<boolean> {
  const { gameState, winDetector } = session;
  const winningCells = winDetector.checkWin(
    gameState.board,
    playerSymbol,
    gameState.winLen,
    gameState.cols,
    gameState.rows
  );
  if (winningCells) {
    await gameEnd.end(session, playerSymbol, io);
    return true;
  }
  if (winDetector.isDraw(gameState.board)) {
    await gameEnd.end(session, null, io);
    return true;
  }
  return false;
}
