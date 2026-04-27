import './styles/variables.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/animations.css';

import { Board } from './components/Board';
import { SetupPanel } from './components/SetupPanel';
import { StatusBar } from './components/StatusBar';
import { GameController } from './game/GameController';
import { GameState } from './game/GameState';
import { WinDetector } from './game/WinDetector';

function getElement<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id) as T | null;
  if (!el) throw new Error(`Element #${id} not found in DOM`);
  return el;
}

document.addEventListener('DOMContentLoaded', () => {
  const gameState = new GameState();
  const winDetector = new WinDetector();

  const boardComponent = new Board(getElement('board'));

  const statusBar = new StatusBar({
    badgeX: getElement('badgeX'),
    badgeO: getElement('badgeO'),
    p1name: getElement('p1name'),
    p2name: getElement('p2name'),
    scoreX: getElement('scoreX'),
    scoreO: getElement('scoreO'),
    scoreDraw: getElement('scoreDraw'),
    gameMessage: getElement('gameMessage'),
    thinkingIndicator: getElement('thinkingIndicator'),
    modeTag: getElement('modeTag'),
    sizeTag: getElement('sizeTag'),
    winTag: getElement('winTag'),
  });

  const setupPanel = new SetupPanel({
    mode2pBtn: getElement<HTMLButtonElement>('mode2p'),
    modeAIBtn: getElement<HTMLButtonElement>('modeAI'),
    colsInput: getElement<HTMLInputElement>('colsInput'),
    rowsInput: getElement<HTMLInputElement>('rowsInput'),
    winInput: getElement<HTMLInputElement>('winInput'),
    diffSelect: getElement<HTMLSelectElement>('diffSelect'),
    sideSelect: getElement<HTMLSelectElement>('sideSelect'),
    aiGroup: getElement('aiGroup'),
    sideGroup: getElement('sideGroup'),
  });

  const gameController = new GameController({
    gameState,
    boardComponent,
    statusBar,
    setupPanel,
    winDetector,
  });

  boardComponent.setClickHandler((idx) => gameController.handleCellClick(idx));

  getElement<HTMLButtonElement>('startBtn').addEventListener('click', () => {
    gameController.startGame(setupPanel.getSettings());
  });

  getElement<HTMLButtonElement>('newRoundBtn').addEventListener('click', () => {
    gameController.resetBoard();
  });

  getElement<HTMLButtonElement>('resetAllBtn').addEventListener('click', () => {
    gameController.resetAll();
  });

  gameController.startGame(setupPanel.getSettings());
});
