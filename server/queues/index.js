import Bull from 'bull';
import { logger } from '../services/logger.js';

const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = process.env;

const redisConfig = {
  host: REDIS_HOST || '127.0.0.1',
  port: parseInt(REDIS_PORT ?? '6379', 10),
  ...(REDIS_PASSWORD && { password: REDIS_PASSWORD }),
};

const queues = new Map();

export const getQueue = (name) => {
  if (!queues.has(name)) {
    const queue = new Bull(name, { redis: redisConfig });
    queue.on('error', (err) => logger.error(`Queue [${name}] error: ${err.message}`));
    queue.on('failed', (job, err) => logger.error(`Queue [${name}] job ${job.id} failed: ${err.message}`));
    queues.set(name, queue);
  }
  return queues.get(name);
};

export const QUEUES = Object.freeze({
  EMAIL: 'email',
  NOTIFICATION: 'notification',
});