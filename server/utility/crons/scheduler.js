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

  await cronQueue.add(JOB_NAMES.FREQUENT_MATCH_UPKEEP, {}, {
    repeat: { pattern: '*/15 * * * *' },
    jobId: JOB_NAMES.FREQUENT_MATCH_UPKEEP,
  });

  await cronQueue.add(JOB_NAMES.BULK_ADMIRER_DIGEST, {}, {
    repeat: { pattern: '0 */12 * * *' },
    jobId: JOB_NAMES.BULK_ADMIRER_DIGEST,
  });

  await cronQueue.add(JOB_NAMES.FREQUENT_MATCH_UPKEEP, {}, { jobId: `${JOB_NAMES.FREQUENT_MATCH_UPKEEP}-startup-${Date.now()}` });

  logger.info('Cron jobs initialized successfully.');
};

export const shutdownCronJobs = async () => {
  if (cronWorker) await cronWorker.close();
};

export default initializeCronJobs;
