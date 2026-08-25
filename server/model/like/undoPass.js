import PassModel from './passSchema.js';
import { UserModel } from '../index.js';
import { ResponseUtility } from '../../utility/index.js';
import { RedisClient } from '../../services/index.js';
import { UNDO_PASS_REDIS_PREFIX } from '../../constants.js';

export default async ({ userId }) => {
  if (!userId) {
    throw ResponseUtility.MISSING_PROPS({ message: 'User ID is required.' });
  }

  const currentUser = await UserModel.findById(userId);
  if (!currentUser || currentUser.deleted || currentUser.blocked) {
    throw ResponseUtility.GENERIC_ERR({ message: 'User not found or inactive.' });
  }

  if (!currentUser.isPremium) {
    throw ResponseUtility.GENERIC_ERR({ code: 403, httpStatus: 403, message: 'Undo feature is available for premium users only.' });
  }

  const redisKey = `${UNDO_PASS_REDIS_PREFIX}${userId}`;
  const passedListRaw = await RedisClient.get(redisKey);
  let passedList = [];
  if (passedListRaw) {
    try { passedList = JSON.parse(passedListRaw); } catch { passedList = []; }
  }

  if (!passedList.length) {
    throw ResponseUtility.GENERIC_ERR({ message: 'No recently passed profiles to undo.' });
  }

  const lastPassedUserId = passedList.pop();
  await RedisClient.set(redisKey, JSON.stringify(passedList));

  if (!lastPassedUserId) {
    throw ResponseUtility.GENERIC_ERR({ message: 'No recently passed profiles to undo.' });
  }

  await PassModel.findOneAndDelete({ userRef: userId, passedUserRef: lastPassedUserId });

  const undoneUser = await UserModel.findOne({ _id: lastPassedUserId, deleted: false, blocked: false });
  if (!undoneUser) {
    throw ResponseUtility.GENERIC_ERR({ message: 'The profile could not be retrieved.' });
  }

  return ResponseUtility.SUCCESS({
    data: {
      undoneUser: { id: undoneUser._id, name: undoneUser.firstName || 'User', age: undoneUser.age },
      message: 'Last passed profile fetched successfully.',
    },
  });
};
