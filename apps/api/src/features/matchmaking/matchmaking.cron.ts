import { logger } from '../../shared/lib/logger.js';
import { matchmakingService } from './matchmaking.service.js';

const INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes
const TIMEOUT_MS = 5 * 60 * 1000; // remove users waiting 5+ minutes

export function startQueueTimeoutCron(): void {
  setInterval(() => {
    try {
      matchmakingService.timeoutQueue(TIMEOUT_MS);
    } catch (err) {
      logger.error({ err }, 'queue timeout cron error');
    }
  }, INTERVAL_MS).unref();

  logger.info({ intervalMs: INTERVAL_MS }, 'queue timeout cron started');
}
