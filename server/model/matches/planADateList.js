import { Types } from 'mongoose';
import MatchModel from './schema.js';
import DateRequestModel from './dateRequestSchema.js';
import { UserModel } from '../index.js';
import { BlockedContactModel } from '../blockedContacts/schema.js';
import { ResponseUtility } from '../../utility/index.js';
import { MATCH_STATUS, PLAN_DATE_EXPIRY_HOURS, DATE_REQUEST_STATUS } from '../../constants.js';

export default async ({ userId, page = 1, limit = 10 }) => {
  const currentTime = new Date();
  const expiryDate = new Date(currentTime.getTime() - PLAN_DATE_EXPIRY_HOURS * 60 * 60 * 1000);

  const [blockedContacts, blockedByOthers] = await Promise.all([
    BlockedContactModel.find({ userId, blockedUserRef: { $ne: null } }).select('blockedUserRef').lean(),
    BlockedContactModel.find({ blockedUserRef: userId }).select('userId').lean(),
  ]);

  const blockedObjectIds = [
    ...blockedContacts.map((b) => b.blockedUserRef.toString()),
    ...blockedByOthers.map((b) => b.userId.toString()),
  ].map((id) => new Types.ObjectId(id));

  const pendingDateRequestMatchIds = await DateRequestModel.distinct('matchRef', {
    deleted: false, status: DATE_REQUEST_STATUS.PENDING,
  });

  const baseQuery = {
    $and: [
      { $or: [{ user1Ref: userId }, { user2Ref: userId }] },
      { user1Ref: { $nin: blockedObjectIds } },
      { user2Ref: { $nin: blockedObjectIds } },
    ],
    _id: { $nin: pendingDateRequestMatchIds },
    status: MATCH_STATUS.ACTIVE,
    deleted: false,
    createdOn: { $gte: expiryDate },
    $or: [{ datePlanned: { $exists: false } }, { datePlanned: null }],
  };

  const [matches, totalCount] = await Promise.all([
    MatchModel.find(baseQuery).sort({ createdOn: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    MatchModel.countDocuments(baseQuery),
  ]);

  if (!matches.length) {
    return ResponseUtility.SUCCESS({
      message: 'No matches found.',
      data: { matches: [], pagination: { page, limit, total: 0, hasMore: false } },
    });
  }

  const matchList = await Promise.all(matches.map(async (match) => {
    const otherUserId = match.user1Ref.toString() === userId.toString() ? match.user2Ref : match.user1Ref;

    const otherUser = await UserModel.findOne({
      _id: otherUserId, blocked: false, deleted: false, incognitoMode: { $ne: true },
    }).select('firstName photos');

    if (!otherUser) return null;

    const matchCreatedTime = new Date(match.createdOn).getTime();
    const expiryTime = matchCreatedTime + PLAN_DATE_EXPIRY_HOURS * 60 * 60 * 1000;
    const remainingTimeMs = expiryTime - currentTime.getTime();
    const remainingHours = Math.max(0, Math.floor(remainingTimeMs / (1000 * 60 * 60)));

    const primaryPhoto = otherUser.photos?.length
      ? [...otherUser.photos].sort((a, b) => (a.order || 0) - (b.order || 0))[0].url
      : null;

    return {
      matchId: match._id,
      userId: otherUser._id,
      name: otherUser.firstName || 'User',
      profilePicture: primaryPhoto,
      matchedAt: match.createdOn,
      expiresAt: new Date(expiryTime),
      remainingHours,
      remainingTimeMs,
    };
  }));

  const validMatches = matchList.filter(Boolean).sort((a, b) => a.remainingTimeMs - b.remainingTimeMs);

  return ResponseUtility.SUCCESS({
    message: 'Matches fetched successfully.',
    data: {
      matches: validMatches,
      pagination: {
        page, limit, total: totalCount, hasMore: page * limit < totalCount,
      },
    },
  });
};
