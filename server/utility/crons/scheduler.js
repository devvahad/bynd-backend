import { Worker } from 'bullmq';
import { getQueue, QUEUES } from '../../queues/index.js';
import { bullmqConnectionOptions } from '../../services/redis.js';
import { logger } from '../../services/logger.js';
import expireMatchesJob from './expireMatches.js';
import sendDateReminders from './dateReminders.js';
import sendExpiringNotifications from './expiringNotifications.js';
import sendBulkAdmirerNotifications from './sendBulkAdmirerNotifications.js';

const JOB_NAMES = Object.freeze({
  FREQUENT_MATCH_UPKEEP: 'frequent-match-upkeep',
  BULK_ADMIRER_DIGEST: 'bulk-admirer-digest',
});

const JOB_HANDLERS = {
  [JOB_NAMES.FREQUENT_MATCH_UPKEEP]: async () => {
    await expireMatchesJob();
    await sendDateReminders();
    await sendExpiringNotifications();
  },
  [JOB_NAMES.BULK_ADMIRER_DIGEST]: async () => {
    await sendBulkAdmirerNotifications();
  },
};

let cronWorker;

/**
 * Registers the BullMQ worker that processes scheduled cron jobs, and
 * enqueues the repeatable jobs themselves. Idempotent: BullMQ dedupes
 * repeatable jobs by their pattern, so calling this again on restart
 * does not create duplicates.
 */
export const initializeCronJobs = async () => {
  const cronQueue = getQueue(QUEUES.CRON);

  cronWorker = new Worker(
    QUEUES.CRON,
    async (job) => {
      const handler = JOB_HANDLERS[job.name];
      if (!handler) {
        logger.warn(`No handler registered for cron job "${job.name}"`);
        return;
      }
      await handler();
    },
    { connection: bullmqConnectionOptions, concurrency: 1 },
  );

  cronWorker.on('failed', (job, err) => {
    logger.error(`Cron job "${job?.name}" failed: ${err.message}`);
  });

  // Every 15 minutes: expire stale matches, send date reminders, warn about expiring items.
  await cronQueue.add(JOB_NAMES.FREQUENT_MATCH_UPKEEP, {}, {
    repeat: { pattern: '*/15 * * * *' },
    jobId: JOB_NAMES.FREQUENT_MATCH_UPKEEP,
  });

  // Every 12 hours: bulk "you have N new admirers" digest.
  await cronQueue.add(JOB_NAMES.BULK_ADMIRER_DIGEST, {}, {
    repeat: { pattern: '0 */12 * * *' },
    jobId: JOB_NAMES.BULK_ADMIRER_DIGEST,
  });

  // Run once immediately on startup as well, matching Backend A's behavior.
  await cronQueue.add(JOB_NAMES.FREQUENT_MATCH_UPKEEP, {}, { jobId: `${JOB_NAMES.FREQUENT_MATCH_UPKEEP}-startup-${Date.now()}` });

  logger.info('Cron jobs initialized successfully.');
};

export const shutdownCronJobs = async () => {
  if (cronWorker) await cronWorker.close();
};

export default initializeCronJobs;
