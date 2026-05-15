import type { Cell } from '@tacfinity/shared';

interface Props {
  board: Cell[];
  cols?: number;
  winCells: number[];
  disabled: boolean;
  onCellClick: (index: number) => void;
}

export function GameBoard({ board, cols = 11, winCells, disabled, onCellClick }: Props) {
  const rows = Math.ceil(board.length / cols);
  const textSize = cols > 12 ? 'text-[10px]' : cols > 8 ? 'text-xs' : 'text-sm';

  // Cell size = the smaller of (max board width / cols) and (max board height / rows).
  // This keeps cells square and the board visible without scrolling in both directions.
  const cellSize = `min(calc(min(90vw, 580px) / ${cols}), calc(min(60vh, 560px) / ${rows}))`;

  return (
    <div
      className="border-2 border-border rounded-lg overflow-hidden self-center"
      style={{
        width: 'fit-content',
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${cellSize})`,
        gridTemplateRows: `repeat(${rows}, ${cellSize})`,
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
              'flex items-center justify-center font-bold transition-colors border border-border/40',
              textSize,
              isWinCell ? 'bg-primary/20' : '',
              isClickable ? 'hover:bg-accent cursor-pointer' : 'cursor-default',
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
