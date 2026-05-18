import jwt from 'jsonwebtoken';
import ResponseUtility from '../utility/response.js';

const AppleVerificationService = ({ accessToken }) =>
  new Promise((resolve, reject) => {
    if (!accessToken) {
      return reject({ message: 'Missing required prop: accessToken.' });
    }
    const decoded = jwt.decode(accessToken, { complete: true });
    if (decoded) {
      return resolve(ResponseUtility.SUCCESS({ data: { ...decoded } }));
    }
    return reject({ message: 'Invalid access token.' });
  });

export default AppleVerificationService;