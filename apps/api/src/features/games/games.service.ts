import { createGameSession, syncGame, handlePlayerDisconnect } from './games.session.js';
import { applyMove } from './games.moves.js';
import { resignGame } from './games.end.js';
import { offerDraw, acceptDraw, declineDraw } from './games.draw.js';

export const gamesService = {
  createGameSession,
  applyMove,
  handlePlayerDisconnect,
  syncGame,
  resignGame,
  offerDraw,
  acceptDraw,
  declineDraw,
};
