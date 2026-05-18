import Redis from 'ioredis';
import { logger } from './logger.js';

const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = process.env;

const redis = new Redis({
  host: REDIS_HOST || '127.0.0.1',
  port: parseInt(REDIS_PORT ?? '6379', 10),
  password: REDIS_PASSWORD || undefined,
  lazyConnect: true,
  retryStrategy: (times) => Math.min(times * 100, 3000),
});

redis.on('connect', () => logger.info('Redis connected.'));
redis.on('error', (err) => logger.error(`Redis error: ${err.message}`));

export default redis;