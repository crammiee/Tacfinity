import type { GameState } from '../game/GameState';
import type { WinDetector } from '../game/WinDetector';
import type { Player } from '../types';
import { AIPlayer } from './AIPlayer';
import type { BoardEvaluator } from './BoardEvaluator';
import type { HeuristicEngine } from './HeuristicEngine';
import type { MinimaxEngine } from './MinimaxEngine';

export class HardAI extends AIPlayer {
  private readonly evaluator: BoardEvaluator;
  private readonly minimaxEngine: MinimaxEngine;
  private readonly heuristicEngine: HeuristicEngine;

  constructor(
    side: Player,
    gameState: GameState,
    winDetector: WinDetector,
    evaluator: BoardEvaluator,
    minimaxEngine: MinimaxEngine,
    heuristicEngine: HeuristicEngine
  ) {
    super(side, gameState, winDetector);
    this.evaluator = evaluator;
    this.minimaxEngine = minimaxEngine;
    this.heuristicEngine = heuristicEngine;
  }

  getMove(): number {
    const board = this.state.board;
    const depth = this._computeDepth();

    if (this.state.totalCells <= 16) {
      return this.minimaxEngine.getBestMove(board, depth);
    }

    const winMove = this._findImmediateWin(board, this.side);
    if (winMove >= 0) return winMove;

    const blockMove = this._findImmediateWin(board, this.opponentSide);
    if (blockMove >= 0) return blockMove;

    const forkMove = this.evaluator.findFork(board, this.side, this.winDetector);
    if (forkMove >= 0) return forkMove;

    const oppForkMove = this.evaluator.findFork(board, this.opponentSide, this.winDetector);
    if (oppForkMove >= 0) return oppForkMove;

    return this.heuristicEngine.getBestMove(board, depth);
  }

  private _computeDepth(): number {
    const cells = this.state.totalCells;
    if (cells <= 9) return 20;
    if (cells <= 16) return 8;
    if (cells <= 30) return 6;
    if (cells <= 60) return 5;
    return 4;
  }
}
