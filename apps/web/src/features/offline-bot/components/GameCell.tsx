import type { Cell } from '@tacfinity/shared';

interface GameCellProps {
  value: Cell;
  index: number;
  isWinCell: boolean;
  isDisabled: boolean;
  onClick: (idx: number) => void;
}

const SYMBOL_CLASSES: Record<string, string> = {
  X: 'text-sky-400',
  O: 'text-rose-400',
};

export function GameCell({ value, index, isWinCell, isDisabled, onClick }: GameCellProps) {
  const handleClick = () => {
    if (!isDisabled && value === null) {
      onClick(index);
    }
  };

  const baseClasses =
    'flex items-center justify-center border border-slate-700 text-2xl font-bold select-none transition-colors duration-150';
  const backgroundClass = isWinCell ? 'bg-yellow-200/20' : 'bg-slate-800 hover:bg-slate-700';
  const cursorClass = isDisabled || value !== null ? 'cursor-default' : 'cursor-pointer';
  const symbolClass = value !== null ? SYMBOL_CLASSES[value] : '';

  return (
    <button
      type="button"
      aria-label={`Cell ${index}, ${value ?? 'empty'}`}
      className={`${baseClasses} ${backgroundClass} ${cursorClass} ${symbolClass}`}
      onClick={handleClick}
      disabled={isDisabled}
    >
      {value}
    </button>
  );
}
