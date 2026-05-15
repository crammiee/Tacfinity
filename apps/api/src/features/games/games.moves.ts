import { type Player } from '@tacfinity/shared';
import { ValidationError } from '../../shared/errors/AppError.js';
import { type GameSession, type IoServer, sessions, resolvePlayerSymbol } from './games.state.js';
import { endGame } from './games.end.js';

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
    await endGame(session, playerSymbol, io);
    return true;
  }
  if (winDetector.isDraw(gameState.board)) {
    await endGame(session, null, io);
    return true;
  }
  return false;
}

export async function applyMove(
  gameId: string,
  socketUserId: string,
  row: number,
  col: number,
  io: IoServer
): Promise<void> {
  const session = sessions.get(gameId);
  if (!session) throw new ValidationError('Game session not found');

  const { gameState, moves } = session;
  const playerSymbol = resolvePlayerSymbol(session, socketUserId);

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
