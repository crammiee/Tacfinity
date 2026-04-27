import type { GameState } from '../game/GameState';
import type { WinDetector } from '../game/WinDetector';
import type { Player } from '../types';
import { AIPlayer } from './AIPlayer';
import type { MinimaxEngine } from './MinimaxEngine';

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
