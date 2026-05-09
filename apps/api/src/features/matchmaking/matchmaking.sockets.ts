import { type AuthedSocket } from '../../shared/types/socket.js';
import { matchmakingService } from './matchmaking.service.js';

export function registerMatchmakingHandlers(socket: AuthedSocket): void {
  socket.on('queue:join', async () => {
    try {
      await matchmakingService.joinQueue(socket);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Server error';
      socket.emit('game:error', { error: { code: 'INTERNAL', message } });
    }
  });

  socket.on('disconnect', () => {
    matchmakingService.cancelQueue(socket);
  });
}
