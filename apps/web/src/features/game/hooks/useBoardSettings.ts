import { useState } from 'react';

export const MIN_DIM = 3;
export const MAX_DIM = 20;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function clampWinLen(winLen: number, cols: number, rows: number): number {
  return clamp(winLen, MIN_DIM, Math.min(cols, rows));
}

interface Defaults {
  cols: number;
  rows: number;
  winLen: number;
}

export function useBoardSettings({
  cols: defaultCols,
  rows: defaultRows,
  winLen: defaultWinLen,
}: Defaults) {
  const [cols, setCols] = useState(defaultCols);
  const [rows, setRows] = useState(defaultRows);
  const [winLen, setWinLen] = useState(defaultWinLen);

  function handleColsChange(val: string): void {
    const parsed = Number(val);
    if (!isNaN(parsed)) setCols(parsed);
  }

  function handleColsBlur(): void {
    const next = clamp(cols, MIN_DIM, MAX_DIM);
    setCols(next);
    setWinLen((prev) => clampWinLen(prev, next, rows));
  }

  function handleRowsChange(val: string): void {
    const parsed = Number(val);
    if (!isNaN(parsed)) setRows(parsed);
  }

  function handleRowsBlur(): void {
    const next = clamp(rows, MIN_DIM, MAX_DIM);
    setRows(next);
    setWinLen((prev) => clampWinLen(prev, cols, next));
  }

  function handleWinLenChange(val: string): void {
    const parsed = Number(val);
    if (!isNaN(parsed)) setWinLen(parsed);
  }

  function handleWinLenBlur(): void {
    setWinLen(clampWinLen(winLen, cols, rows));
  }

  function applyAndGet(): { cols: number; rows: number; winLen: number } {
    const safeCols = clamp(cols, MIN_DIM, MAX_DIM);
    const safeRows = clamp(rows, MIN_DIM, MAX_DIM);
    const safeWinLen = clampWinLen(winLen, safeCols, safeRows);
    setCols(safeCols);
    setRows(safeRows);
    setWinLen(safeWinLen);
    return { cols: safeCols, rows: safeRows, winLen: safeWinLen };
  }

  return {
    cols,
    rows,
    winLen,
    handleColsChange,
    handleColsBlur,
    handleRowsChange,
    handleRowsBlur,
    handleWinLenChange,
    handleWinLenBlur,
    applyAndGet,
  };
}
