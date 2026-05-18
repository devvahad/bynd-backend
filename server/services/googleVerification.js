import got from 'got';
import ResponseUtility from '../utility/response.js';

const GOOGLE_TOKEN_INFO_URL = 'https://oauth2.googleapis.com/tokeninfo';

const GoogleVerificationService = ({ accessToken }) =>
  new Promise(async (resolve, reject) => {
    if (!accessToken) {
      return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing required prop: accessToken.' }));
    }
    try {
      const { body } = await got(`${GOOGLE_TOKEN_INFO_URL}?id_token=${accessToken}`, { responseType: 'json' });
      return resolve(ResponseUtility.SUCCESS({ data: body }));
    } catch (err) {
      return reject(ResponseUtility.GENERIC_ERR({ message: 'Google token verification failed.', error: err }));
    }
  });

export default GoogleVerificationService;