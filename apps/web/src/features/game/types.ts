export interface PlayerInfo {
  username: string;
  rating: number;
}

export type MatchStatus = 'idle' | 'searching' | 'playing' | 'ended';

export type BotGamePhase = 'setup' | 'playing' | 'gameover';
