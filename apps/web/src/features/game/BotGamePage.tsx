import { useRef, useState } from 'react';
import { GameState, WinDetector, AIFactory } from '@tacfinity/shared';
import type { Cell, Difficulty, Player } from '@tacfinity/shared';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { useAuth } from '@/features/auth/useAuth';
import { PlayerLabel } from '@/shared/components/PlayerLabel';

type Phase = 'setup' | 'playing' | 'gameover';

const MIN_DIM = 3;
const MAX_DIM = 20;
const DEFAULT_COLS = 3;
const DEFAULT_ROWS = 3;
const DEFAULT_WIN_LEN = 3;

const BOT_META: Record<Difficulty, { name: string; rating: number }> = {
  easy: { name: 'EasyBot', rating: 500 },
  medium: { name: 'MediumBot', rating: 800 },
  hard: { name: 'HardBot', rating: 1200 },
};

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

function clampWinLen(w: number, cols: number, rows: number): number {
  return clamp(w, MIN_DIM, Math.min(cols, rows));
}

export function BotGamePage() {
  const { user } = useAuth();
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [cols, setCols] = useState(DEFAULT_COLS);
  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [winLen, setWinLen] = useState(DEFAULT_WIN_LEN);
  const [humanSide, setHumanSide] = useState<Player>('X');
  const [phase, setPhase] = useState<Phase>('setup');
  const [board, setBoard] = useState<Cell[]>([]);
  const [winCells, setWinCells] = useState<number[]>([]);
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [aiThinking, setAiThinking] = useState(false);

  const gsRef = useRef<GameState | null>(null);
  const wdRef = useRef(new WinDetector());

  const bot = BOT_META[difficulty];
  const aiSide: Player = humanSide === 'X' ? 'O' : 'X';

  function handleColsChange(val: string) {
    const n = Number(val);
    if (!isNaN(n)) setCols(n);
  }

  function handleColsBlur() {
    const next = clamp(cols, MIN_DIM, MAX_DIM);
    setCols(next);
    setWinLen((prev) => clampWinLen(prev, next, rows));
  }

  function handleRowsChange(val: string) {
    const n = Number(val);
    if (!isNaN(n)) setRows(n);
  }

  function handleRowsBlur() {
    const next = clamp(rows, MIN_DIM, MAX_DIM);
    setRows(next);
    setWinLen((prev) => clampWinLen(prev, cols, next));
  }

  function handleWinLenChange(val: string) {
    const n = Number(val);
    if (!isNaN(n)) setWinLen(n);
  }

  function handleWinLenBlur() {
    setWinLen(clampWinLen(winLen, cols, rows));
  }

  function startGame() {
    const safeCols = clamp(cols, MIN_DIM, MAX_DIM);
    const safeRows = clamp(rows, MIN_DIM, MAX_DIM);
    const safeWinLen = clampWinLen(winLen, safeCols, safeRows);
    setCols(safeCols);
    setRows(safeRows);
    setWinLen(safeWinLen);

    const gs = new GameState();
    gs.configure({
      cols: safeCols,
      rows: safeRows,
      winLen: safeWinLen,
      mode: 'ai',
      difficulty,
      humanSide,
    });
    gs.resetBoard();
    gsRef.current = gs;
    setBoard([...gs.board]);
    setWinCells([]);
    setWinner(null);
    setAiThinking(false);
    setPhase('playing');
  }

  function handleCellClick(idx: number) {
    const gs = gsRef.current;
    const wd = wdRef.current;
    if (!gs || phase !== 'playing' || board[idx] || gs.gameOver || aiThinking) return;

    gs.placeMove(idx, humanSide);
    setBoard([...gs.board]);

    const humanWin = wd.checkWin(gs.board, humanSide, gs.winLen, gs.cols, gs.rows);
    if (humanWin) {
      gs.gameOver = true;
      setWinCells(humanWin);
      setWinner(humanSide);
      setPhase('gameover');
      return;
    }
    if (wd.isDraw(gs.board)) {
      gs.gameOver = true;
      setWinner('draw');
      setPhase('gameover');
      return;
    }

    gs.switchPlayer();
    setAiThinking(true);

    setTimeout(() => {
      const ai = AIFactory.create(difficulty, gs, wd);
      const aiIdx = ai.getMove();
      gs.placeMove(aiIdx, aiSide);
      setBoard([...gs.board]);

      const aiWin = wd.checkWin(gs.board, aiSide, gs.winLen, gs.cols, gs.rows);
      if (aiWin) {
        gs.gameOver = true;
        setWinCells(aiWin);
        setWinner(aiSide);
        setPhase('gameover');
      } else if (wd.isDraw(gs.board)) {
        gs.gameOver = true;
        setWinner('draw');
        setPhase('gameover');
      } else {
        gs.switchPlayer();
      }
      setAiThinking(false);
    }, 150);
  }

  const statusText = (() => {
    if (phase === 'gameover') {
      if (winner === 'draw') return "It's a draw!";
      if (winner === humanSide) return 'You win!';
      return `${bot.name} wins!`;
    }
    if (aiThinking) return `${bot.name} is thinking…`;
    return 'Your turn';
  })();

  const isSetupDisabled = phase === 'playing';

  return (
    <div className="flex flex-col md:flex-row flex-1 h-full">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <PlayerLabel username={bot.name} rating={bot.rating} />

        {phase === 'setup' ? (
          <div className="border-2 border-dashed border-border rounded-lg w-75 h-75 flex items-center justify-center text-muted-foreground text-sm">
            Configure settings and start
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{statusText}</p>
            <GameBoard
              board={board}
              cols={cols}
              winCells={winCells}
              disabled={phase === 'gameover' || aiThinking}
              onCellClick={handleCellClick}
            />
          </>
        )}

        <PlayerLabel username={user?.username ?? 'You'} rating={1000} isMe />
      </div>

      <aside className="w-full md:w-64 md:shrink-0 border-t md:border-t-0 md:border-l flex flex-col justify-center gap-6 p-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold mb-1">Board</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Cols</Label>
              <Input
                type="number"
                value={cols}
                min={MIN_DIM}
                max={MAX_DIM}
                disabled={isSetupDisabled}
                onChange={(e) => handleColsChange(e.target.value)}
                onBlur={handleColsBlur}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Rows</Label>
              <Input
                type="number"
                value={rows}
                min={MIN_DIM}
                max={MAX_DIM}
                disabled={isSetupDisabled}
                onChange={(e) => handleRowsChange(e.target.value)}
                onBlur={handleRowsBlur}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Win</Label>
              <Input
                type="number"
                value={winLen}
                min={MIN_DIM}
                max={Math.min(cols, rows)}
                disabled={isSetupDisabled}
                onChange={(e) => handleWinLenChange(e.target.value)}
                onBlur={handleWinLenBlur}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold mb-1">Difficulty</p>
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
            <label
              key={d}
              className="flex items-center justify-between gap-3 px-3 py-2 rounded-md border cursor-pointer hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="difficulty"
                  value={d}
                  checked={difficulty === d}
                  disabled={isSetupDisabled}
                  onChange={() => setDifficulty(d)}
                  className="accent-primary"
                />
                <span className="text-sm font-medium capitalize">{d}</span>
              </div>
              <span className="text-xs text-muted-foreground">~{BOT_META[d].rating}</span>
            </label>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold mb-1">You play as</p>
          {(['X', 'O'] as Player[]).map((side) => (
            <label
              key={side}
              className="flex items-center gap-3 px-3 py-2 rounded-md border cursor-pointer hover:bg-accent transition-colors"
            >
              <input
                type="radio"
                name="humanSide"
                value={side}
                checked={humanSide === side}
                disabled={isSetupDisabled}
                onChange={() => setHumanSide(side)}
                className="accent-primary"
              />
              <span className="text-sm font-medium">
                {side} {side === 'X' ? '(goes first)' : '(goes second)'}
              </span>
            </label>
          ))}
        </div>

        <Button size="lg" className="w-full" onClick={startGame}>
          {phase === 'setup' ? 'Start Game' : 'New Game'}
        </Button>
      </aside>
    </div>
  );
}

function GameBoard({
  board,
  cols,
  winCells,
  disabled,
  onCellClick,
}: {
  board: Cell[];
  cols: number;
  winCells: number[];
  disabled: boolean;
  onCellClick: (idx: number) => void;
}) {
  const textSize = cols > 12 ? 'text-[10px]' : cols > 8 ? 'text-xs' : 'text-sm';

  return (
    <div
      className="border-2 border-border rounded-lg overflow-hidden"
      style={{
        maxWidth: 'min(90vw, 580px)',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
      }}
    >
      {board.map((cell, idx) => {
        const isWin = winCells.includes(idx);
        return (
          <button
            key={idx}
            onClick={() => onCellClick(idx)}
            disabled={disabled || !!cell}
            aria-label={cell ? `Cell ${idx}: ${cell}` : `Cell ${idx}: empty`}
            className={[
              'aspect-square flex items-center justify-center font-bold transition-colors border border-border/40',
              textSize,
              isWin ? 'bg-primary/20' : '',
              !cell && !disabled ? 'hover:bg-accent cursor-pointer' : 'cursor-default',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {cell && (
              <span
                className={cell === 'X' ? 'text-(--color-player-x)' : 'text-(--color-player-o)'}
              >
                {cell}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
