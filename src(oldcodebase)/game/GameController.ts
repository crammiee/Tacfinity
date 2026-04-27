import type { GameSettings, Player } from '../types';
import { AIFactory } from '../ai/AIFactory';
import type { AIPlayer } from '../ai/AIPlayer';
import type { Board } from '../components/Board';
import type { SetupPanel } from '../components/SetupPanel';
import type { StatusBar } from '../components/StatusBar';
import { GameState } from './GameState';
import { WinDetector } from './WinDetector';

interface GameControllerParams {
  gameState: GameState;
  boardComponent: Board;
  statusBar: StatusBar;
  setupPanel: SetupPanel;
  winDetector: WinDetector;
}

export class GameController {
  private readonly state: GameState;
  private readonly boardComponent: Board;
  private readonly statusBar: StatusBar;
  private readonly winDetector: WinDetector;
  private aiPlayer: AIPlayer | null = null;

  constructor(params: GameControllerParams) {
    this.state = params.gameState;
    this.boardComponent = params.boardComponent;
    this.statusBar = params.statusBar;
    this.winDetector = params.winDetector;
  }

  startGame(settings: GameSettings): void {
    this.state.configure(settings);
    this.state.resetScores();
    this._applyCellSize();
    this.statusBar.updateInfoTags(this.state);
    this.statusBar.updatePlayerNames(this.state);
    this.statusBar.updateScores(this.state.scores);
    this.aiPlayer =
      settings.mode === 'ai'
        ? AIFactory.create(settings.difficulty, this.state, this.winDetector)
        : null;
    this._resetBoard();
  }

  resetBoard(): void {
    this._resetBoard();
  }

  resetAll(): void {
    this.state.resetScores();
    this.statusBar.updateScores(this.state.scores);
    this._resetBoard();
  }

  handleCellClick(idx: number): void {
    if (this.state.gameOver) return;
    if (this.state.board[idx]) return;
    if (this.state.mode === 'ai' && this.state.currentPlayer === this.state.aiSide) return;

    this._applyMove(idx, this.state.currentPlayer);

    const win = this.winDetector.checkWin(
      this.state.board,
      this.state.currentPlayer,
      this.state.winLen,
      this.state.cols,
      this.state.rows
    );
    if (win) {
      this._endGame(this.state.currentPlayer, win);
      return;
    }
    if (this.winDetector.isDraw(this.state.board)) {
      this._endGame(null);
      return;
    }

    this.state.switchPlayer();
    this.statusBar.updateBadges(this.state);

    if (this.state.mode === 'ai') {
      this.statusBar.setThinking(true);
      setTimeout(() => this._doAiMove(), 200);
    }
  }

  private _resetBoard(): void {
    this.state.resetBoard();
    this.statusBar.setMessage('');
    this.statusBar.setThinking(false);
    this.boardComponent.render(this.state);
    this.statusBar.updateBadges(this.state);

    if (this.state.mode === 'ai' && this.state.aiSide === 'X') {
      setTimeout(() => this._doAiMove(), 400);
    }
  }

  private _applyMove(idx: number, player: Player): void {
    this.state.placeMove(idx, player);
    this.boardComponent.updateCell(idx, player);
  }

  private _endGame(winner: Player | null, winCells?: number[]): void {
    this.state.gameOver = true;
    this.statusBar.setThinking(false);

    if (winner) {
      this.state.scores[winner]++;
      this.statusBar.updateScores(this.state.scores);
      this.statusBar.setWinMessage(winner, this.state);
      if (winCells) this.boardComponent.highlightWin(winCells);
    } else {
      this.state.scores.draw++;
      this.statusBar.updateScores(this.state.scores);
      this.statusBar.setMessage("IT'S A DRAW");
    }

    this.statusBar.updateBadges(this.state);
  }

  private _doAiMove(): void {
    if (this.state.gameOver) return;
    if (!this.aiPlayer) return;

    const idx = this.aiPlayer.getMove();
    this.statusBar.setThinking(false);
    if (idx == null || idx < 0) return;

    this._applyMove(idx, this.state.aiSide);

    const win = this.winDetector.checkWin(
      this.state.board,
      this.state.aiSide,
      this.state.winLen,
      this.state.cols,
      this.state.rows
    );
    if (win) {
      this._endGame(this.state.aiSide, win);
      return;
    }
    if (this.winDetector.isDraw(this.state.board)) {
      this._endGame(null);
      return;
    }

    this.state.currentPlayer = this.state.humanSide;
    this.statusBar.updateBadges(this.state);
  }

  private _applyCellSize(): void {
    const maxDim = Math.max(this.state.cols, this.state.rows);
    const size = maxDim <= 5 ? 72 : maxDim <= 8 ? 56 : maxDim <= 12 ? 44 : 34;
    document.documentElement.style.setProperty('--cell-size', `${size}px`);
  }
}
