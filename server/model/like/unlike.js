import LikeModel from './schema.js';
import MatchModel from '../matches/schema.js';
import { UserModel } from '../index.js';
import { ResponseUtility, PropsValidationUtility } from '../../utility/index.js';
import { SUCCESS_CODE, MATCH_STATUS } from '../../constants.js';

export default async ({ userId, unlikedUserId }) => {
  const { code, message } = PropsValidationUtility({
    validProps: ['unlikedUserId'],
    sourceDocument: { unlikedUserId },
  });
  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message });
  }

  if (userId.toString() === unlikedUserId.toString()) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'You cannot unlike yourself.' });
  }

  const [currentUser, unlikedUser] = await Promise.all([
    UserModel.findOne({ _id: userId, blocked: false, deleted: false }),
    UserModel.findOne({ _id: unlikedUserId, blocked: false, deleted: false }),
  ]);

  if (!currentUser || !unlikedUser) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, message: 'User not found or unavailable.' });
  }

  const existingLike = await LikeModel.findOne({ userRef: userId, likedUserRef: unlikedUserId, deleted: false });

  if (!existingLike) {
    return ResponseUtility.SUCCESS({ message: 'No active like found — nothing to unlike.' });
  }

  existingLike.deleted = true;
  await existingLike.save();

  const mutualLike = await LikeModel.findOne({ userRef: unlikedUserId, likedUserRef: userId, deleted: false });
  let matchRemoved = false;

  if (mutualLike) {
    const [user1, user2] = [userId, unlikedUserId].sort((a, b) => a.toString().localeCompare(b.toString()));
    const match = await MatchModel.findOne({ user1Ref: user1, user2Ref: user2, deleted: false });

    if (match) {
      match.status = MATCH_STATUS.UNMATCHED;
      match.unmatchedBy = userId;
      match.unmatchedOn = new Date();
      await match.save();
      matchRemoved = true;
    }
  }

  return ResponseUtility.SUCCESS({
    message: matchRemoved ? 'User unliked successfully and match removed.' : 'User unliked successfully.',
    data: {
      unlikedUser: { id: unlikedUser._id, name: unlikedUser.firstName || 'User' },
      matchRemoved,
    },
  });
};
