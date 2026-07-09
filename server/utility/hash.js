import bcrypt from 'bcryptjs';
import { DEFAULT_SALT_ROUNDS, MIN_SALT_ROUNDS, MAX_SALT_ROUNDS } from '../constants.js';

class HashUtilityError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'HashUtilityError';
    if (cause) this.cause = cause;
  }
}

const assertNonEmptyString = (value, fieldName) => {
  if (typeof value !== 'string' || value.length === 0) {
    throw new HashUtilityError(`${fieldName} must be a non-empty string`);
  }
};

const normalizeRounds = (rounds) => {
  const parsed = Number(rounds);
  if (!Number.isInteger(parsed) || parsed < MIN_SALT_ROUNDS || parsed > MAX_SALT_ROUNDS) {
    throw new HashUtilityError(
      `iterations must be an integer between ${MIN_SALT_ROUNDS} and ${MAX_SALT_ROUNDS}`
    );
  }
  return parsed;
};

const HashUtility = Object.freeze({
  async generate({ text, iterations = DEFAULT_SALT_ROUNDS } = {}) {
    assertNonEmptyString(text, 'text');
    const rounds = normalizeRounds(iterations);

    try {
      return await bcrypt.hash(text, rounds);
    } catch (error) {
      throw new HashUtilityError('Failed to generate hash', error);
    }
  },

  async compare({ text, hash } = {}) {
    assertNonEmptyString(text, 'text');
    assertNonEmptyString(hash, 'hash');

    try {
      return await bcrypt.compare(text, hash);
    } catch (error) {
      throw new HashUtilityError('Failed to compare hash', error);
    }
  },
});

export default HashUtility;
export { HashUtilityError };