export type Player = 'X' | 'O';
export type Cell = Player | null;
export type GameMode = '2p' | 'ai';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GameSettings {
  cols: number;
  rows: number;
  winLen: number;
  mode: GameMode;
  difficulty: Difficulty;
  humanSide: Player;
}

export interface Scores {
  X: number;
  O: number;
  draw: number;
}
