import type { Player } from './game';

export interface Move {
  player: Player;
  row: number;
  col: number;
}
