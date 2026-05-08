import type { Cell } from '@tacfinity/shared';

interface Props {
  board: Cell[];
  winCells: number[];
  disabled: boolean;
  onCellClick: (index: number) => void;
}

export function GameBoard({ board, winCells, disabled, onCellClick }: Props) {
  return (
    <div
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
        const isClickable = isEmpty && !disabled;

        return (
          <button
            key={index}
            type="button"
            aria-label={cell ? `Cell ${index}: ${cell}` : `Cell ${index}: empty`}
            onClick={() => onCellClick(index)}
            disabled={disabled || !isEmpty}
            className={[
              'aspect-square flex items-center justify-center',
              'border-r border-b border-border/40 transition-colors',
              isWinCell ? 'bg-primary/20' : '',
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
