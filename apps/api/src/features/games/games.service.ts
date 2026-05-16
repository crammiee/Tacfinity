import { gameSession } from './games.session.js';
import { gameMoves } from './games.moves.js';
import { gameEnd } from './games.end.js';
import { gameDraw } from './games.draw.js';

export const gamesService = {
  createGameSession: gameSession.create,
  applyMove: gameMoves.apply,
  handlePlayerDisconnect: gameSession.handleDisconnect,
  syncGame: gameSession.sync,
  resignGame: gameEnd.resign,
  offerDraw: gameDraw.offer,
  acceptDraw: gameDraw.accept,
  declineDraw: gameDraw.decline,
};
