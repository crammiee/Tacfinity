import { useRef, useState } from 'react';
import { GameState, WinDetector, AIFactory } from '@tacfinity/shared';
import type { Cell, Difficulty, Player } from '@tacfinity/shared';
import { Button } from '@/shared/ui/button';
import { useAuth } from '@/features/auth/useAuth';

type Phase = 'setup' | 'playing' | 'gameover';

const BOARD_SIZE = 3;
const WIN_LEN = 3;

const BOT_META: Record<Difficulty, { name: string; rating: number }> = {
  easy: { name: 'EasyBot', rating: 500 },
  medium: { name: 'MediumBot', rating: 800 },
  hard: { name: 'HardBot', rating: 1200 },
};

export function BotGamePage() {
  const { user } = useAuth();
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [phase, setPhase] = useState<Phase>('setup');
  const [board, setBoard] = useState<Cell[]>([]);
  const [winCells, setWinCells] = useState<number[]>([]);
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [aiThinking, setAiThinking] = useState(false);

  const gsRef = useRef<GameState | null>(null);
  const wdRef = useRef(new WinDetector());

  const bot = BOT_META[difficulty];

  function startGame() {
    const gs = new GameState();
    gs.configure({
      cols: BOARD_SIZE,
      rows: BOARD_SIZE,
      winLen: WIN_LEN,
      mode: 'ai',
      difficulty,
      humanSide: 'X',
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

    gs.placeMove(idx, 'X');
    setBoard([...gs.board]);

    const humanWin = wd.checkWin(gs.board, 'X', gs.winLen, gs.cols, gs.rows);
    if (humanWin) {
      gs.gameOver = true;
      setWinCells(humanWin);
      setWinner('X');
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
      gs.placeMove(aiIdx, 'O');
      setBoard([...gs.board]);

      const aiWin = wd.checkWin(gs.board, 'O', gs.winLen, gs.cols, gs.rows);
      if (aiWin) {
        gs.gameOver = true;
        setWinCells(aiWin);
        setWinner('O');
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
      if (winner === 'X') return 'You win!';
      return `${bot.name} wins!`;
    }
    if (aiThinking) return `${bot.name} is thinking…`;
    return 'Your turn';
  })();

  return (
    <div className="flex flex-1 h-full">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <PlayerLabel username={bot.name} rating={bot.rating} />

        {phase === 'setup' ? (
          <div className="border-2 border-dashed border-border rounded-lg w-[300px] h-[300px] flex items-center justify-center text-muted-foreground text-sm">
            Select difficulty and start
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{statusText}</p>
            <GameBoard
              board={board}
              cols={BOARD_SIZE}
              winCells={winCells}
              disabled={phase === 'gameover' || aiThinking}
              onCellClick={handleCellClick}
            />
          </>
        )}

        <PlayerLabel username={user?.username ?? 'You'} rating={1000} isMe />
      </div>

      <aside className="w-64 shrink-0 border-l flex flex-col justify-center gap-6 p-6">
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
                  onChange={() => setDifficulty(d)}
                  className="accent-primary"
                />
                <span className="text-sm font-medium capitalize">{d}</span>
              </div>
              <span className="text-xs text-muted-foreground">~{BOT_META[d].rating}</span>
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

function PlayerLabel({
  username,
  rating,
  isMe = false,
}: {
  username: string;
  rating: number;
  isMe?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-sm w-full max-w-[300px]">
      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold uppercase">
        {username[0]}
      </div>
      <span className={`font-medium ${isMe ? '' : 'text-muted-foreground'}`}>{username}</span>
      <span className="ml-auto text-muted-foreground">♟ {rating.toLocaleString()}</span>
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
  const cellSize = 100;
  const size = cols * cellSize;

  return (
    <div
      className="border-2 border-border rounded-lg overflow-hidden"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        width: size,
        height: size,
      }}
    >
      {board.map((cell, idx) => {
        const isWin = winCells.includes(idx);
        return (
          <button
            key={idx}
            onClick={() => onCellClick(idx)}
            disabled={disabled || !!cell}
            className={[
              'flex items-center justify-center text-3xl font-bold transition-colors border border-border/40',
              isWin ? 'bg-primary/20' : 'hover:bg-accent',
              !cell && !disabled ? 'cursor-pointer' : 'cursor-default',
            ].join(' ')}
            style={{ width: cellSize, height: cellSize }}
          >
            {cell && (
              <span className={cell === 'X' ? 'text-blue-500' : 'text-red-500'}>{cell}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
