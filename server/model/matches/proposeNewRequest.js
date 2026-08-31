import { randomUUID } from 'crypto';
import DateRequestModel from './dateRequestSchema.js';
import MatchModel from './schema.js';
import { UserModel } from '../index.js';
import { ResponseUtility, PropsValidationUtility } from '../../utility/index.js';
import { UnifiedNotificationService } from '../../services/index.js';
import {
  SUCCESS_CODE, DATE_REQUEST_STATUS, MATCH_STATUS, FIRST_DATE_ACTIVITIES,
  PLAN_DATE_EXPIRY_HOURS, TYPE_OF_NOTIFICATIONS, DUPLICATE_KEY_ERROR_CODE,
} from '../../constants.js';

export default async ({
  userId, requestId, dateType, dateTime, location, message, proposalIdempotencyKey,
}) => {
  const { code, message: validationMessage } = PropsValidationUtility({
    validProps: ['dateType'],
    sourceDocument: { dateType, dateTime, location },
  });
  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message: validationMessage });
  }

  const currentTime = new Date();
  const idempotencyKey = proposalIdempotencyKey || randomUUID();

  if (!FIRST_DATE_ACTIVITIES.includes(dateType)) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: `Invalid date type. Must be one of: ${FIRST_DATE_ACTIVITIES.join(', ')}` });
  }

  if (message && message.length > 200) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Message cannot exceed 200 characters.' });
  }

  const existingProposalByKey = await DateRequestModel.findOne({ requestIdempotencyKey: idempotencyKey });
  if (existingProposalByKey) {
    throw ResponseUtility.GENERIC_ERR({ code: 409, message: 'This proposal has already been sent.' });
  }

  const originalRequest = await DateRequestModel.findOne({
    _id: requestId,
    $or: [{ senderRef: userId }, { receiverRef: userId }],
    status: { $in: [DATE_REQUEST_STATUS.PENDING, DATE_REQUEST_STATUS.ACCEPTED] },
    deleted: false,
  });

  if (!originalRequest) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, httpStatus: 404, message: 'Original date request not found or cannot be modified.' });
  }

  const match = await MatchModel.findOne({
    _id: originalRequest.matchRef, status: { $in: [MATCH_STATUS.ACTIVE, MATCH_STATUS.DATE_PLANNED] }, deleted: false,
  });

  if (!match) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, httpStatus: 404, message: 'Match not found or already expired.' });
  }

  const expiryTimeMs = new Date(match.createdOn).getTime() + PLAN_DATE_EXPIRY_HOURS * 3600000;
  if (Date.now() > expiryTimeMs) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'This match has expired. You can no longer send a counter-proposal.' });
  }

  const newReceiverId = originalRequest.senderRef.toString() === userId.toString()
    ? originalRequest.receiverRef
    : originalRequest.senderRef;

  const [proposer, newReceiver] = await Promise.all([
    UserModel.findOne({ _id: userId, blocked: false, deleted: false }),
    UserModel.findOne({ _id: newReceiverId, blocked: false, deleted: false }),
  ]);

  if (!proposer || !newReceiver) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, httpStatus: 404, message: 'One or both users are unavailable.' });
  }

  let selectedDateTime = originalRequest.dateTime;

  if (dateTime) {
    selectedDateTime = new Date(dateTime);
    const earliestTime = new Date(currentTime.getTime() + 12 * 60 * 60 * 1000);
    const maxDate = new Date(currentTime.getTime() + 14 * 24 * 60 * 60 * 1000);

    if (selectedDateTime < earliestTime) {
      throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Date must be at least 12 hours from now.' });
    }
    if (selectedDateTime > maxDate) {
      throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Date cannot be more than 14 days from now.' });
    }
  }

  const twoHoursBefore = new Date(selectedDateTime.getTime() - 2 * 60 * 60 * 1000);
  const twoHoursAfter = new Date(selectedDateTime.getTime() + 2 * 60 * 60 * 1000);

  const conflictCount = await DateRequestModel.countDocuments({
    $or: [{ senderRef: userId }, { receiverRef: userId }],
    dateTime: { $gt: twoHoursBefore, $lt: twoHoursAfter },
    status: { $in: [DATE_REQUEST_STATUS.PENDING, DATE_REQUEST_STATUS.ACCEPTED] },
    deleted: false,
  });

  if (conflictCount > 0) {
    throw ResponseUtility.GENERIC_ERR({ code: 409, httpStatus: 409, message: 'This time conflicts with an existing date. Please choose a time at least 2 hours apart.' });
  }

  try {
    await DateRequestModel.findByIdAndUpdate(requestId, {
      $set: {
        status: DATE_REQUEST_STATUS.SUPERSEDED,
        responseMessage: `Counter-proposal sent by ${proposer.firstName}`,
        respondedAt: currentTime,
      },
    });

    const savedProposal = await DateRequestModel.create({
      matchRef: originalRequest.matchRef,
      senderRef: userId,
      receiverRef: newReceiverId,
      dateType,
      dateTime: selectedDateTime,
      location: location
        ? {
          name: location.name,
          address: location.address,
          placeId: location.placeId || null,
          coordinates: { type: 'Point', coordinates: [location.coordinates.lng, location.coordinates.lat] },
        }
        : originalRequest.location,
      message: message || null,
      status: DATE_REQUEST_STATUS.PENDING,
      requestIdempotencyKey: idempotencyKey,
      originalRequestRef: requestId,
      isCounterProposal: true,
    });

    const isAcceptedRequest = originalRequest.status === DATE_REQUEST_STATUS.ACCEPTED;
    await MatchModel.findByIdAndUpdate(originalRequest.matchRef, {
      $set: { ...(isAcceptedRequest && { status: MATCH_STATUS.ACTIVE }) },
    });

    UnifiedNotificationService({
      userId: newReceiverId,
      title: 'Date Rescheduled',
      subtitle: `${proposer.firstName} rescheduled your date.`,
      type: TYPE_OF_NOTIFICATIONS.DATE_REQUEST,
      reference: savedProposal._id.toString(),
      payload: {
        event: 'DATE_REQUEST_RESCHEDULED', matchId: match._id.toString(), dateRequestId: savedProposal._id.toString(),
      },
    }).catch(() => { });

    return ResponseUtility.SUCCESS({
      message: 'Counter-proposal sent successfully.',
      data: {
        proposalId: savedProposal._id,
        matchId: match._id,
        receiver: { id: newReceiver._id, name: newReceiver.firstName },
        dateType,
        dateTime: selectedDateTime,
        location: location ? location.name : originalRequest.location.name,
        status: DATE_REQUEST_STATUS.PENDING,
      },
    });
  } catch (err) {
    if (err.code === DUPLICATE_KEY_ERROR_CODE) {
      throw ResponseUtility.GENERIC_ERR({ code: 409, message: 'Duplicate proposal detected.' });
    }
    if (err.success !== undefined) throw err;
    throw ResponseUtility.GENERIC_ERR({ message: 'Failed to send counter-proposal.', error: err.message });
  }
};
