import type { Cell } from '@tacfinity/shared';

interface GameCellProps {
  value: Cell;
  index: number;
  cellSize: number;
  isWinCell: boolean;
  isDisabled: boolean;
  onClick: (idx: number) => void;
}

const SYMBOL_COLOR: Record<string, string> = {
  X: '#38bdf8',
  O: '#fb7185',
};

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

  const backgroundColor = isWinCell ? 'rgba(250, 204, 21, 0.15)' : '#1e293b';
  const borderColor = isWinCell ? 'rgba(250, 204, 21, 0.4)' : '#334155';
  const color = value !== null ? SYMBOL_COLOR[value] : 'transparent';
  const cursor = isDisabled || value !== null ? 'default' : 'pointer';
  const fontSize = cellSize > 48 ? '1.5rem' : cellSize > 32 ? '1.125rem' : '0.875rem';

  return (
    <button
      type="button"
      aria-label={`Cell ${index + 1}${value !== null ? `, ${value}` : ', empty'}`}
      onClick={handleClick}
      disabled={isDisabled && value === null}
      style={{
        width: `${cellSize}px`,
        height: `${cellSize}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `1px solid ${borderColor}`,
        borderRadius: '6px',
        backgroundColor,
        color,
        fontSize,
        fontWeight: 'bold',
        cursor,
        transition: 'background-color 0.1s',
        userSelect: 'none',
      }}
    >
      {value}
    </button>
  );
}
