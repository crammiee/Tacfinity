import type { Cell } from '@tacfinity/shared';
import { cn } from '@/shared/lib/utils';

interface GameCellProps {
  value: Cell;
  index: number;
  cellSize: number;
  isWinCell: boolean;
  isDisabled: boolean;
  onClick: (idx: number) => void;
}

export function GameCell({
  value,
  index,
  cellSize,
  isWinCell,
  isDisabled,
  onClick,
}: GameCellProps) {
  const handleClick = (): void => {
    if (!isDisabled && value === null) onClick(index);
  };

  const fontSize = cellSize > 48 ? '1.5rem' : cellSize > 32 ? '1.125rem' : '0.875rem';

  return (
    <button
      type="button"
      aria-label={`Cell ${index + 1}${value !== null ? `, ${value}` : ', empty'}`}
      onClick={handleClick}
      disabled={isDisabled && value === null}
      style={{ width: `${cellSize}px`, height: `${cellSize}px`, fontSize }}
      className={cn(
        'flex items-center justify-center border rounded-md font-bold transition-colors select-none',
        isWinCell ? 'bg-yellow-400/15 border-yellow-400/40' : 'bg-secondary border-border',
        value === 'X' && 'text-player-x',
        value === 'O' && 'text-player-o',
        value === null && 'text-transparent',
        isDisabled || value !== null ? 'cursor-default' : 'cursor-pointer'
      )}
    >
      {value}
    </button>
  );
}
