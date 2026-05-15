import type { Cell } from '@tacfinity/shared';

interface GameBoardProps {
  board: Cell[];
  winCells: number[];
  isDisabled: boolean;
  onCellClick: (index: number) => void;
}

export function GameBoard({ board, winCells, isDisabled, onCellClick }: GameBoardProps) {
  return (
    <div
      role="grid"
      aria-label="Game board"
      className="border border-border rounded-lg overflow-hidden w-full"
      style={{
        maxWidth: 'min(90vw, 580px)',
        display: 'grid',
        gridTemplateColumns: 'repeat(11, 1fr)',
      }}
    >
      {board.map((cell, index) => {
        const isWinCell = winCells.includes(index);
        const isEmpty = !cell;
        const isClickable = isEmpty && !isDisabled;

        return (
          <button
            key={index}
            type="button"
            aria-label={cell ? `Cell ${index}: ${cell}` : `Cell ${index}: empty`}
            onClick={() => onCellClick(index)}
            disabled={isDisabled || !isEmpty}
            className={[
              'aspect-square flex items-center justify-center',
              'border-r border-b border-border/40 transition-colors',
              isWinCell ? 'bg-player-win/15' : '',
              isClickable ? 'hover:bg-accent cursor-pointer' : 'cursor-default',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {cell === 'X' && (
              <span className="text-(--color-player-x) text-sm font-bold leading-none">X</span>
            )}
            {cell === 'O' && (
              <span className="text-(--color-player-o) text-sm font-bold leading-none">O</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
