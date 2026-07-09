import { UserModel, AdminModel } from '../model/index.js';
import { TokenUtility, ResponseUtility } from '../utility/index.js';

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json(ResponseUtility.INVALID_ACCESS_TOKEN());
  }

  const token = authHeader.slice(7);
  const decoded = TokenUtility.verifyTokenSafe(token);

  if (!decoded) {
    return res.status(401).json(ResponseUtility.INVALID_ACCESS_TOKEN());
  }

  req.user = decoded.data;

  if (req.user?.role === 'admin') {
    try {
      const admin = await AdminModel.findOne({ _id: req.user._id || req.user.id }).select('isActive isDeleted');
      if (!admin || !admin.isActive || admin.isDeleted) {
        return res.status(401).json(ResponseUtility.INVALID_ACCESS_TOKEN());
      }
    } catch (err) {
      return res.status(500).json(ResponseUtility.GENERIC_ERR({ error: err.message }));
    }
    return next();
  }

  try {
    const userId = req.user._id || req.user.id;
    const user = await UserModel.findOne({ _id: userId }).select('blocked deleted isDeleted isActive passwordChangedAt');

    if (!user) {
      return res.status(401).json(ResponseUtility.NO_USER());
    }

    if (user.passwordChangedAt && typeof decoded.iat === 'number') {
      const passwordChangedAtSeconds =
        Math.floor(user.passwordChangedAt.getTime() / 1000);

      if (decoded.iat < passwordChangedAtSeconds) {
        return res.status(401).json(
          ResponseUtility.INVALID_ACCESS_TOKEN()
        );
      }
    }

    const isBlocked = user.blocked === true;
    const isDeleted = user.deleted === true || user.isDeleted === true;

    if (isBlocked || isDeleted) {
      return res.status(401).json(
        ResponseUtility.GENERIC_ERR({
          code: 401,
          message: `Your account has been ${isBlocked ? 'blocked' : 'deleted'} by the admin.`,
        }),
      );
    }
  } catch (err) {
    return res.status(500).json(ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
  return next();
};

export const authorizeAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json(ResponseUtility.GENERIC_ERR({ code: 403, message: 'Forbidden.' }));
  }
  return next();
};