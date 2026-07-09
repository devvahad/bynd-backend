import Redis from 'ioredis';
import { logger } from './logger.js';

const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_USERNAME, REDIS_TLS, REDIS_DB } = process.env;

const baseOptions = {
  host: REDIS_HOST || '127.0.0.1',
  port: parseInt(REDIS_PORT ?? '6379', 10),
  username: REDIS_USERNAME || undefined,
  password: REDIS_PASSWORD || undefined,
  db: parseInt(REDIS_DB ?? '0', 10),
  tls: REDIS_TLS === 'true' ? {} : undefined,
  lazyConnect: true,
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
  connectTimeout: 10_000,
  retryStrategy: (times) => Math.min(times * 100, 3000),
  reconnectOnError: (err) => {
    const targetErrors = ['READONLY', 'ETIMEDOUT', 'ECONNRESET'];
    return targetErrors.some((code) => err.message.includes(code));
  },
};

const redis = new Redis(baseOptions);

redis.on('connect', () => logger.info('Redis connected.'));
redis.on('ready', () => logger.info('Redis ready.'));
redis.on('reconnecting', (delay) => logger.warn(`Redis reconnecting in ${delay}ms.`));
redis.on('close', () => logger.warn('Redis connection closed.'));
redis.on('end', () => logger.warn('Redis connection ended.'));
redis.on('error', (err) => logger.error(`Redis error: ${err.message}`));

export async function closeRedisConnection() {
  try {
    await redis.quit();
    logger.info('Redis connection closed gracefully.');
  } catch (err) {
    logger.error(`Error closing Redis connection: ${err.message}`);
    redis.disconnect();
  }
}

export const bullmqConnectionOptions = {
  ...baseOptions,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

export { redis };
export default redis;