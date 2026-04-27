import type { Cell, Player } from '../types';
import type { WinDetector } from '../game/WinDetector';

const DIRECTIONS: readonly [number, number][] = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
];

export class BoardEvaluator {
  private readonly aiSide: Player;
  private readonly oppSide: Player;
  private readonly cols: number;
  private readonly rows: number;
  private readonly winLen: number;

  constructor(aiSide: Player, cols: number, rows: number, winLen: number) {
    this.aiSide = aiSide;
    this.oppSide = aiSide === 'X' ? 'O' : 'X';
    this.cols = cols;
    this.rows = rows;
    this.winLen = winLen;
  }

  evaluate(board: Cell[]): number {
    return this._scoreAllWindows(board) + this._scoreCenterControl(board);
  }

  scoreCellQuick(board: Cell[], idx: number): number {
    const r = Math.floor(idx / this.cols);
    const c = idx % this.cols;
    let score = 0;

    const cr = this.rows / 2;
    const cc = this.cols / 2;
    score -= (Math.abs(r - cr) + Math.abs(c - cc)) * 0.5;

    for (const [dc, dr] of DIRECTIONS) {
      let aiCount = 0;
      let oppCount = 0;
      for (let k = -(this.winLen - 1); k < this.winLen; k++) {
        const nr = r + dr * k;
        const nc = c + dc * k;
        if (nr < 0 || nr >= this.rows || nc < 0 || nc >= this.cols) continue;
        const v = board[nr * this.cols + nc];
        if (v === this.aiSide) aiCount++;
        else if (v === this.oppSide) oppCount++;
      }
      score += aiCount * 3 + oppCount * 2;
    }
    return score;
  }

  getCandidateMoves(board: Cell[]): number[] {
    const occupied: number[] = [];
    for (let i = 0; i < board.length; i++) {
      if (board[i]) occupied.push(i);
    }

    if (occupied.length === 0) {
      return [Math.floor(this.rows / 2) * this.cols + Math.floor(this.cols / 2)];
    }

    const candidates = new Set<number>();
    for (const idx of occupied) {
      const r = Math.floor(idx / this.cols);
      const c = idx % this.cols;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          if (!dr && !dc) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (
            nr >= 0 &&
            nr < this.rows &&
            nc >= 0 &&
            nc < this.cols &&
            !board[nr * this.cols + nc]
          ) {
            candidates.add(nr * this.cols + nc);
          }
        }
      }
    }

    return Array.from(candidates).sort(
      (a, b) => this.scoreCellQuick(board, b) - this.scoreCellQuick(board, a)
    );
  }

  findFork(board: Cell[], player: Player, winDetector: WinDetector): number {
    const candidates = this.getCandidateMoves(board);
    for (const i of candidates) {
      board[i] = player;
      const threats = this._countWinningMoves(board, player, winDetector);
      board[i] = null;
      if (threats >= 2) return i;
    }
    return -1;
  }

  private _scoreAllWindows(board: Cell[]): number {
    let score = 0;
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        for (const [dc, dr] of DIRECTIONS) {
          const windowScore = this._scoreWindow(board, row, col, dc, dr);
          if (windowScore !== null) score += windowScore;
        }
      }
    }
    return score;
  }

  private _scoreWindow(
    board: Cell[],
    startRow: number,
    startCol: number,
    dc: number,
    dr: number
  ): number | null {
    let aiCount = 0;
    let oppCount = 0;

    for (let k = 0; k < this.winLen; k++) {
      const nr = startRow + dr * k;
      const nc = startCol + dc * k;
      if (nr < 0 || nr >= this.rows || nc < 0 || nc >= this.cols) return null;
      const v = board[nr * this.cols + nc];
      if (v === this.aiSide) aiCount++;
      else if (v === this.oppSide) oppCount++;
    }

    if (aiCount > 0 && oppCount > 0) return 0;

    const openEnds = this._countOpenEnds(board, startRow, startCol, dc, dr);
    if (aiCount > 0) return this._sequenceScore(aiCount, openEnds, false);
    if (oppCount > 0) return -this._sequenceScore(oppCount, openEnds, true);
    return 0;
  }

  private _countOpenEnds(
    board: Cell[],
    startRow: number,
    startCol: number,
    dc: number,
    dr: number
  ): number {
    let openEnds = 0;
    const bR = startRow - dr;
    const bC = startCol - dc;
    const aR = startRow + dr * this.winLen;
    const aC = startCol + dc * this.winLen;
    if (this._isOpen(board, bR, bC)) openEnds++;
    if (this._isOpen(board, aR, aC)) openEnds++;
    return openEnds;
  }

  private _isOpen(board: Cell[], r: number, c: number): boolean {
    return r >= 0 && r < this.rows && c >= 0 && c < this.cols && !board[r * this.cols + c];
  }

  private _sequenceScore(count: number, openEnds: number, isOpponent: boolean): number {
    const wl = this.winLen;
    if (count === wl) return 1_000_000;
    if (count === wl - 1)
      return openEnds === 2
        ? isOpponent
          ? 80_000
          : 50_000
        : openEnds === 1
          ? isOpponent
            ? 15_000
            : 10_000
          : isOpponent
            ? 200
            : 100;
    if (count === wl - 2)
      return openEnds === 2
        ? isOpponent
          ? 3_000
          : 2_000
        : openEnds === 1
          ? isOpponent
            ? 700
            : 500
          : isOpponent
            ? 15
            : 10;
    if (count === wl - 3)
      return openEnds === 2
        ? isOpponent
          ? 300
          : 200
        : openEnds === 1
          ? isOpponent
            ? 70
            : 50
          : isOpponent
            ? 8
            : 5;
    return count * 3;
  }

  private _scoreCenterControl(board: Cell[]): number {
    let score = 0;
    const cr = Math.floor(this.rows / 2);
    const cc = Math.floor(this.cols / 2);
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = cr + dr;
        const nc = cc + dc;
        if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
          const v = board[nr * this.cols + nc];
          if (v === this.aiSide) score += 10;
          else if (v === this.oppSide) score -= 10;
        }
      }
    }
    return score;
  }

  private _countWinningMoves(board: Cell[], player: Player, winDetector: WinDetector): number {
    let count = 0;
    for (let j = 0; j < board.length; j++) {
      if (!board[j]) {
        board[j] = player;
        if (winDetector.checkWin(board, player, this.winLen, this.cols, this.rows)) count++;
        board[j] = null;
        if (count >= 2) return count;
      }
    }
    return count;
  }
}
