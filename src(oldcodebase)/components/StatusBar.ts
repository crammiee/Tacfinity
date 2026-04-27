import type { Player, Scores } from '../types';
import type { GameState } from '../game/GameState';

interface StatusBarElements {
  badgeX: HTMLElement;
  badgeO: HTMLElement;
  p1name: HTMLElement;
  p2name: HTMLElement;
  scoreX: HTMLElement;
  scoreO: HTMLElement;
  scoreDraw: HTMLElement;
  gameMessage: HTMLElement;
  thinkingIndicator: HTMLElement;
  modeTag: HTMLElement;
  sizeTag: HTMLElement;
  winTag: HTMLElement;
}

export class StatusBar {
  private readonly _badgeX: HTMLElement;
  private readonly _badgeO: HTMLElement;
  private readonly _p1name: HTMLElement;
  private readonly _p2name: HTMLElement;
  private readonly _scoreX: HTMLElement;
  private readonly _scoreO: HTMLElement;
  private readonly _scoreDraw: HTMLElement;
  private readonly _gameMessage: HTMLElement;
  private readonly _thinkingIndicator: HTMLElement;
  private readonly _modeTag: HTMLElement;
  private readonly _sizeTag: HTMLElement;
  private readonly _winTag: HTMLElement;

  constructor(elements: StatusBarElements) {
    this._badgeX = elements.badgeX;
    this._badgeO = elements.badgeO;
    this._p1name = elements.p1name;
    this._p2name = elements.p2name;
    this._scoreX = elements.scoreX;
    this._scoreO = elements.scoreO;
    this._scoreDraw = elements.scoreDraw;
    this._gameMessage = elements.gameMessage;
    this._thinkingIndicator = elements.thinkingIndicator;
    this._modeTag = elements.modeTag;
    this._sizeTag = elements.sizeTag;
    this._winTag = elements.winTag;
  }

  updateBadges(state: GameState): void {
    const xActive = !state.gameOver && state.currentPlayer === 'X';
    const oActive = !state.gameOver && state.currentPlayer === 'O';
    this._badgeX.className = 'player-badge x' + (xActive ? ' active-x' : '');
    this._badgeO.className = 'player-badge o' + (oActive ? ' active-o' : '');
  }

  updateScores(scores: Scores): void {
    this._scoreX.textContent = String(scores.X);
    this._scoreO.textContent = String(scores.O);
    this._scoreDraw.textContent = String(scores.draw);
  }

  updatePlayerNames(state: GameState): void {
    if (state.mode === 'ai') {
      this._p1name.textContent = state.humanSide === 'X' ? 'You' : 'AI';
      this._p2name.textContent = state.humanSide === 'O' ? 'You' : 'AI';
    } else {
      this._p1name.textContent = 'Player 1';
      this._p2name.textContent = 'Player 2';
    }
  }

  updateInfoTags(state: GameState): void {
    this._modeTag.textContent = state.mode === 'ai' ? 'VS COMPUTER' : '2 PLAYER';
    this._sizeTag.textContent = `${state.cols} × ${state.rows}`;
    this._winTag.textContent = `${state.winLen} IN A ROW`;
  }

  setMessage(msg: string): void {
    this._gameMessage.textContent = msg;
  }

  setWinMessage(winner: Player, state: GameState): void {
    if (state.mode === 'ai') {
      this._gameMessage.textContent = winner === state.humanSide ? '🎉 YOU WIN!' : '🤖 AI WINS!';
    } else {
      this._gameMessage.textContent = winner === 'X' ? '✕ WINS!' : '○ WINS!';
    }
  }

  setThinking(visible: boolean): void {
    this._thinkingIndicator.classList.toggle('visible', visible);
  }
}
