import type { Cell, Difficulty, GameMode, GameSettings, Player, Scores } from '../types';

export class GameState {
  cols: number = 3;
  rows: number = 3;
  winLen: number = 3;
  mode: GameMode = '2p';
  difficulty: Difficulty = 'hard';
  humanSide: Player = 'X';
  aiSide: Player = 'O';
  board: Cell[] = [];
  currentPlayer: Player = 'X';
  gameOver: boolean = false;
  scores: Scores = { X: 0, O: 0, draw: 0 };

  get totalCells(): number {
    return this.cols * this.rows;
  }

  getOpponentOf(player: Player): Player {
    return player === 'X' ? 'O' : 'X';
  }

  isBoardFull(): boolean {
    return this.board.every(Boolean);
  }

  placeMove(idx: number, player: Player): void {
    this.board[idx] = player;
  }

  undoMove(idx: number): void {
    this.board[idx] = null;
  }

  switchPlayer(): void {
    this.currentPlayer = this.getOpponentOf(this.currentPlayer);
  }

  resetBoard(): void {
    this.board = Array(this.rows * this.cols).fill(null);
    this.currentPlayer = 'X';
    this.gameOver = false;
  }

  resetScores(): void {
    this.scores = { X: 0, O: 0, draw: 0 };
  }

  configure(settings: GameSettings): void {
    this.cols = settings.cols;
    this.rows = settings.rows;
    this.winLen = settings.winLen;
    this.mode = settings.mode;
    this.difficulty = settings.difficulty;
    this.humanSide = settings.humanSide;
    this.aiSide = settings.humanSide === 'X' ? 'O' : 'X';
  }
}
