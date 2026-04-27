import type { Cell, Player } from '../types';
import type { GameState } from '../game-logic/game-state';
import type { WinDetector } from '../game-logic/win-detector';

/**
 * Abstract base class for all AI players.
 * Subclasses must implement getMove().
 */
export abstract class AIPlayer {
  protected readonly side: Player;
  protected readonly state: GameState;
  protected readonly winDetector: WinDetector;

  constructor(side: Player, gameState: GameState, winDetector: WinDetector) {
    this.side = side;
    this.state = gameState;
    this.winDetector = winDetector;
  }

  protected get opponentSide(): Player {
    return this.side === 'X' ? 'O' : 'X';
  }

  /** Returns the board index of the chosen move. */
  abstract getMove(): number;

  protected _getEmptyCells(board: Cell[]): number[] {
    return board.reduce<number[]>((acc, v, i) => {
      if (!v) acc.push(i);
      return acc;
    }, []);
  }

  protected _getRandomMove(board: Cell[]): number {
    const empty = this._getEmptyCells(board);
    return empty[Math.floor(Math.random() * empty.length)];
  }

  protected _findImmediateWin(board: Cell[], player: Player): number {
    const { winLen, cols, rows } = this.state;
    for (let i = 0; i < board.length; i++) {
      if (board[i]) continue;
      board[i] = player;
      const won = !!this.winDetector.checkWin(board, player, winLen, cols, rows);
      board[i] = null;
      if (won) return i;
    }
    return -1;
  }
}
