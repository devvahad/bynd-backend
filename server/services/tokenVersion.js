import { redis } from './redis.js';
import { logger } from './logger.js';

const TOKEN_VERSION_PREFIX = 'tv:';
const TOKEN_VERSION_TTL = 7 * 24 * 60 * 60;

const key = (userId) => `${TOKEN_VERSION_PREFIX}${userId}`;

export const getTokenVersion = async (userId) => {
  try {
    const val = await redis.get(key(userId));
    return val !== null ? Number(val) : null;
  } catch (err) {
    logger.warn(`getTokenVersion failed for ${userId}: ${err.message}`);
    return null;
  }
};

export const setTokenVersion = async (userId, version) => {
  try {
    await redis.set(key(userId), version, 'EX', TOKEN_VERSION_TTL);
  } catch (err) {
    logger.warn(`setTokenVersion failed for ${userId}: ${err.message}`);
  }
};

export const incrementTokenVersion = async (userId, currentVersion) => {
  const next = (currentVersion ?? 0) + 1;
  await setTokenVersion(userId, next);
  return next;
};
