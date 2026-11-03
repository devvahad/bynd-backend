import UserModel from './index.js';
import { ResponseUtility, TokenUtility } from '../../utility/index.js';
import { RedisClient } from '../../services/index.js';

export default async ({ id, authorization }) => {
  const user = await UserModel.findOneAndUpdate(
    { _id: id, deleted: false },
    { $set: { fcmToken: '', device: '' } },
    { new: true },
  );

  if (!user) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, message: 'User not found.' });
  }

  if (authorization) {
    const token = authorization.replace(/^Bearer\s+/i, '');
    const decoded = TokenUtility.decodeWithoutVerifying(token);
    const exp = decoded?.payload?.exp;

    if (exp) {
      const ttl = Math.max(exp - Math.floor(Date.now() / 1000), 0);
      await RedisClient.set(`blacklist:${token}`, 'true');
      if (ttl > 0) await RedisClient.expire(`blacklist:${token}`, ttl);
    }
  }

  return ResponseUtility.SUCCESS({ message: 'Logged out successfully.' });
};