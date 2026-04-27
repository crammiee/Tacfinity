import type { Cell, Player } from '../types';

const DIRECTIONS: readonly [number, number][] = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
];

export class WinDetector {
  checkWin(
    board: Cell[],
    player: Player,
    winLen: number,
    cols: number,
    rows: number
  ): number[] | null {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (board[row * cols + col] !== player) continue;
        const cells = this._findWinFromCell(board, player, winLen, cols, rows, row, col);
        if (cells) return cells;
      }
    }
    return null;
  }

  getBoardWinner(board: Cell[], winLen: number, cols: number, rows: number): Player | null {
    if (this.checkWin(board, 'X', winLen, cols, rows)) return 'X';
    if (this.checkWin(board, 'O', winLen, cols, rows)) return 'O';
    return null;
  }

  isDraw(board: Cell[]): boolean {
    return board.every(Boolean);
  }

  private _findWinFromCell(
    board: Cell[],
    player: Player,
    winLen: number,
    cols: number,
    rows: number,
    startRow: number,
    startCol: number
  ): number[] | null {
    for (const [dc, dr] of DIRECTIONS) {
      const cells = this._traceDirection(
        board,
        player,
        winLen,
        cols,
        rows,
        startRow,
        startCol,
        dc,
        dr
      );
      if (cells) return cells;
    }
    return null;
  }

  private _traceDirection(
    board: Cell[],
    player: Player,
    winLen: number,
    cols: number,
    rows: number,
    startRow: number,
    startCol: number,
    dc: number,
    dr: number
  ): number[] | null {
    const cells = [startRow * cols + startCol];
    for (let k = 1; k < winLen; k++) {
      const nr = startRow + dr * k;
      const nc = startCol + dc * k;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) return null;
      const ni = nr * cols + nc;
      if (board[ni] !== player) return null;
      cells.push(ni);
    }
    return cells;
  }
}
