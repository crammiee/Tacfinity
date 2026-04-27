import type { Cell, Player } from '../types';
import type { Move } from '../types';

export interface BoardConfig {
  cols: number;
  rows: number;
}

export function createEmptyBoard(rows: number, cols: number): Cell[] {
  return Array(rows * cols).fill(null);
}

export function getOpponentOf(player: Player): Player {
  return player === 'X' ? 'O' : 'X';
}

export function isBoardFull(board: Cell[]): boolean {
  return board.every(Boolean);
}

export function placeMove(board: Cell[], idx: number, player: Player): void {
  board[idx] = player;
}

export function undoMove(board: Cell[], idx: number): void {
  board[idx] = null;
}

export function indexOf(row: number, col: number, cols: number): number {
  return row * cols + col;
}

export function replayMoves(config: BoardConfig, moves: Move[]): Cell[] {
  const board = createEmptyBoard(config.rows, config.cols);
  for (const m of moves) {
    board[m.row * config.cols + m.col] = m.player;
  }
  return board;
}
