import jwt from 'jsonwebtoken';
import { TOKEN_EXPIRY } from '../constants.js';

const { SECRET_STRING } = process.env;

const TokenUtility = {
  generateToken: (payload) => {
    const expiresIn = payload.tokenLife ?? TOKEN_EXPIRY;
    return jwt.sign({ data: payload }, SECRET_STRING, { expiresIn });
  },

  decodeToken: (token) => {
    try {
      return jwt.verify(token, SECRET_STRING);
    } catch {
      return undefined;
    }
  },
};

export default TokenUtility;