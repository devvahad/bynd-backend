import jwt from 'jsonwebtoken';
import { TOKEN_EXPIRY } from '../constants.js';

const { SECRET_STRING } = process.env;

if (!SECRET_STRING || SECRET_STRING.trim().length === 0) {
  throw new Error('SECRET_STRING environment variable is required and cannot be empty');
}

const SIGN_ALGORITHM = 'HS256';

class TokenError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'TokenError';
    if (cause) this.cause = cause;
  }
}

const generateToken = (payload, options = {}) => {
  if (payload === null || typeof payload !== 'object') {
    throw new TypeError('payload must be a non-null object');
  }

  const { tokenLife, ...data } = payload;
  const expiresIn = options.expiresIn ?? tokenLife ?? TOKEN_EXPIRY;

  try {
    return jwt.sign({ data }, SECRET_STRING, {
      expiresIn,
      algorithm: SIGN_ALGORITHM,
      ...options,
    });
  } catch (error) {
    throw new TokenError('Failed to generate token', error);
  }
};

const verifyTokenSafe = (token) => {
  if (typeof token !== 'string' || token.trim().length === 0) {
    return undefined;
  }

  try {
    return jwt.verify(token, SECRET_STRING, { algorithms: [SIGN_ALGORITHM] });
  } catch {
    return undefined;
  }
};

const verifyToken = (token) => {
  if (typeof token !== 'string' || token.trim().length === 0) {
    throw new TokenError('token must be a non-empty string');
  }

  try {
    return jwt.verify(token, SECRET_STRING, { algorithms: [SIGN_ALGORITHM] });
  } catch (error) {
    throw new TokenError('Token verification failed', error);
  }
};

const decodeWithoutVerifying = (token) => {
  if (typeof token !== 'string' || token.trim().length === 0) {
    return undefined;
  }

  try {
    return jwt.decode(token, { complete: true });
  } catch {
    return undefined;
  }
};

const TokenUtility = Object.freeze({
  generateToken,
  verifyTokenSafe,
  verifyToken,
  decodeWithoutVerifying,
});

export default TokenUtility;
export { generateToken, verifyTokenSafe, verifyToken, decodeWithoutVerifying, TokenError };