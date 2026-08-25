import DateRequestModel from './dateRequestSchema.js';
import MatchModel from './schema.js';
import { UserModel } from '../index.js';
import { ResponseUtility } from '../../utility/index.js';
import { DATE_REQUEST_STATUS, PLAN_DATE_EXPIRY_HOURS, MATCH_STATUS } from '../../constants.js';

const VALID_FILTERS = ['their_turn', 'your_turn'];

export default async ({
  userId, filter = 'their_turn', page = 1, limit = 10,
}) => {
  if (!VALID_FILTERS.includes(filter)) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: `Invalid filter. Must be one of: ${VALID_FILTERS.join(', ')}` });
  }

  const query = { deleted: false, status: DATE_REQUEST_STATUS.PENDING };
  if (filter === 'their_turn') {
    query.senderRef = userId;
  } else {
    query.receiverRef = userId;
  }

  const [requests, totalCount] = await Promise.all([
    DateRequestModel.find(query).sort({ createdOn: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    DateRequestModel.countDocuments(query),
  ]);

  if (!requests.length) {
    return ResponseUtility.SUCCESS({
      message: 'No requests found.',
      data: {
        requests: [], filter, pagination: {
          page, limit, total: 0, hasMore: false,
        },
      },
    });
  }

  const now = Date.now();

  const userMatches = await MatchModel.find({
    $or: [{ user1Ref: userId }, { user2Ref: userId }], deleted: false, status: MATCH_STATUS.ACTIVE,
  }).lean();

  const matchExpiryMap = {};
  userMatches.forEach((match) => {
    const otherUser = match.user1Ref.toString() === userId.toString() ? match.user2Ref.toString() : match.user1Ref.toString();
    const createdAtMs = new Date(match.createdOn).getTime();
    const expiryTimeMs = createdAtMs + PLAN_DATE_EXPIRY_HOURS * 3600000;
    const remainingMs = expiryTimeMs - now;
    const remainingHours = Math.max(0, Math.floor(remainingMs / 3600000));
    matchExpiryMap[otherUser] = {
      expiresAt: new Date(expiryTimeMs), remainingMs, remainingHours, remainingDays: Math.floor(remainingHours / 24),
    };
  });

  const requestList = await Promise.all(requests.map(async (req) => {
    const otherUserId = filter === 'their_turn' ? req.receiverRef : req.senderRef;
    const expiry = matchExpiryMap[otherUserId?.toString()];

    if (!expiry || expiry.remainingMs <= 0) return null;

    const otherUser = await UserModel.findOne({ _id: otherUserId, deleted: false, blocked: false }).select('firstName photos');
    if (!otherUser) return null;

    const primaryPhoto = otherUser.photos?.length
      ? [...otherUser.photos].sort((a, b) => (a.order || 0) - (b.order || 0))[0].url
      : null;

    return {
      requestId: req._id,
      otherUser: { id: otherUser._id, firstName: otherUser.firstName, profilePicture: primaryPhoto },
      dateType: req.dateType,
      dateTime: req.dateTime,
      location: req.location,
      hasMessage: !!req.message,
      status: req.status,
      createdAt: req.createdOn,
      expiresAt: expiry.expiresAt,
      remainingHours: expiry.remainingHours,
      remainingDays: expiry.remainingDays,
      remainingMs: expiry.remainingMs,
      role: filter === 'their_turn' ? 'sender' : 'receiver',
    };
  }));

  const validRequests = requestList.filter(Boolean).sort((a, b) => a.remainingMs - b.remainingMs);

  return ResponseUtility.SUCCESS({
    message: 'Date requests fetched successfully.',
    data: {
      requests: validRequests,
      filter,
      pagination: {
        page, limit, total: totalCount, hasMore: page * limit < totalCount,
      },
    },
  });
};
