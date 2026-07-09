import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { ResponseUtility } from '../utility/index.js';
import { APPLE_KEYS_URL, APPLE_ISSUER } from '../constants.js';

const { APPLE_CLIENT_ID } = process.env;

const APPLE_AUDIENCES = (APPLE_CLIENT_ID ?? '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);

const client = jwksClient({
  jwksUri: APPLE_KEYS_URL,
  cache: true,
  cacheMaxAge: 24 * 60 * 60 * 1000,
  rateLimit: true,
  jwksRequestsPerMinute: 10,
  timeout: 5000,
});

const getSigningKey = (kid) =>
  new Promise((resolve, reject) => {
    client.getSigningKey(kid, (err, key) => {
      if (err) return reject(err);
      return resolve(key.getPublicKey());
    });
  });

const AppleVerificationService = async ({ accessToken }) => {
  if (!accessToken) {
    throw ResponseUtility.MISSING_PROPS({ message: 'Missing required prop: accessToken.' });
  }

  if (!APPLE_AUDIENCES.length) {
    throw ResponseUtility.GENERIC_ERR({ message: 'Apple client id is not configured.' });
  }

  const decoded = jwt.decode(accessToken, { complete: true });
  if (!decoded?.header?.kid || decoded.header.alg !== 'RS256') {
    throw ResponseUtility.INVALID_ACCESS_TOKEN();
  }

  let publicKey;
  try {
    publicKey = await getSigningKey(decoded.header.kid);
  } catch {
    throw ResponseUtility.GENERIC_ERR({ message: 'Unable to verify token signature at this time.' });
  }

  try {
    const payload = jwt.verify(accessToken, publicKey, {
      algorithms: ['RS256'],
      issuer: APPLE_ISSUER,
      audience: APPLE_AUDIENCES,
      clockTolerance: 5,
    });
    return ResponseUtility.SUCCESS({ data: payload });
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw ResponseUtility.TOKEN_EXPIRED();
    }
    throw ResponseUtility.INVALID_ACCESS_TOKEN();
  }
};

export default AppleVerificationService;