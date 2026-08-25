import DateRequestModel from './dateRequestSchema.js';
import MatchModel from './schema.js';
import { UserModel } from '../index.js';
import LikeModel from '../like/schema.js';
import { ResponseUtility, PropsValidationUtility } from '../../utility/index.js';
import { UnifiedNotificationService } from '../../services/index.js';
import {
  SUCCESS_CODE, DATE_REQUEST_STATUS, MATCH_STATUS, TYPE_OF_NOTIFICATIONS,
} from '../../constants.js';

export default async ({ userId, requestId }) => {
  const { code, message } = PropsValidationUtility({ validProps: ['requestId'], sourceDocument: { requestId } });
  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message });
  }

  const request = await DateRequestModel.findOne({
    _id: requestId,
    $or: [{ senderRef: userId }, { receiverRef: userId }],
    status: { $in: [DATE_REQUEST_STATUS.PENDING, DATE_REQUEST_STATUS.ACCEPTED] },
    deleted: false,
  });

  if (!request) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, httpStatus: 404, message: 'Date request not found or cannot be cancelled.' });
  }

  const isSender = request.senderRef.toString() === userId.toString();
  const now = new Date();

  const [updatedRequest] = await Promise.all([
    DateRequestModel.findByIdAndUpdate(
      requestId,
      { $set: { status: DATE_REQUEST_STATUS.CANCELLED, respondedAt: now } },
      { new: true },
    ),
    MatchModel.updateOne(
      {
        $or: [
          { user1Ref: request.senderRef, user2Ref: request.receiverRef },
          { user1Ref: request.receiverRef, user2Ref: request.senderRef },
        ],
        deleted: false,
      },
      { $set: { status: MATCH_STATUS.UNMATCHED, unmatchedBy: userId, unmatchedOn: now } },
    ),
    LikeModel.updateMany(
      {
        $or: [
          { userRef: userId, likedUserRef: request.receiverRef, deleted: false },
          { userRef: request.receiverRef, likedUserRef: userId, deleted: false },
        ],
      },
      { $set: { deleted: true } },
    ),
  ]);

  const notifyUserId = isSender ? request.receiverRef : request.senderRef;

  const [notifiedUser, cancellingUser] = await Promise.all([
    UserModel.findById(notifyUserId).select('firstName'),
    UserModel.findById(userId).select('firstName'),
  ]);

  if (notifiedUser && cancellingUser) {
    UnifiedNotificationService({
      userId: notifyUserId,
      title: 'Date Cancelled',
      subtitle: `${cancellingUser.firstName} cancelled your date.`,
      type: TYPE_OF_NOTIFICATIONS.DATE_REQUEST,
      reference: updatedRequest._id.toString(),
      payload: { event: 'DATE_REQUEST_CANCELLED', dateRequestId: updatedRequest._id.toString(), cancelledBy: userId.toString() },
    }).catch(() => {});
  }

  return ResponseUtility.SUCCESS({
    message: 'Date request cancelled successfully.',
    data: {
      requestId: updatedRequest._id,
      status: updatedRequest.status,
      cancelledAt: updatedRequest.respondedAt,
    },
  });
};
