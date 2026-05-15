import { useRef, useState } from 'react';
import { AIFactory, GameState, WinDetector } from '@tacfinity/shared';
import type { Cell, Difficulty, Player } from '@tacfinity/shared';
import { useBoardSettings } from './useBoardSettings';
import type { BotGamePhase } from '../types';

const AI_MOVE_DELAY_MS = 150;

export function useBotGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [humanSide, setHumanSide] = useState<Player>('X');
  const [phase, setPhase] = useState<BotGamePhase>('setup');
  const [board, setBoard] = useState<Cell[]>([]);
  const [winCells, setWinCells] = useState<number[]>([]);
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [drawDeclined, setDrawDeclined] = useState(false);

  const {
    cols,
    rows,
    winLen,
    handleColsChange,
    handleColsBlur,
    handleRowsChange,
    handleRowsBlur,
    handleWinLenChange,
    handleWinLenBlur,
    applyAndGet,
  } = useBoardSettings({ cols: 3, rows: 3, winLen: 3 });

  const gameStateRef = useRef<GameState | null>(null);
  const winDetectorRef = useRef(new WinDetector());

  function startGame(): void {
    const config = applyAndGet();
    const gameState = new GameState();
    gameState.configure({
      cols: config.cols,
      rows: config.rows,
      winLen: config.winLen,
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
    setWinner(humanSide === 'X' ? 'O' : 'X');
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
    humanSide,
    drawDeclined,
    cols,
    rows,
    winLen,
    handleColsChange,
    handleColsBlur,
    handleRowsChange,
    handleRowsBlur,
    handleWinLenChange,
    handleWinLenBlur,
    setDifficulty,
    setHumanSide,
    startGame,
    resetToSetup,
    handleCellClick,
    resign,
    offerDraw,
  };
}
