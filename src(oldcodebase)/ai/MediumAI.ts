import type { GameState } from '../game/GameState';
import type { WinDetector } from '../game/WinDetector';
import type { Player } from '../types';
import { AIPlayer } from './AIPlayer';
import type { HeuristicEngine } from './HeuristicEngine';
import type { MinimaxEngine } from './MinimaxEngine';

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
