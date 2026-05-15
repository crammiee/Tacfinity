import { type IoServer, sessions } from './games.state.js';
import { endGame } from './games.end.js';

export function offerDraw(gameId: string, socketUserId: string): boolean {
  const session = sessions.get(gameId);
  if (!session) return false;

  const isPlayer = session.players.X.id === socketUserId || session.players.O.id === socketUserId;
  if (!isPlayer) return false;

  session.pendingDrawOfferId = socketUserId;
  return true;
}

export async function acceptDraw(
  gameId: string,
  socketUserId: string,
  io: IoServer
): Promise<boolean> {
  const session = sessions.get(gameId);
  if (!session?.pendingDrawOfferId) return false;
  if (session.pendingDrawOfferId === socketUserId) return false;

  session.pendingDrawOfferId = null;
  await endGame(session, null, io);
  return true;
}

export function declineDraw(gameId: string, socketUserId: string): boolean {
  const session = sessions.get(gameId);
  if (!session?.pendingDrawOfferId) return false;
  if (session.pendingDrawOfferId === socketUserId) return false;

  session.pendingDrawOfferId = null;
  return true;
}
