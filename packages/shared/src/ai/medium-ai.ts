import type { GameState } from '../game-logic/game-state';
import type { WinDetector } from '../game-logic/win-detector';
import type { Player } from '../types';
import { AIPlayer } from './ai-player';
import type { HeuristicEngine } from './heuristic-engine';
import type { MinimaxEngine } from './minimax-engine';

export class MediumAI extends AIPlayer {
  private readonly minimaxEngine: MinimaxEngine;
  private readonly heuristicEngine: HeuristicEngine;

  constructor(
    side: Player,
    gameState: GameState,
    winDetector: WinDetector,
    minimaxEngine: MinimaxEngine,
    heuristicEngine: HeuristicEngine
  ) {
    super(side, gameState, winDetector);
    this.minimaxEngine = minimaxEngine;
    this.heuristicEngine = heuristicEngine;
  }

  getMove(): number {
    const board = this.state.board;
    const depth = 3;

    if (this.state.totalCells <= 16) {
      return this.minimaxEngine.getBestMove(board, depth);
    }

    const winMove = this._findImmediateWin(board, this.side);
    if (winMove >= 0) return winMove;

    const blockMove = this._findImmediateWin(board, this.opponentSide);
    if (blockMove >= 0) return blockMove;

    return this.heuristicEngine.getBestMove(board, depth);
  }
}
