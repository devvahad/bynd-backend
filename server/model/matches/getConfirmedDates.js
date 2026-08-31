import { Types } from 'mongoose';
import DateRequestModel from './dateRequestSchema.js';
import MatchModel from './schema.js';
import { UserModel } from '../index.js';
import MessageModel from '../chat/messageSchema.js';
import BlockUserModel from '../chat/blockUserSchema.js';
import DateFeedbackModel from '../date/schema.js';
import { ResponseUtility } from '../../utility/index.js';
import { DATE_REQUEST_STATUS, MATCH_STATUS } from '../../constants.js';

export default async ({ userId, page = 1, limit = 10 }) => {
  const currentTime = new Date();

  const loggedUser = await UserModel.findById(userId).select('reportedUsers reportedBy');

  const CHAT_WINDOW_HOURS = 24;
  const FEEDBACK_DELAY_HOURS = 3;
  const FEEDBACK_EXPIRY_DAYS = 7;
  const completedVisibleAfter = new Date(
    currentTime.getTime() - CHAT_WINDOW_HOURS * 60 * 60 * 1000
  );

  const query = {
    $or: [{ senderRef: userId }, { receiverRef: userId }],
    $and: [
      {
        $or: [
          { status: DATE_REQUEST_STATUS.ACCEPTED },
          { status: DATE_REQUEST_STATUS.COMPLETED, dateTime: { $gte: completedVisibleAfter } },
        ],
      },
    ],
    deleted: false,
  };

  const [dates, totalCount] = await Promise.all([
    DateRequestModel.find(query).sort({ dateTime: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    DateRequestModel.countDocuments(query),
  ]);

  if (!dates.length) {
    return ResponseUtility.SUCCESS({
      message: 'No confirmed dates found.',
      data: { dates: [], pagination: { page, limit, total: 0, hasMore: false } },
    });
  }

  const matchIds = dates.map((d) => d.matchRef);
  const dateIds = dates.map((d) => d._id);

  const otherUserIds = dates.map((date) => (
    date.senderRef.toString() === userId.toString() ? date.receiverRef : date.senderRef
  ));

  const [feedbacks, otherUsers, matches, blocks, unreadAggregation] = await Promise.all([
    DateFeedbackModel.find({ dateRequestRef: { $in: dateIds }, submittedBy: userId, deleted: false }).select('dateRequestRef'),
    UserModel.find({ _id: { $in: otherUserIds }, blocked: false, deleted: false }).select('firstName photos'),
    MatchModel.find({ _id: { $in: matchIds } }).select('unmatchedOn deleted status'),
    BlockUserModel.find({ $or: [{ blockedBy: userId }, { userRef: userId }] }).select('blockedBy userRef'),
    MessageModel.aggregate([
      { $match: { to: new Types.ObjectId(userId), readAt: null } },
      { $group: { _id: '$from', count: { $sum: 1 } } },
    ]),
  ]);

  const ratedSet = new Set(feedbacks.map((f) => f.dateRequestRef.toString()));

  const userMap = {};
  otherUsers.forEach((user) => { userMap[user._id.toString()] = user; });

  const matchMap = {};
  matches.forEach((m) => { matchMap[m._id.toString()] = m; });

  const blockedSet = new Set();
  blocks.forEach((b) => {
    if (b.blockedBy.toString() === userId.toString()) blockedSet.add(b.userRef.toString());
    if (b.userRef.toString() === userId.toString()) blockedSet.add(b.blockedBy.toString());
  });

  const unreadMap = {};
  unreadAggregation.forEach((item) => { unreadMap[item._id.toString()] = item.count; });

  const datesList = dates.map((date) => {
    const isSender = date.senderRef.toString() === userId.toString();
    const otherUserId = isSender ? date.receiverRef.toString() : date.senderRef.toString();

    const otherUser = userMap[otherUserId];
    if (!otherUser) return null;

    const matchDoc = matchMap[date.matchRef?.toString()];
    if (!matchDoc || matchDoc.deleted === true || matchDoc.status === MATCH_STATUS.UNMATCHED) {
      return null;
    }
    const unreadCount = unreadMap[otherUserId] || 0;
    const hasReported = loggedUser?.reportedUsers?.map(String).includes(otherUserId) || false;
    const hasBlocked = blockedSet.has(otherUserId);
    const hasUnmatched =
      matchDoc.deleted === true
      || matchDoc.status === MATCH_STATUS.UNMATCHED
      || !!matchDoc.unmatchedOn;

    let isChatEnabled = false;
    if (
      [DATE_REQUEST_STATUS.ACCEPTED, DATE_REQUEST_STATUS.COMPLETED].includes(date.status)
      && !hasBlocked
      && !hasUnmatched
    ) {
      const dateTime = new Date(date.dateTime);
      const start = new Date(dateTime);
      start.setHours(start.getHours() - 24);
      const end = new Date(dateTime);
      end.setHours(end.getHours() + 24);
      isChatEnabled = currentTime >= start && currentTime <= end;
    }

    const addressParts = date.location.address?.split(',').map((p) => p.trim());
    let city = null;
    let state = null;
    if (addressParts?.length >= 2) {
      city = addressParts[addressParts.length - 3] || null;
      const stateMatch = addressParts[addressParts.length - 2]?.match(/^([A-Z]{2})/);
      if (stateMatch) [, state] = stateMatch;
    }

    return {
      dateId: date._id,
      isRated: ratedSet.has(date._id.toString()),
      otherUser: { id: otherUser._id, firstName: otherUser.firstName, photos: otherUser.photos?.map((p) => p.url) || [] },
      dateType: date.dateType,
      dateTime: date.dateTime,
      location: {
        name: date.location.name,
        address: date.location.address,
        city,
        state,
        coordinates: date.location.coordinates?.coordinates
          ? { lat: date.location.coordinates.coordinates[1], lng: date.location.coordinates.coordinates[0] }
          : null,
      },
      status: date.status,
      acceptedAt: date.respondedAt,
      unreadCount,
      hasReported,
      hasBlocked,
      hasUnmatched,
      isChatEnabled,
      feedback: (() => {
        const dateStartTime = new Date(date.dateTime);
        const feedbackEligibleAt = new Date(dateStartTime.getTime() + FEEDBACK_DELAY_HOURS * 60 * 60 * 1000);
        const feedbackExpiresAt = new Date(dateStartTime.getTime() + FEEDBACK_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
        return {
          canShow: date.status === DATE_REQUEST_STATUS.ACCEPTED
            && currentTime >= feedbackEligibleAt
            && currentTime <= feedbackExpiresAt
            && !ratedSet.has(date._id.toString()),
          eligibleAt: feedbackEligibleAt,
          expiresAt: feedbackExpiresAt,
        };
      })(),
    };
  }).filter(Boolean);

  return ResponseUtility.SUCCESS({
    message: 'Confirmed dates fetched successfully.',
    data: {
      dates: datesList,
      pagination: {
        page, limit, total: totalCount, hasMore: page * limit < totalCount,
      },
    },
  });
};
