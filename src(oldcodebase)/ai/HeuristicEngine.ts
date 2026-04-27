import type { Cell, Player } from '../types';
import type { WinDetector } from '../game/WinDetector';
import type { BoardEvaluator } from './BoardEvaluator';

/**
 * Heuristic minimax with alpha-beta pruning.
 * Uses candidate move filtering to stay tractable on large boards.
 */
export class HeuristicEngine {
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
    const candidates = this.evaluator.getCandidateMoves(board);
    if (!candidates.length) {
      return Math.floor(this.rows / 2) * this.cols + Math.floor(this.cols / 2);
    }

    let best = -Infinity;
    let bestIdx = candidates[0];

    for (const i of candidates) {
      board[i] = this.aiSide;
      const score = this._minimax(board, maxDepth - 1, false, -Infinity, Infinity);
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
    if (winner === this.aiSide) return 500_000;
    if (winner) return -500_000;
    if (depth === 0 || board.every(Boolean)) return this.evaluator.evaluate(board);

    const player = isMax ? this.aiSide : this.oppSide;
    const moves = this.evaluator.getCandidateMoves(board).slice(0, 15);
    let best = isMax ? -Infinity : Infinity;

    for (const i of moves) {
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
