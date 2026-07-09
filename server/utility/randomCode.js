import crypto from 'crypto';

const CHARSETS = Object.freeze({
  num: '0123456789',
  alpha: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  alphaNum: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
});

const MIN_LENGTH = 1;
const MAX_LENGTH = 256;

class RandomCodeError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RandomCodeError';
  }
}

const secureRandomIndex = (max) => {
  const range = 256 - (256 % max);
  let byte;
  do {
    [byte] = crypto.randomBytes(1);
  } while (byte >= range);
  return byte % max;
};

const RandomCodeUtility = (length = 6, type = 'num') => {
  if (!Number.isInteger(length) || length < MIN_LENGTH || length > MAX_LENGTH) {
    throw new RandomCodeError(`length must be an integer between ${MIN_LENGTH} and ${MAX_LENGTH}`);
  }

  const charset = CHARSETS[type];
  if (!charset) {
    throw new RandomCodeError(`type must be one of: ${Object.keys(CHARSETS).join(', ')}`);
  }

  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += charset[secureRandomIndex(charset.length)];
  }
  return result;
};

export default RandomCodeUtility;
export { RandomCodeError, CHARSETS };