import type { Cell } from '@tacfinity/shared';
import { GameCell } from './GameCell';

interface GameBoardProps {
  board: Cell[];
  cols: number;
  winningCells: number[];
  isDisabled: boolean;
  onCellClick: (idx: number) => void;
}

export function GameBoard({ board, cols, winningCells, isDisabled, onCellClick }: GameBoardProps) {
  const winCellSet = new Set(winningCells);

  return (
    <div
      className="grid gap-1 w-fit mx-auto"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      role="grid"
      aria-label="Game board"
    >
      {board.map((cell, idx) => (
        <GameCell
          key={idx}
          value={cell}
          index={idx}
          isWinCell={winCellSet.has(idx)}
          isDisabled={isDisabled}
          onClick={onCellClick}
        />
      ))}
    </div>
  );
}
