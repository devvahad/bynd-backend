import MissedMatchModel from './schema.js';
import { UserModel } from '../index.js';
import LikeModel from '../like/schema.js';
import { ResponseUtility, PropsValidationUtility } from '../../utility/index.js';
import { SUCCESS_CODE } from '../../constants.js';

export default async ({ userId, missedMatchId }) => {
  const { code, message } = PropsValidationUtility({ validProps: ['missedMatchId'], sourceDocument: { missedMatchId } });
  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message });
  }

  const currentUser = await UserModel.findById(userId);
  if (!currentUser) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, httpStatus: 404, message: 'User not found.' });
  }

  const missedMatch = await MissedMatchModel.findOne({ _id: missedMatchId, userRef: userId, deleted: false });
  if (!missedMatch) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, httpStatus: 404, message: 'Missed match not found.' });
  }

  await MissedMatchModel.findByIdAndUpdate(missedMatchId, { clicked: true });

  if (!currentUser.isPremium) {
    return ResponseUtility.SUCCESS({
      data: {
        requiresPremium: true,
        message: 'Subscribe to Premium to see who liked you!',
        redirectTo: 'premium_page',
      },
    });
  }

  const missedUserProfile = await UserModel.findOne({
    _id: missedMatch.missedUserRef, blocked: false, deleted: false,
  }).select('_id firstName age bio photos city');

  if (!missedUserProfile) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, httpStatus: 404, message: 'Profile no longer available.' });
  }

  const stillLikesMe = await LikeModel.findOne({ userRef: missedMatch.missedUserRef, likedUserRef: userId, deleted: false });

  return ResponseUtility.SUCCESS({
    data: {
      requiresPremium: false,
      profile: missedUserProfile,
      stillLikesYou: !!stillLikesMe,
      message: stillLikesMe
        ? 'This person still likes you! You can like them back.'
        : 'This person liked you, but may have changed their mind.',
      redirectTo: 'profile_page',
      missedUserId: missedMatch.missedUserRef,
    },
  });
};
