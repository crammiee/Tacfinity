import { logger } from '../../shared/lib/logger.js';
import { cleanupService } from './cleanup.service.js';

const INTERVAL_MS = 60 * 60 * 1000; // every hour

export function startCleanupCron(): void {
  const run = (): void => {
    cleanupService.runAll().catch((err: unknown) => {
      logger.error({ err }, 'cleanup cron error');
    });
  };

  run();
  setInterval(run, INTERVAL_MS).unref();
  logger.info({ intervalMs: INTERVAL_MS }, 'cleanup cron started');
}
