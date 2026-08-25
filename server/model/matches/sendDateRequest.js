import { randomUUID } from 'crypto';
import DateRequestModel from './dateRequestSchema.js';
import MatchModel from './schema.js';
import { UserModel } from '../index.js';
import { ResponseUtility, PropsValidationUtility } from '../../utility/index.js';
import { UnifiedNotificationService } from '../../services/index.js';
import {
  SUCCESS_CODE, MATCH_STATUS, DATE_REQUEST_STATUS, FIRST_DATE_ACTIVITIES,
  TYPE_OF_NOTIFICATIONS, PLAN_DATE_EXPIRY_HOURS, DUPLICATE_KEY_ERROR_CODE,
} from '../../constants.js';

const FREE_USER_DAILY_REQUEST_LIMIT = 2;

export default async ({
  userId, matchId, dateType, dateTime, location, message, requestIdempotencyKey,
}) => {
  const { code, message: validationMessage } = PropsValidationUtility({
    validProps: ['matchId', 'dateType', 'dateTime', 'location'],
    sourceDocument: {
      matchId, dateType, dateTime, location,
    },
  });
  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message: validationMessage });
  }

  const idempotencyKey = requestIdempotencyKey || randomUUID();

  if (!FIRST_DATE_ACTIVITIES.includes(dateType)) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: `Invalid date type. Must be one of: ${FIRST_DATE_ACTIVITIES.join(', ')}` });
  }

  if (!location.name || !location.address || !location.coordinates) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Location must include name, address, and coordinates.' });
  }

  if (message && message.length > 200) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Message cannot exceed 200 characters.' });
  }

  const existingRequestByKey = await DateRequestModel.findOne({ requestIdempotencyKey: idempotencyKey });
  if (existingRequestByKey) {
    throw ResponseUtility.GENERIC_ERR({ code: 409, message: 'This date request has already been sent.' });
  }

  const match = await MatchModel.findOne({
    _id: matchId, $or: [{ user1Ref: userId }, { user2Ref: userId }], status: MATCH_STATUS.ACTIVE, deleted: false,
  });

  if (!match) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, httpStatus: 404, message: 'Match not found or expired.' });
  }

  const expiryTimeMs = new Date(match.createdOn).getTime() + PLAN_DATE_EXPIRY_HOURS * 3600000;
  if (Date.now() > expiryTimeMs) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'This match has expired. You can no longer send a date request.' });
  }

  const receiverId = match.user1Ref.toString() === userId.toString() ? match.user2Ref : match.user1Ref;

  const [sender, receiver] = await Promise.all([
    UserModel.findOne({ _id: userId, blocked: false, deleted: false }),
    UserModel.findOne({ _id: receiverId, blocked: false, deleted: false }).select('firstName age photos deviceToken deviceType'),
  ]);

  if (!sender || !receiver) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, httpStatus: 404, message: 'One or both users are unavailable.' });
  }

  const receiverPrimaryPhoto = receiver.photos?.find((p) => p.order === 0)?.url || null;

  try {
    if (!sender.isPremium) {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const countLast24Hours = await DateRequestModel.countDocuments({
        senderRef: userId, createdOn: { $gte: twentyFourHoursAgo }, deleted: false,
      });
      if (countLast24Hours >= FREE_USER_DAILY_REQUEST_LIMIT) {
        throw ResponseUtility.GENERIC_ERR({
          code: 429, httpStatus: 429,
          message: 'Free users can send only 2 date requests every 24 hours. Upgrade to premium for unlimited requests.',
        });
      }
    }

    const existingRequest = await DateRequestModel.findOne({
      matchRef: matchId, senderRef: userId, receiverRef: receiverId, status: DATE_REQUEST_STATUS.PENDING, deleted: false,
    });

    const buildLocationDoc = () => ({
      name: location.name,
      address: location.address,
      placeId: location.placeId || null,
      coordinates: { type: 'Point', coordinates: [location.coordinates.lng, location.coordinates.lat] },
    });

    if (existingRequest) {
      existingRequest.dateType = dateType;
      existingRequest.dateTime = new Date(dateTime);
      existingRequest.location = buildLocationDoc();
      existingRequest.message = message || null;
      const savedRequest = await existingRequest.save();

      return ResponseUtility.SUCCESS({
        message: 'Date request updated successfully.',
        data: {
          requestId: savedRequest._id,
          matchId: match._id,
          receiver: {
            id: receiver._id, name: receiver.firstName, age: receiver.age, profilePicture: receiverPrimaryPhoto,
          },
          dateType,
          dateTime: savedRequest.dateTime,
          weekday: savedRequest.dateTime.toLocaleString('en-US', { weekday: 'long' }),
          location: location.name,
          status: DATE_REQUEST_STATUS.PENDING,
        },
      });
    }

    const selectedDateTime = new Date(dateTime);
    const currentTime = new Date();
    const earliestTime = new Date(currentTime.getTime() + 12 * 60 * 60 * 1000);
    const maxDate = new Date(currentTime.getTime() + 14 * 24 * 60 * 60 * 1000);

    if (selectedDateTime < earliestTime) {
      throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Date must be at least 12 hours from now.' });
    }
    if (selectedDateTime > maxDate) {
      throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Date cannot be more than 14 days from now.' });
    }

    const oneHourBefore = new Date(selectedDateTime.getTime() - 60 * 60 * 1000);
    const oneHourAfter = new Date(selectedDateTime.getTime() + 60 * 60 * 1000);

    const conflictCount = await DateRequestModel.countDocuments({
      $or: [{ senderRef: userId }, { receiverRef: userId }],
      dateTime: { $gte: oneHourBefore, $lte: oneHourAfter },
      status: { $in: [DATE_REQUEST_STATUS.PENDING, DATE_REQUEST_STATUS.ACCEPTED] },
      deleted: false,
    });

    if (conflictCount > 0) {
      throw ResponseUtility.GENERIC_ERR({ code: 409, httpStatus: 409, message: 'This time conflicts with an existing date. Please choose a time at least 1 hour apart.' });
    }

    const savedRequest = await DateRequestModel.create({
      matchRef: matchId,
      senderRef: userId,
      receiverRef: receiverId,
      dateType,
      dateTime: selectedDateTime,
      location: buildLocationDoc(),
      message: message || null,
      status: DATE_REQUEST_STATUS.PENDING,
      requestIdempotencyKey: idempotencyKey,
    });

    UnifiedNotificationService({
      userId: receiverId,
      title: 'New Date Request',
      subtitle: `${sender.firstName} sent you a ${dateType} date request at ${location.name}`,
      type: TYPE_OF_NOTIFICATIONS.DATE_REQUEST,
      reference: savedRequest._id.toString(),
      payload: {
        event: 'DATE_REQUEST',
        requestId: savedRequest._id.toString(),
        senderId: sender._id.toString(),
        senderName: sender.firstName,
        dateType,
        dateTime: selectedDateTime.toISOString(),
        location: location.name,
      },
    }).catch(() => {});

    return ResponseUtility.SUCCESS({
      message: 'Date request sent successfully.',
      data: {
        requestId: savedRequest._id,
        matchId: match._id,
        receiver: { id: receiver._id, name: receiver.firstName },
        dateType,
        dateTime: selectedDateTime,
        weekday: selectedDateTime.toLocaleString('en-US', { weekday: 'long' }),
        location: location.name,
        status: DATE_REQUEST_STATUS.PENDING,
      },
    });
  } catch (err) {
    if (err.code === DUPLICATE_KEY_ERROR_CODE) {
      throw ResponseUtility.GENERIC_ERR({ code: 409, message: 'Duplicate date request detected.' });
    }
    if (err.success !== undefined) throw err;
    throw ResponseUtility.GENERIC_ERR({ message: 'Failed to send date request.', error: err.message });
  }
};
