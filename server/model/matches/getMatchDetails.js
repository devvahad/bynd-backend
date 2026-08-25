import MatchModel from './schema.js';
import { UserModel } from '../index.js';
import { ResponseUtility, PropsValidationUtility } from '../../utility/index.js';
import { SUCCESS_CODE, MATCH_STATUS, PLAN_DATE_EXPIRY_HOURS } from '../../constants.js';

export default async ({ userId, matchId }) => {
  const { code, message } = PropsValidationUtility({ validProps: ['matchId'], sourceDocument: { matchId } });
  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message });
  }

  const match = await MatchModel.findOne({
    _id: matchId,
    $or: [{ user1Ref: userId }, { user2Ref: userId }],
    status: MATCH_STATUS.ACTIVE,
    deleted: { $ne: true },
  }).lean();

  if (!match) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, httpStatus: 404, message: 'Match not found or expired.' });
  }

  const otherUserId = match.user1Ref.toString() === userId.toString() ? match.user2Ref : match.user1Ref;

  const otherUser = await UserModel.findOne({ _id: otherUserId, blocked: false, deleted: false }).select(
    'firstName age photos location city state country verified lookingFor datingExpectations '
    + 'firstDatePreferences meetingAvailability firstDateDistance relationshipType verifiedByAdmin',
  );

  if (!otherUser) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, httpStatus: 404, message: 'User not found or unavailable.' });
  }

  const matchCreatedTime = new Date(match.createdOn).getTime();
  const expiryTime = matchCreatedTime + PLAN_DATE_EXPIRY_HOURS * 60 * 60 * 1000;
  const remainingHours = Math.max(0, Math.floor((expiryTime - Date.now()) / (1000 * 60 * 60)));

  return ResponseUtility.SUCCESS({
    message: 'Match details fetched successfully.',
    data: {
      matchId: match._id,
      matchedAt: match.createdOn,
      expiresAt: new Date(expiryTime),
      remainingHours,
      user: {
        id: otherUser._id,
        firstName: otherUser.firstName,
        age: otherUser.age,
        images: otherUser.photos?.map((p) => p.url) || [],
        location: {
          city: otherUser.city, state: otherUser.state, country: otherUser.country, coordinates: otherUser.location,
        },
        isVerified: otherUser.verifiedByAdmin === true,
        lookingFor: otherUser.lookingFor ?? null,
        datingExpectations: otherUser.datingExpectations ?? null,
        relationshipType: otherUser.relationshipType ?? null,
        datePreferences: otherUser.firstDatePreferences || [],
        dateAvailability: otherUser.meetingAvailability || [],
        preferredTravelDistance: otherUser.firstDateDistance ?? 30,
      },
    },
  });
};
