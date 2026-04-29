import type { Cell } from '@tacfinity/shared';
import { GameCell } from './GameCell';

interface GameBoardProps {
  board: Cell[];
  cols: number;
  rows: number;
  winningCells: number[];
  isDisabled: boolean;
  onCellClick: (idx: number) => void;
}

const MAX_BOARD_PX = 480;
const GAP_PX = 4;

function calcCellSize(cols: number, rows: number): number {
  const maxDim = Math.max(cols, rows);
  const available = MAX_BOARD_PX - GAP_PX * (maxDim - 1);
  return Math.floor(available / maxDim);
}

export function GameBoard({
  board,
  cols,
  rows,
  winningCells,
  isDisabled,
  onCellClick,
}: GameBoardProps) {
  const winCellSet = new Set(winningCells);
  const cellSize = calcCellSize(cols, rows);
  const boardWidth = cellSize * cols + GAP_PX * (cols - 1);

  return (
    <div
      role="grid"
      aria-label="Game board"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        gap: `${GAP_PX}px`,
        width: `${boardWidth}px`,
      }}
    >
      {board.map((cell, idx) => (
        <GameCell
          key={idx}
          value={cell}
          index={idx}
          cellSize={cellSize}
          isWinCell={winCellSet.has(idx)}
          isDisabled={isDisabled}
          onClick={onCellClick}
        />
      ))}
    </div>
  );
}
