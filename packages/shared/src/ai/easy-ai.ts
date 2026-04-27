import type { GameState } from '../game-logic/game-state';
import type { WinDetector } from '../game-logic/win-detector';
import type { Player } from '../types';
import { AIPlayer } from './ai-player';
import type { MinimaxEngine } from './minimax-engine';

export class EasyAI extends AIPlayer {
  private readonly minimaxEngine: MinimaxEngine;

  constructor(
    side: Player,
    gameState: GameState,
    winDetector: WinDetector,
    minimaxEngine: MinimaxEngine
  ) {
    super(side, gameState, winDetector);
    this.minimaxEngine = minimaxEngine;
  }

  getMove(): number {
    const board = this.state.board;
    if (Math.random() < 0.25) {
      return this.minimaxEngine.getBestMove(board, 1);
    }
    return this._getRandomMove(board);
  }
}
