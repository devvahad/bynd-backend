import DateRequestModel from './dateRequestSchema.js';
import MatchModel from './schema.js';
import { UserModel } from '../index.js';
import LikeModel from '../like/schema.js';
import { ResponseUtility, PropsValidationUtility } from '../../utility/index.js';
import { UnifiedNotificationService } from '../../services/index.js';
import {
  SUCCESS_CODE, DATE_REQUEST_STATUS, MATCH_STATUS, PLAN_DATE_EXPIRY_HOURS, TYPE_OF_NOTIFICATIONS,
} from '../../constants.js';

export default async ({ userId, requestId, declineReason }) => {
  const { code, message } = PropsValidationUtility({ validProps: ['requestId'], sourceDocument: { requestId } });
  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message });
  }

  const request = await DateRequestModel.findOne({
    _id: requestId, receiverRef: userId, status: DATE_REQUEST_STATUS.PENDING, deleted: false,
  });

  if (!request) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, httpStatus: 404, message: 'Date request not found or cannot be declined.' });
  }

  const match = await MatchModel.findOne({ _id: request.matchRef, status: MATCH_STATUS.ACTIVE, deleted: false });
  if (!match) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, httpStatus: 404, message: 'Match not found or already expired.' });
  }

  const expiryTimeMs = new Date(match.createdOn).getTime() + PLAN_DATE_EXPIRY_HOURS * 3600000;
  if (Date.now() > expiryTimeMs) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'This match has expired. You cannot decline this request as it is no longer active.' });
  }

  const [sender, receiver] = await Promise.all([
    UserModel.findOne({ _id: request.senderRef, blocked: false, deleted: false }).select('firstName'),
    UserModel.findOne({ _id: userId, blocked: false, deleted: false }).select('firstName'),
  ]);

  if (!sender || !receiver) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, httpStatus: 404, message: 'User not found or unavailable.' });
  }

  const currentTime = new Date();

  await Promise.all([
    DateRequestModel.findByIdAndUpdate(requestId, {
      $set: {
        status: DATE_REQUEST_STATUS.REJECTED,
        responseMessage: declineReason || `${receiver.firstName} declined the date request`,
        respondedAt: currentTime,
      },
    }),
    MatchModel.findByIdAndUpdate(request.matchRef, { $set: { status: MATCH_STATUS.UNMATCHED, deleted: true } }),
    LikeModel.updateMany(
      {
        deleted: false,
        $or: [
          { userRef: request.senderRef, likedUserRef: userId },
          { userRef: userId, likedUserRef: request.senderRef },
        ],
      },
      { $set: { deleted: true } },
    ),
  ]);
  
  UnifiedNotificationService({
    userId: request.senderRef,
    title: 'Date Request Declined',
    subtitle: `${receiver.firstName} declined your date request.`,
    type: TYPE_OF_NOTIFICATIONS.DATE_REQUEST,
    reference: request._id.toString(),
    payload: {
      event: 'DATE_REQUEST_REJECTED', matchId: request.matchRef.toString(), dateRequestId: request._id.toString(), declinedBy: userId.toString(),
    },
  }).catch(() => {});

  return ResponseUtility.SUCCESS({
    message: 'Date request declined successfully.',
    data: {
      requestId: request._id,
      status: DATE_REQUEST_STATUS.REJECTED,
      declinedAt: currentTime,
      matchRemoved: true,
      note: 'You may see this person again in the People page.',
    },
  });
};
