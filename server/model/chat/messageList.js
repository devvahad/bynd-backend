import { Types } from 'mongoose';
import { UserModel } from '../index.js';
import MessageModel from './messageSchema.js';
import { ResponseUtility } from '../../utility/index.js';
import { PAGINATION_LIMIT } from '../../constants.js';

export default async ({
  id, userRef, page = 1, limit = PAGINATION_LIMIT,
}) => {
  if (!userRef) {
    throw ResponseUtility.GENERIC_ERR({ message: 'UserRef is required' });
  }

  const user = await UserModel.findOne({ _id: id, deleted: false });
  if (!user) {
    throw ResponseUtility.GENERIC_ERR({ message: 'User not found' });
  }

  const now = new Date();

  await MessageModel.updateMany(
    { from: new Types.ObjectId(userRef), to: new Types.ObjectId(id), readAt: null },
    { $set: { readAt: now, deliveredAt: now } },
  );

  const messages = await MessageModel.aggregate([
    {
      $match: {
        $or: [
          { from: new Types.ObjectId(id), to: new Types.ObjectId(userRef) },
          { from: new Types.ObjectId(userRef), to: new Types.ObjectId(id) },
        ],
      },
    },
    { $sort: { createdOn: -1 } },
    { $skip: (page - 1) * limit },
    { $limit: limit },
    {
      $lookup: {
        from: 'messages',
        let: { replyToId: '$replyTo' },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$replyToId'] } } },
          { $project: { _id: 1, content: 1, messageType: 1, from: 1 } },
        ],
        as: 'replyToMessage',
      },
    },
    { $unwind: { path: '$replyToMessage', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        from: 1,
        to: 1,
        content: 1,
        messageType: 1,
        createdOn: 1,
        replyToMessage: 1,
        isSeen: { $cond: [{ $ifNull: ['$readAt', false] }, true, false] },
        isDelivered: { $cond: [{ $ifNull: ['$deliveredAt', false] }, true, false] },
        lastMessageTime: '$createdOn',
      },
    },
  ]);

  return ResponseUtility.SUCCESS_PAGINATION({
    data: messages, page, limit, hasMore: (messages || []).length === limit,
  });
};
