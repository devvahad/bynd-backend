import { TokenUtility, ResponseUtility } from '../utility/index.js';

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json(ResponseUtility.INVALID_ACCESS_TOKEN);
  }
  const token = authHeader.slice(7);
  const decoded = TokenUtility.decodeToken(token);
  if (!decoded) {
    return res.status(401).json(ResponseUtility.INVALID_ACCESS_TOKEN);
  }
  req.user = decoded.data;
  return next();
};

export const authorizeAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json(ResponseUtility.GENERIC_ERR({ code: 403, message: 'Forbidden.' }));
  }
  return next();
};