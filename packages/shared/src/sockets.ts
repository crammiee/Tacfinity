import type { Cell } from './types/index.js';

export interface ClientToServerEvents {
  'queue:join': () => void;
  'game:move': (payload: { gameId: string; row: number; col: number }) => void;
  'game:sync': (payload: { gameId: string }) => void;
}

export interface ServerToClientEvents {
  'queue:matched': (payload: MatchedPayload) => void;
  'queue:timeout': (payload: QueueTimeoutPayload) => void;
  'game:update': (payload: GameUpdatePayload) => void;
  'game:end': (payload: GameEndPayload) => void;
  'game:error': (payload: GameErrorPayload) => void;
  'game:sync': (payload: GameSyncPayload) => void;
}

export interface MatchedPayload {
  gameId: string;
  yourSymbol: 'X' | 'O';
  yourRating: number;
  opponentUsername: string;
  opponentRating: number;
}

export interface GameUpdatePayload {
  gameId: string;
  tgnToken: string; // e.g. "X:3,5" — player:row,col
  nextPlayer: 'X' | 'O';
}

export interface GameEndPayload {
  gameId: string;
  winner: 'X' | 'O' | 'draw';
  ratingDelta: { X: number; O: number }; // signed — positive = gained, negative = lost
}

export interface QueueTimeoutPayload {
  message: string;
}

export interface GameErrorPayload {
  error: { code: string; message: string };
}

export interface GameSyncPayload {
  gameId: string;
  board: Cell[];
  moves: string[]; // TGN tokens e.g. ["X:0,0", "O:1,1"]
  nextPlayer: 'X' | 'O';
  yourSymbol: 'X' | 'O';
  opponentUsername: string;
  opponentRating: number;
  yourRating: number;
}
