import { logger } from './logger.js';
import got from 'got';
import { ResponseUtility } from '../utility/index.js';

const GOOGLE_TOKEN_INFO_URL = 'https://oauth2.googleapis.com/tokeninfo';
const REQUEST_TIMEOUT_MS = 10_000;
const REQUEST_RETRIES = 1;

async function GoogleVerificationService({ accessToken }) {
  if (!accessToken) {
    throw ResponseUtility.MISSING_PROPS({ message: 'Missing required prop: accessToken.' });
  }

  try {
    const { body } = await got(GOOGLE_TOKEN_INFO_URL, {
      searchParams: { id_token: accessToken },
      responseType: 'json',
      timeout: { request: REQUEST_TIMEOUT_MS },
      retry: { limit: REQUEST_RETRIES },
    });

    if (process.env.GOOGLE_CLIENT_ID && body.aud !== process.env.GOOGLE_CLIENT_ID) {
      throw ResponseUtility.GENERIC_ERR({
        message: 'Google token audience mismatch.',
        code: 'INVALID_TOKEN_AUDIENCE',
      });
    }

    const expiresAt = Number(body.exp);
    if (!expiresAt || expiresAt * 1000 < Date.now()) {
      throw ResponseUtility.GENERIC_ERR({
        message: 'Google token has expired.',
        code: 'TOKEN_EXPIRED',
      });
    }

    return ResponseUtility.SUCCESS({ data: body });
  } catch (error) {
    if (error?.code === 'INVALID_TOKEN_AUDIENCE' || error?.code === 'TOKEN_EXPIRED') {
      throw error;
    }

    logger.error('GoogleVerificationService error', { error: error.message });

    if (error instanceof got.HTTPError && error.response.statusCode === 400) {
      throw ResponseUtility.GENERIC_ERR({
        message: 'Google token is invalid or expired.',
        error,
        code: 'INVALID_TOKEN',
      });
    }

    throw ResponseUtility.GENERIC_ERR({ message: 'Google token verification failed.', error });
  }
}

export default GoogleVerificationService;