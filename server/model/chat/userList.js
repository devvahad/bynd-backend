import { Types } from 'mongoose';
import { UserModel } from '../index.js';
import MessageModel from './messageSchema.js';
import ReportModel from './reportSchema.js';
import MatchModel from '../matches/schema.js';
import { ResponseUtility } from '../../utility/index.js';
import { PAGINATION_LIMIT, CHAT_FILTER_TYPES, MATCH_STATUS } from '../../constants.js';

export default async ({
  id, text = '', filterType, page = 1, limit = PAGINATION_LIMIT,
}) => {
  const userId = new Types.ObjectId(id);

  const user = await UserModel.findOne({ _id: userId, deleted: false });
  if (!user) {
    throw ResponseUtility.GENERIC_ERR({ message: 'User not found' });
  }

  let filterStage = null;
  if (filterType === CHAT_FILTER_TYPES.UNREAD) {
    filterStage = { $match: { unreadCount: { $gt: 0 } } };
  } else if (filterType === CHAT_FILTER_TYPES.READ) {
    filterStage = { $match: { unreadCount: 0 } };
  } else if (filterType === CHAT_FILTER_TYPES.SENT_UNREAD) {
    filterStage = { $match: { lastMessageFrom: userId, unreadCount: 0 } };
  }

  const recentChats = await MessageModel.aggregate([
    { $match: { $or: [{ from: userId }, { to: userId }] } },
    {
      $project: {
        content: 1,
        sentAt: 1,
        createdOn: 1,
        from: 1,
        to: 1,
        readAt: 1,
        deliveredAt: 1,
        messageType: 1,
        otherUser: { $cond: [{ $eq: ['$from', userId] }, '$to', '$from'] },
      },
    },
    { $sort: { createdOn: -1 } },
    {
      $group: {
        _id: '$otherUser',
        lastMessage: { $first: '$content' },
        lastMessageFrom: { $first: '$from' },
        lastMessageId: { $first: '$_id' },
        lastMessageTime: { $first: '$sentAt' },
        messageType: { $first: '$messageType' },
        readAt: { $first: '$readAt' },
        isDelivered: { $first: { $cond: [{ $ifNull: ['$deliveredAt', false] }, true, false] } },
        isSeen: { $first: { $cond: [{ $ifNull: ['$readAt', false] }, true, false] } },
      },
    },
    {
      $lookup: {
        from: UserModel.collection.name,
        let: { otherUserId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$otherUserId'] } } },
          { $project: { firstName: 1, photos: 1, blocked: 1, deleted: 1 } },
        ],
        as: 'userDetails',
      },
    },
    { $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: false } },
    { $match: { 'userDetails.deleted': false, 'userDetails.blocked': false } },
    {
      $lookup: {
        from: 'blockusers',
        let: { otherUserId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  { $and: [{ $eq: ['$userRef', '$$otherUserId'] }, { $eq: ['$blockedBy', userId] }] },
                  { $and: [{ $eq: ['$userRef', userId] }, { $eq: ['$blockedBy', '$$otherUserId'] }] },
                ],
              },
            },
          },
        ],
        as: 'blockData',
      },
    },
    {
      $lookup: {
        from: MatchModel.collection.name,
        let: { otherUserId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  { $and: [{ $eq: ['$user1Ref', userId] }, { $eq: ['$user2Ref', '$$otherUserId'] }] },
                  { $and: [{ $eq: ['$user2Ref', userId] }, { $eq: ['$user1Ref', '$$otherUserId'] }] },
                ],
              },
            },
          },
          { $match: { deleted: false, status: MATCH_STATUS.DATE_PLANNED } },
        ],
        as: 'matchData',
      },
    },
    {
      $lookup: {
        from: ReportModel.collection.name,
        let: { otherUserId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  { $and: [{ $eq: ['$reporterId', userId] }, { $eq: ['$reportedUserId', '$$otherUserId'] }] },
                  { $and: [{ $eq: ['$reporterId', '$$otherUserId'] }, { $eq: ['$reportedUserId', userId] }] },
                ],
              },
            },
          },
        ],
        as: 'reportData',
      },
    },
    { $match: { $expr: { $and: [{ $eq: [{ $size: '$blockData' }, 0] }, { $eq: [{ $size: '$reportData' }, 0] }] } } },
    {
      $match: {
        $expr: {
          $or: [
            { $eq: [text, ''] },
            { $regexMatch: { input: '$userDetails.firstName', regex: text, options: 'i' } },
          ],
        },
      },
    },
    {
      $lookup: {
        from: MessageModel.collection.name,
        let: { otherUserId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$from', '$$otherUserId'] },
                  { $eq: ['$to', userId] },
                  { $eq: ['$readAt', null] },
                ],
              },
            },
          },
          { $count: 'count' },
        ],
        as: 'unreadMessages',
      },
    },
    { $addFields: { unreadCount: { $ifNull: [{ $arrayElemAt: ['$unreadMessages.count', 0] }, 0] } } },
    {
      $project: {
        userId: '$_id',
        firstName: '$userDetails.firstName',
        photo: { $arrayElemAt: ['$userDetails.photos', 0] },
        lastMessage: 1,
        lastMessageId: 1,
        lastMessageTime: 1,
        lastMessageFrom: 1,
        messageType: 1,
        unreadCount: 1,
        isSeen: 1,
        isDelivered: 1,
      },
    },
    ...(filterStage ? [filterStage] : []),
    { $sort: { lastMessageTime: -1 } },
    { $skip: (page - 1) * limit },
    { $limit: limit },
  ]);

  return ResponseUtility.SUCCESS_PAGINATION({
    data: recentChats, page, limit, hasMore: recentChats.length === limit,
  });
};
