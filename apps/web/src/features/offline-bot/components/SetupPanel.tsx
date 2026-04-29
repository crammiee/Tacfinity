import { useState } from 'react';
import { Button } from '../../../shared/ui/button';
import type { Difficulty, GameMode, GameSettings, Player } from '@tacfinity/shared';

interface SetupPanelProps {
  onStart: (settings: GameSettings) => void;
}

const MIN_DIMENSION = 3;
const MAX_DIMENSION = 20;
const DEFAULT_COLS = 3;
const DEFAULT_ROWS = 3;
const DEFAULT_WIN_LEN = 3;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function clampWinLen(winLen: number, cols: number, rows: number): number {
  return clamp(winLen, MIN_DIMENSION, Math.min(cols, rows));
}

export function SetupPanel({ onStart }: SetupPanelProps) {
  const [cols, setCols] = useState(DEFAULT_COLS);
  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [winLen, setWinLen] = useState(DEFAULT_WIN_LEN);
  const [mode, setMode] = useState<GameMode>('2p');
  const [difficulty, setDifficulty] = useState<Difficulty>('hard');
  const [humanSide, setHumanSide] = useState<Player>('X');

  const handleColsChange = (raw: number) => {
    const next = clamp(raw, MIN_DIMENSION, MAX_DIMENSION);
    setCols(next);
    setWinLen((prev) => clampWinLen(prev, next, rows));
  };

  const handleRowsChange = (raw: number) => {
    const next = clamp(raw, MIN_DIMENSION, MAX_DIMENSION);
    setRows(next);
    setWinLen((prev) => clampWinLen(prev, cols, next));
  };

  const handleWinLenChange = (raw: number) => {
    setWinLen(clampWinLen(raw, cols, rows));
  };

  const handleSubmit = () => {
    onStart({ cols, rows, winLen, mode, difficulty, humanSide });
  };

  const labelClass = 'block text-sm font-medium text-slate-300 mb-1';
  const inputClass =
    'w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500';
  const selectClass = inputClass;

  return (
    <div className="w-full max-w-sm mx-auto rounded-xl border border-slate-700 bg-slate-900 p-6 space-y-5">
      <h2 className="text-xl font-bold text-slate-100 tracking-tight">New Game</h2>

      <div>
        <label className={labelClass}>Mode</label>
        <select
          className={selectClass}
          value={mode}
          onChange={(e) => setMode(e.target.value as GameMode)}
        >
          <option value="2p">2 Players</option>
          <option value="ai">vs AI</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>Columns</label>
          <input
            type="number"
            className={inputClass}
            value={cols}
            min={MIN_DIMENSION}
            max={MAX_DIMENSION}
            onChange={(e) => handleColsChange(Number(e.target.value))}
          />
        </div>
        <div>
          <label className={labelClass}>Rows</label>
          <input
            type="number"
            className={inputClass}
            value={rows}
            min={MIN_DIMENSION}
            max={MAX_DIMENSION}
            onChange={(e) => handleRowsChange(Number(e.target.value))}
          />
        </div>
        <div>
          <label className={labelClass}>Win length</label>
          <input
            type="number"
            className={inputClass}
            value={winLen}
            min={MIN_DIMENSION}
            max={Math.min(cols, rows)}
            onChange={(e) => handleWinLenChange(Number(e.target.value))}
          />
        </div>
      </div>

      {mode === 'ai' && (
        <>
          <div>
            <label className={labelClass}>Difficulty</label>
            <select
              className={selectClass}
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>You play as</label>
            <select
              className={selectClass}
              value={humanSide}
              onChange={(e) => setHumanSide(e.target.value as Player)}
            >
              <option value="X">X (goes first)</option>
              <option value="O">O (goes second)</option>
            </select>
          </div>
        </>
      )}

      <Button className="w-full" onClick={handleSubmit}>
        Start Game
      </Button>
    </div>
  );
}
