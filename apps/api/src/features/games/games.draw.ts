import { type IoServer, sessions } from './games.state.js';
import { gameEnd } from './games.end.js';

export const gameDraw = {
  offer: offerDraw,
  accept: acceptDraw,
  decline: declineDraw,
};

function offerDraw(gameId: string, socketUserId: string): boolean {
  const session = sessions.get(gameId);
  if (!session) return false;

  const isPlayer = session.players.X.id === socketUserId || session.players.O.id === socketUserId;
  if (!isPlayer) return false;

  session.pendingDrawOfferId = socketUserId;
  return true;
}

async function acceptDraw(gameId: string, socketUserId: string, io: IoServer): Promise<boolean> {
  const session = sessions.get(gameId);
  if (!session?.pendingDrawOfferId) return false;
  if (session.pendingDrawOfferId === socketUserId) return false;

  session.pendingDrawOfferId = null;
  await gameEnd.end(session, null, io);
  return true;
}

function declineDraw(gameId: string, socketUserId: string): boolean {
  const session = sessions.get(gameId);
  if (!session?.pendingDrawOfferId) return false;
  if (session.pendingDrawOfferId === socketUserId) return false;

  session.pendingDrawOfferId = null;
  return true;
}
