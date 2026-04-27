import type { Cell, Player } from '../types';
import type { WinDetector } from '../game/WinDetector';
import type { BoardEvaluator } from './BoardEvaluator';

/**
 * Pure minimax with alpha-beta pruning.
 * Scans ALL empty cells — no candidate filtering.
 * Guarantees mathematically perfect play on small boards.
 */
export class MinimaxEngine {
  private readonly aiSide: Player;
  private readonly oppSide: Player;
  private readonly cols: number;
  private readonly rows: number;
  private readonly winLen: number;
  private readonly winDetector: WinDetector;
  private readonly evaluator: BoardEvaluator;

  constructor(
    aiSide: Player,
    cols: number,
    rows: number,
    winLen: number,
    winDetector: WinDetector,
    evaluator: BoardEvaluator
  ) {
    this.aiSide = aiSide;
    this.oppSide = aiSide === 'X' ? 'O' : 'X';
    this.cols = cols;
    this.rows = rows;
    this.winLen = winLen;
    this.winDetector = winDetector;
    this.evaluator = evaluator;
  }

  getBestMove(board: Cell[], maxDepth: number): number {
    let best = -Infinity;
    let bestIdx = -1;

    for (let i = 0; i < board.length; i++) {
      if (board[i]) continue;
      board[i] = this.aiSide;
      const score = this._minimax(board, maxDepth, false, -Infinity, Infinity);
      board[i] = null;
      if (score > best) {
        best = score;
        bestIdx = i;
      }
    }
    return bestIdx;
  }

  private _minimax(
    board: Cell[],
    depth: number,
    isMax: boolean,
    alpha: number,
    beta: number
  ): number {
    const winner = this.winDetector.getBoardWinner(board, this.winLen, this.cols, this.rows);
    if (winner === this.aiSide) return 100_000 + depth;
    if (winner) return -100_000 - depth;
    if (board.every(Boolean)) return 0;
    if (depth === 0) return this.evaluator.evaluate(board);

    const player = isMax ? this.aiSide : this.oppSide;
    let best = isMax ? -Infinity : Infinity;

    for (let i = 0; i < board.length; i++) {
      if (board[i]) continue;
      board[i] = player;
      const score = this._minimax(board, depth - 1, !isMax, alpha, beta);
      board[i] = null;

      if (isMax) {
        if (score > best) best = score;
        if (best > alpha) alpha = best;
      } else {
        if (score < best) best = score;
        if (best < beta) beta = best;
      }
      if (beta <= alpha) break;
    }
    return best;
  }
}
