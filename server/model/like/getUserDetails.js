import { Types } from 'mongoose';
import { UserModel, PromptModel } from '../index.js';
import { ResponseUtility, DistanceUtility } from '../../utility/index.js';
import { PROMPTS } from '../../constants.js';

const OMITTED_FIELDS = [
  'password', 'device', 'fcmToken', 'socialId', 'socialToken', 'socialIdentifier',
  'changePassToken', 'changePassTokenDate', 'reportedUsers', 'reportedBy', 'removedUsers', 'removedBy',
  'missedMatchCount', 'sessionSwipeCount', 'dailyMissedMatchShown', 'lastInboundLikesUpdate',
  'lastMissedMatchReset', 'userSegment', 'matchScore', 'profileProgress', 'phoneTokenRetries',
  'phoneToken', 'phoneTokenDate', 'phoneTokenExpiry', 'blocked', 'deleted', 'phoneNumber', 'phoneCode',
  'inboundLikesLast7Days', 'tokenVersion', 'passwordResetCode', 'passwordResetExpiry', '__v',
];

export default async ({ id, profileUserId }) => {
  if (!id || !profileUserId) {
    throw ResponseUtility.MISSING_PROPS({ message: 'id and profileUserId are required.' });
  }

  const viewer = await UserModel.findOne({ _id: id, deleted: false, blocked: false }).select('isPremium location');
  if (!viewer) {
    throw ResponseUtility.NO_USER();
  }

  const [user] = await UserModel.aggregate([
    { $match: { _id: new Types.ObjectId(profileUserId), deleted: false, blocked: false } },
    { $unset: OMITTED_FIELDS },
  ]);

  if (!user) {
    throw ResponseUtility.NO_USER();
  }

  const prompts = await PromptModel.find({ userRef: user._id, deleted: false })
    .select('promptId response order')
    .sort({ order: 1 })
    .lean();

  user.prompts = prompts.map((p) => ({
    promptId: p.promptId, promptText: PROMPTS[p.promptId] || null, response: p.response, order: p.order,
  }));

  if (viewer.location?.coordinates && user.location?.coordinates) {
    const distanceMiles = DistanceUtility(viewer.location.coordinates, user.location.coordinates);
    user.distance = distanceMiles ? `${distanceMiles} miles` : null;
  } else {
    user.distance = null;
  }

  return ResponseUtility.SUCCESS({ message: 'User profile fetched successfully.', data: user });
};
