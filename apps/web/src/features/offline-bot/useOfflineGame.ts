import { useCallback, useRef, useState } from 'react';
import { AIFactory, GameState, WinDetector } from '@tacfinity/shared';
import type { AIPlayer } from '@tacfinity/shared';
import type { Cell, GameSettings, Player, Scores } from '@tacfinity/shared';

export interface OfflineGameState {
  board: Cell[];
  currentPlayer: Player;
  isGameOver: boolean;
  winner: Player | null;
  isDraw: boolean;
  winningCells: number[];
  scores: Scores;
  settings: GameSettings | null;
  isAiThinking: boolean;
}

export interface OfflineGameActions {
  handleCellClick: (idx: number) => void;
  startGame: (settings: GameSettings) => void;
  resetBoard: () => void;
  resetAll: () => void;
}

const AI_MOVE_DELAY_MS = 200;
const AI_FIRST_MOVE_DELAY_MS = 400;

export function useOfflineGame(): OfflineGameState & OfflineGameActions {
  const gsRef = useRef(new GameState());
  const wdRef = useRef(new WinDetector());
  const aiRef = useRef<AIPlayer | null>(null);

  const [board, setBoard] = useState<Cell[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [isDraw, setIsDraw] = useState(false);
  const [winningCells, setWinningCells] = useState<number[]>([]);
  const [scores, setScores] = useState<Scores>({ X: 0, O: 0, draw: 0 });
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);

  const endGame = useCallback((gameWinner: Player | null, cells: number[] = []): void => {
    const gs = gsRef.current;
    gs.gameOver = true;

    if (gameWinner !== null) {
      gs.scores[gameWinner]++;
      setWinner(gameWinner);
      setWinningCells(cells);
    } else {
      gs.scores.draw++;
      setIsDraw(true);
    }

    setIsGameOver(true);
    setIsAiThinking(false);
    setScores({ ...gs.scores });
  }, []);

  const doAiMove = useCallback((): void => {
    const gs = gsRef.current;
    const wd = wdRef.current;
    const ai = aiRef.current;

    if (gs.gameOver || ai === null) return;

    const idx = ai.getMove();
    setIsAiThinking(false);

    if (idx < 0) return;

    gs.placeMove(idx, gs.aiSide);
    setBoard([...gs.board]);

    const winCells = wd.checkWin(gs.board, gs.aiSide, gs.winLen, gs.cols, gs.rows);
    if (winCells !== null) {
      endGame(gs.aiSide, winCells);
      return;
    }

    if (wd.isDraw(gs.board)) {
      endGame(null);
      return;
    }

    gs.currentPlayer = gs.humanSide;
    setCurrentPlayer(gs.humanSide);
  }, [endGame]);

  const resetBoard = useCallback((): void => {
    const gs = gsRef.current;
    gs.resetBoard();

    setBoard([...gs.board]);
    setCurrentPlayer(gs.currentPlayer);
    setIsGameOver(false);
    setWinner(null);
    setIsDraw(false);
    setWinningCells([]);
    setIsAiThinking(false);

    if (gs.mode === 'ai' && gs.aiSide === 'X') {
      setIsAiThinking(true);
      setTimeout(doAiMove, AI_FIRST_MOVE_DELAY_MS);
    }
  }, [doAiMove]);

  const startGame = useCallback(
    (newSettings: GameSettings) => {
      const gs = gsRef.current;
      const wd = wdRef.current;

      gs.configure(newSettings);
      gs.resetScores();

      aiRef.current =
        newSettings.mode === 'ai' ? AIFactory.create(newSettings.difficulty, gs, wd) : null;

      setSettings(newSettings);
      setScores({ ...gs.scores });
      resetBoard();
    },
    [resetBoard]
  );

  const resetAll = useCallback(() => {
    const gs = gsRef.current;
    gs.resetScores();
    setScores({ ...gs.scores });
    resetBoard();
  }, [resetBoard]);

  const handleCellClick = useCallback(
    (idx: number) => {
      const gs = gsRef.current;
      const wd = wdRef.current;

      if (gs.gameOver) return;
      if (gs.board[idx] !== null) return;
      if (gs.mode === 'ai' && gs.currentPlayer === gs.aiSide) return;

      gs.placeMove(idx, gs.currentPlayer);
      setBoard([...gs.board]);

      const winCells = wd.checkWin(gs.board, gs.currentPlayer, gs.winLen, gs.cols, gs.rows);
      if (winCells !== null) {
        endGame(gs.currentPlayer, winCells);
        return;
      }

      if (wd.isDraw(gs.board)) {
        endGame(null);
        return;
      }

      gs.switchPlayer();
      setCurrentPlayer(gs.currentPlayer);

      if (gs.mode === 'ai') {
        setIsAiThinking(true);
        setTimeout(doAiMove, AI_MOVE_DELAY_MS);
      }
    },
    [endGame, doAiMove]
  );

  console.log('settings:', settings, 'board length:', board.length);
  return {
    board,
    currentPlayer,
    isGameOver,
    winner,
    isDraw,
    winningCells,
    scores,
    settings,
    isAiThinking,
    handleCellClick,
    startGame,
    resetBoard,
    resetAll,
  };
}
