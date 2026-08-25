import { Types } from 'mongoose';
import { UserModel } from '../index.js';
import BlockUserModel from './blockUserSchema.js';
import ReportModel from './reportSchema.js';
import MatchModel from '../matches/schema.js';
import { ResponseUtility } from '../../utility/index.js';
import { USER_CHAT_ACTION, MATCH_STATUS } from '../../constants.js';

export default async ({
  id, userRef, action, comment,
}) => {
  if (!id || !userRef || !action) {
    throw ResponseUtility.GENERIC_ERR({ message: 'UserRef and action are required' });
  }

  const users = await UserModel.find({
    _id: { $in: [id, userRef].map((u) => new Types.ObjectId(u)) }, deleted: false,
  }).select('_id reportedUsers reportedBy');

  if (users.length !== 2) {
    throw ResponseUtility.GENERIC_ERR({ message: 'User not found' });
  }

  if (action === USER_CHAT_ACTION.BLOCK) {
    const alreadyBlocked = await BlockUserModel.findOne({ blockedBy: id, userRef });
    if (alreadyBlocked) {
      throw ResponseUtility.GENERIC_ERR({ message: 'You have already blocked this user' });
    }

    await MatchModel.findOneAndUpdate(
      {
        $or: [{ user1Ref: id, user2Ref: userRef }, { user1Ref: userRef, user2Ref: id }],
        status: MATCH_STATUS.DATE_PLANNED,
        deleted: false,
      },
      { $set: { status: MATCH_STATUS.UNMATCHED, deleted: true, unmatchedBy: id, unmatchedOn: new Date() } },
    );

    await BlockUserModel.create({ userRef, blockedBy: id });

    return ResponseUtility.SUCCESS({ message: 'User has been blocked' });
  }

  if (action === USER_CHAT_ACTION.UNMATCH) {
    await MatchModel.findOneAndUpdate(
      {
        $or: [{ user1Ref: id, user2Ref: userRef }, { user1Ref: userRef, user2Ref: id }],
        status: MATCH_STATUS.DATE_PLANNED,
        deleted: false,
      },
      {
        $set: {
          status: MATCH_STATUS.UNMATCHED, deleted: true, unmatchedBy: id, source: 'CHAT', unmatchedOn: new Date(),
        },
      },
    );

    return ResponseUtility.SUCCESS({ message: 'User has been removed from match' });
  }

  if (action === USER_CHAT_ACTION.REPORT) {
    const { category, subOption } = comment || {};

    if (!category) {
      throw ResponseUtility.GENERIC_ERR({ message: 'Report category is required' });
    }

    const existingReport = await ReportModel.findOne({
      reporterId: id, reportedUserId: userRef, category, subOption,
    });

    if (!existingReport) {
      await ReportModel.create({
        reporterId: id, reportedUserId: userRef, category, subOption, source: 'CHAT',
      });
    }

    await MatchModel.findOneAndUpdate(
      {
        $or: [{ user1Ref: id, user2Ref: userRef }, { user1Ref: userRef, user2Ref: id }],
        status: { $ne: MATCH_STATUS.UNMATCHED },
        deleted: false,
      },
      { $set: { status: MATCH_STATUS.UNMATCHED, deleted: true, unmatchedBy: id, unmatchedOn: new Date() } },
    );

    await Promise.all([
      UserModel.findByIdAndUpdate(id, { $addToSet: { reportedUsers: userRef } }),
      UserModel.findByIdAndUpdate(userRef, { $addToSet: { reportedBy: id } }),
    ]);

    return ResponseUtility.SUCCESS({ message: 'Report submitted successfully.' });
  }

  throw ResponseUtility.GENERIC_ERR({ message: 'Invalid action provided' });
};
