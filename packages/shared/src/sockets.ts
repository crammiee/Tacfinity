export interface ClientToServerEvents {
  'queue:join': () => void;
  'game:move': (payload: { gameId: string; row: number; col: number }) => void;
}

export interface ServerToClientEvents {
  'queue:matched': (payload: MatchedPayload) => void;
  'game:update': (payload: GameUpdatePayload) => void;
  'game:end': (payload: GameEndPayload) => void;
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
