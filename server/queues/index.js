import { Queue } from 'bullmq';
import { bullmqConnectionOptions } from '../services/redis.js';
import { logger } from '../services/logger.js';

const queues = new Map();

export const getQueue = (name) => {
  if (!queues.has(name)) {
    const queue = new Queue(name, { connection: bullmqConnectionOptions });
    queue.on('error', (err) => logger.error(`Queue [${name}] error: ${err.message}`));
    queues.set(name, queue);
  }
  return queues.get(name);
};

export const QUEUES = Object.freeze({
  EMAIL: 'email',
  NOTIFICATION: 'notification',
  CRON: 'cron',
});