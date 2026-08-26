import { Types } from 'mongoose';
import DateRequestModel from './dateRequestSchema.js';
import MatchModel from './schema.js';
import { ResponseUtility } from '../../utility/index.js';
import { MATCH_STATUS, DATE_REQUEST_STATUS } from '../../constants.js';

const MIN_HOURS_AHEAD = 12;
const MAX_DAYS_AHEAD = 14;
const MIN_SPACING_HOURS = 2;

export default async ({ userId, selectedDate, matchedUserId }) => {
  if (!matchedUserId) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Matched user ID is required.' });
  }

  const userObjectId = new Types.ObjectId(userId);
  const matchObjectId = new Types.ObjectId(matchedUserId);

  const matchDoc = await MatchModel.findOne({ _id: matchObjectId, deleted: false }).lean();
  if (!matchDoc) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, httpStatus: 404, message: 'Match not found.' });
  }

  const otherUserId = matchDoc.user1Ref.toString() === userId ? matchDoc.user2Ref : matchDoc.user1Ref;
  const otherUserObjectId = new Types.ObjectId(otherUserId);

  const currentTime = new Date();
  const earliestTime = new Date(currentTime.getTime() + MIN_HOURS_AHEAD * 60 * 60 * 1000);
  const maxDate = new Date(currentTime.getTime() + MAX_DAYS_AHEAD * 24 * 60 * 60 * 1000);

  if (!selectedDate) {
    return ResponseUtility.SUCCESS({
      message: 'Date range information fetched successfully.',
      data: {
        earliestDateTime: earliestTime,
        maxDate,
        minHoursAhead: MIN_HOURS_AHEAD,
        maxDaysAhead: MAX_DAYS_AHEAD,
        minSpacingHours: MIN_SPACING_HOURS,
      },
    });
  }

  const selectedDateTime = new Date(selectedDate);

  if (selectedDateTime < earliestTime) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Selected date must be at least 12 hours from now.' });
  }
  if (selectedDateTime > maxDate) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Selected date cannot be more than 14 days from now.' });
  }

  const windowBefore = new Date(selectedDateTime.getTime() - MIN_SPACING_HOURS * 60 * 60 * 1000);
  const windowAfter = new Date(selectedDateTime.getTime() + MIN_SPACING_HOURS * 60 * 60 * 1000);

  const conflictingDateRequest = await DateRequestModel.findOne({
    dateTime: { $gt: windowBefore, $lt: windowAfter },
    status: { $in: [DATE_REQUEST_STATUS.PENDING, DATE_REQUEST_STATUS.ACCEPTED] },
    deleted: false,
    $or: [
      { senderRef: { $in: [userObjectId, otherUserObjectId] } },
      { receiverRef: { $in: [userObjectId, otherUserObjectId] } },
    ],
  }).lean();

  if (conflictingDateRequest) {
    const isOtherUserInvolved = conflictingDateRequest.senderRef.toString() === otherUserId.toString()
      || conflictingDateRequest.receiverRef.toString() === otherUserId.toString();

    const message = isOtherUserInvolved
      ? 'The other user already has a date request with someone else around this time.'
      : 'You already have a date request around this time.';

    throw ResponseUtility.GENERIC_ERR({
      code: 409,
      httpStatus: 409,
      message
    });
  }

  const conflictingMatch = await MatchModel.findOne({
    status: MATCH_STATUS.DATE_PLANNED,
    deleted: false,
    datePlanned: { $gt: windowBefore, $lt: windowAfter },
    $or: [
      { user1Ref: { $in: [userObjectId, otherUserObjectId] } },
      { user2Ref: { $in: [userObjectId, otherUserObjectId] } },
    ],
  }).lean();

  if (conflictingMatch) {
    throw ResponseUtility.GENERIC_ERR({
      code: 409,
      httpStatus: 409,
      message: 'This time slot conflicts with an already planned date. Please select a time at least 2 hours apart.',
    });
  }

  return ResponseUtility.SUCCESS({
    message: 'Selected time slot is available.',
    data: { selectedDateTime, isAvailable: true },
  });
};
