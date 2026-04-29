import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
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

  const handleColsChange = (val: string) => {
    const next = clamp(Number(val), MIN_DIMENSION, MAX_DIMENSION);
    setCols(next);
    setWinLen((prev) => clampWinLen(prev, next, rows));
  };

  const handleRowsChange = (val: string) => {
    const next = clamp(Number(val), MIN_DIMENSION, MAX_DIMENSION);
    setRows(next);
    setWinLen((prev) => clampWinLen(prev, cols, next));
  };

  const handleWinLenChange = (val: string) => {
    setWinLen(clampWinLen(Number(val), cols, rows));
  };

  const handleSubmit = () => {
    onStart({ cols, rows, winLen, mode, difficulty, humanSide });
  };

  return (
    <div className="w-full max-w-sm mx-auto rounded-xl border border-border bg-card p-6 space-y-5">
      <h2 className="text-xl font-bold text-foreground tracking-tight">New Game</h2>

      <div className="space-y-2">
        <Label className="text-muted-foreground">Mode</Label>
        <Select value={mode} onValueChange={(v) => setMode(v as GameMode)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2p">2 Players</SelectItem>
            <SelectItem value="ai">vs AI</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label className="text-muted-foreground">Columns</Label>
          <Input type="number" value={cols} onChange={(e) => handleColsChange(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label className="text-muted-foreground">Rows</Label>
          <Input type="number" value={rows} onChange={(e) => handleRowsChange(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label className="text-muted-foreground">Win len</Label>
          <Input
            type="number"
            value={winLen}
            onChange={(e) => handleWinLenChange(e.target.value)}
          />
        </div>
      </div>

      {mode === 'ai' && (
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Difficulty</Label>
            <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">You play as</Label>
            <Select value={humanSide} onValueChange={(v) => setHumanSide(v as Player)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="X">X (goes first)</SelectItem>
                <SelectItem value="O">O (goes second)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <Button className="w-full" onClick={handleSubmit}>
        Start Game
      </Button>
    </div>
  );
}
