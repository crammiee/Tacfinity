import { useRef, useState } from 'react';
import { AIFactory, GameState, WinDetector } from '@tacfinity/shared';
import type { Cell, Difficulty, Player } from '@tacfinity/shared';

export const MIN_DIM = 3;
export const MAX_DIM = 20;

const DEFAULT_COLS = 3;
const DEFAULT_ROWS = 3;
const DEFAULT_WIN_LEN = 3;
const AI_MOVE_DELAY_MS = 150;

export type BotGamePhase = 'setup' | 'playing' | 'gameover';

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function clampWinLen(winLen: number, cols: number, rows: number): number {
  return clamp(winLen, MIN_DIM, Math.min(cols, rows));
}

export interface BotGameState {
  phase: BotGamePhase;
  board: Cell[];
  winCells: number[];
  winner: Player | 'draw' | null;
  isAiThinking: boolean;
  difficulty: Difficulty;
  cols: number;
  rows: number;
  winLen: number;
  humanSide: Player;
  drawDeclined: boolean;
}

export interface BotGameActions {
  setDifficulty: (difficulty: Difficulty) => void;
  setHumanSide: (side: Player) => void;
  handleColsChange: (val: string) => void;
  handleColsBlur: () => void;
  handleRowsChange: (val: string) => void;
  handleRowsBlur: () => void;
  handleWinLenChange: (val: string) => void;
  handleWinLenBlur: () => void;
  startGame: () => void;
  resetToSetup: () => void;
  handleCellClick: (idx: number) => void;
  resign: () => void;
  offerDraw: () => void;
}

export function useBotGame(): BotGameState & BotGameActions {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [cols, setCols] = useState(DEFAULT_COLS);
  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [winLen, setWinLen] = useState(DEFAULT_WIN_LEN);
  const [humanSide, setHumanSide] = useState<Player>('X');
  const [phase, setPhase] = useState<BotGamePhase>('setup');
  const [board, setBoard] = useState<Cell[]>([]);
  const [winCells, setWinCells] = useState<number[]>([]);
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);

  const [drawDeclined, setDrawDeclined] = useState(false);

  const gameStateRef = useRef<GameState | null>(null);
  const winDetectorRef = useRef(new WinDetector());

  function handleColsChange(val: string): void {
    const parsed = Number(val);
    if (!isNaN(parsed)) setCols(parsed);
  }

  function handleColsBlur(): void {
    const next = clamp(cols, MIN_DIM, MAX_DIM);
    setCols(next);
    setWinLen((prev) => clampWinLen(prev, next, rows));
  }

  function handleRowsChange(val: string): void {
    const parsed = Number(val);
    if (!isNaN(parsed)) setRows(parsed);
  }

  function handleRowsBlur(): void {
    const next = clamp(rows, MIN_DIM, MAX_DIM);
    setRows(next);
    setWinLen((prev) => clampWinLen(prev, cols, next));
  }

  function handleWinLenChange(val: string): void {
    const parsed = Number(val);
    if (!isNaN(parsed)) setWinLen(parsed);
  }

  function handleWinLenBlur(): void {
    setWinLen(clampWinLen(winLen, cols, rows));
  }

  function startGame(): void {
    const safeCols = clamp(cols, MIN_DIM, MAX_DIM);
    const safeRows = clamp(rows, MIN_DIM, MAX_DIM);
    const safeWinLen = clampWinLen(winLen, safeCols, safeRows);
    setCols(safeCols);
    setRows(safeRows);
    setWinLen(safeWinLen);

    const gameState = new GameState();
    gameState.configure({
      cols: safeCols,
      rows: safeRows,
      winLen: safeWinLen,
      mode: 'ai',
      difficulty,
      humanSide,
    });
    gameState.resetBoard();
    gameStateRef.current = gameState;

    setBoard([...gameState.board]);
    setWinCells([]);
    setWinner(null);
    setIsAiThinking(false);
    setPhase('playing');
  }

  function doAiMove(gameState: GameState): void {
    const winDetector = winDetectorRef.current;
    const ai = AIFactory.create(difficulty, gameState, winDetector);
    const aiIdx = ai.getMove();

    gameState.placeMove(aiIdx, gameState.aiSide);
    setBoard([...gameState.board]);

    const aiWin = winDetector.checkWin(
      gameState.board,
      gameState.aiSide,
      gameState.winLen,
      gameState.cols,
      gameState.rows
    );
    if (aiWin) {
      gameState.gameOver = true;
      setWinCells(aiWin);
      setWinner(gameState.aiSide);
      setPhase('gameover');
    } else if (winDetector.isDraw(gameState.board)) {
      gameState.gameOver = true;
      setWinner('draw');
      setPhase('gameover');
    } else {
      gameState.switchPlayer();
    }
    setIsAiThinking(false);
  }

  function handleCellClick(idx: number): void {
    const gameState = gameStateRef.current;
    const winDetector = winDetectorRef.current;
    if (!gameState || phase !== 'playing' || board[idx] || gameState.gameOver || isAiThinking)
      return;

    gameState.placeMove(idx, gameState.humanSide);
    setBoard([...gameState.board]);

    const humanWin = winDetector.checkWin(
      gameState.board,
      gameState.humanSide,
      gameState.winLen,
      gameState.cols,
      gameState.rows
    );
    if (humanWin) {
      gameState.gameOver = true;
      setWinCells(humanWin);
      setWinner(gameState.humanSide);
      setPhase('gameover');
      return;
    }
    if (winDetector.isDraw(gameState.board)) {
      gameState.gameOver = true;
      setWinner('draw');
      setPhase('gameover');
      return;
    }

    gameState.switchPlayer();
    setIsAiThinking(true);
    setTimeout(() => doAiMove(gameState), AI_MOVE_DELAY_MS);
  }

  function resetToSetup(): void {
    setPhase('setup');
  }

  function resign(): void {
    const gameState = gameStateRef.current;
    if (!gameState || phase !== 'playing') return;
    gameState.gameOver = true;
    const botSide: Player = humanSide === 'X' ? 'O' : 'X';
    setWinner(botSide);
    setPhase('gameover');
  }

  function offerDraw(): void {
    if (phase !== 'playing') return;
    setDrawDeclined(true);
    setTimeout(() => setDrawDeclined(false), 3000);
  }

  return {
    phase,
    board,
    winCells,
    winner,
    isAiThinking,
    difficulty,
    cols,
    rows,
    winLen,
    humanSide,
    drawDeclined,
    setDifficulty,
    setHumanSide,
    handleColsChange,
    handleColsBlur,
    handleRowsChange,
    handleRowsBlur,
    handleWinLenChange,
    handleWinLenBlur,
    startGame,
    resetToSetup,
    handleCellClick,
    resign,
    offerDraw,
  };
}
