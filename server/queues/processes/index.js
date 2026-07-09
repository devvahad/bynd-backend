import { Worker } from 'bullmq';
import { QUEUES } from '../index.js';
import { EmailServices, FirebaseNotificationService } from '../../services/index.js';
import { logger } from '../../services/logger.js';
import { bullmqConnectionOptions } from '../../services/redis.js';

const EMAIL_CONCURRENCY = Number(process.env.EMAIL_QUEUE_CONCURRENCY ?? 5);
const NOTIFICATION_CONCURRENCY = Number(process.env.NOTIFICATION_QUEUE_CONCURRENCY ?? 10);

const validateEmailPayload = ({ to, subject, text }) => {
  if (!to || !subject || !text) {
    throw new Error(`Invalid email job payload: ${JSON.stringify({ to, subject, text })}`);
  }
};

const validateNotificationPayload = ({ deviceId, device, title }) => {
  if (!deviceId || !device || !title) {
    throw new Error(`Invalid notification job payload: ${JSON.stringify({ deviceId, device, title })}`);
  }
};

let workers = [];

export const registerProcessors = () => {
  const emailWorker = new Worker(
    QUEUES.EMAIL,
    async (job) => {
      const { to, subject, text } = job.data;
      validateEmailPayload(job.data);
      await EmailServices({ to, subject, text });
      return { to };
    },
    { connection: bullmqConnectionOptions, concurrency: EMAIL_CONCURRENCY },
  );

  const notifWorker = new Worker(
    QUEUES.NOTIFICATION,
    async (job) => {
      const { deviceId, device, title, subtitle, type } = job.data;
      validateNotificationPayload(job.data);
      await FirebaseNotificationService({ deviceId, device, title, subtitle, type });
      return { deviceId };
    },
    { connection: bullmqConnectionOptions, concurrency: NOTIFICATION_CONCURRENCY },
  );

  emailWorker.on('completed', (job) => {
    logger.info(`Email sent to ${job.returnvalue?.to}`, { jobId: job.id });
  });

  emailWorker.on('failed', (job, err) => {
    logger.error(`Email job failed for ${job?.data?.to}`, {
      jobId: job?.id,
      attemptsMade: job?.attemptsMade,
      error: err.message,
    });
  });

  notifWorker.on('completed', (job) => {
    logger.info(`Notification sent to device ${job.returnvalue?.deviceId}`, { jobId: job.id });
  });

  notifWorker.on('failed', (job, err) => {
    logger.error(`Notification job failed for device ${job?.data?.deviceId}`, {
      jobId: job?.id,
      attemptsMade: job?.attemptsMade,
      error: err.message,
    });
  });

  workers = [emailWorker, notifWorker];

  const shutdown = async () => {
    logger.info('Shutting down queue processors...');
    await Promise.all(workers.map((worker) => worker.close()));
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  logger.info('Queue processors registered.');
};