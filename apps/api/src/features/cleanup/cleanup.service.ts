import { logger } from '../../shared/lib/logger.js';
import { cleanupRepository } from './cleanup.repository.js';

const STALE_ROOM_MS = 30 * 60 * 1000; // 30 minutes
const ABANDONED_GAME_MS = 2 * 60 * 60 * 1000; // 2 hours

export const cleanupService = {
  async runAll(): Promise<void> {
    const [staleRooms, abandonedGames] = await Promise.all([
      cleanupRepository.markStaleRoomsFinished(STALE_ROOM_MS),
      cleanupRepository.markAbandonedGames(ABANDONED_GAME_MS),
    ]);

    if (staleRooms > 0 || abandonedGames > 0) {
      logger.info({ staleRooms, abandonedGames }, 'cleanup complete');
    }
  },
};
