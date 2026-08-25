import DateRequestModel from '../matches/dateRequestSchema.js';
import DateFeedbackModel from './schema.js';
import { ResponseUtility, PropsValidationUtility } from '../../utility/index.js';
import { SUCCESS_CODE, DATE_REQUEST_STATUS, DATE_FEEDBACK_RATINGS } from '../../constants.js';

const FEEDBACK_DELAY_HOURS = 3;
const FEEDBACK_EXPIRY_DAYS = 7;

export default async ({
  userId, requestId, rating, noShowReported,
}) => {
  const { code, message } = PropsValidationUtility({ validProps: ['requestId'], sourceDocument: { requestId } });
  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message });
  }

  const request = await DateRequestModel.findOne({
    _id: requestId, $or: [{ senderRef: userId }, { receiverRef: userId }], deleted: false,
  });

  if (!request) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, httpStatus: 404, message: 'Date request not found.' });
  }

  if (request.status !== DATE_REQUEST_STATUS.ACCEPTED) {
    throw ResponseUtility.GENERIC_ERR({ message: 'Feedback can only be submitted for accepted dates.' });
  }

  const now = new Date();
  const dateStartTime = new Date(request.dateTime);
  const feedbackEligibleAt = new Date(dateStartTime.getTime() + FEEDBACK_DELAY_HOURS * 60 * 60 * 1000);
  const feedbackExpiresAt = new Date(dateStartTime.getTime() + FEEDBACK_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  if (now < feedbackEligibleAt) {
    throw ResponseUtility.GENERIC_ERR({ message: 'Feedback can be submitted only 3 hours after the scheduled date time.' });
  }
  if (now > feedbackExpiresAt) {
    throw ResponseUtility.GENERIC_ERR({ message: 'The feedback window for this date has expired.' });
  }

  const existingFeedback = await DateFeedbackModel.findOne({ dateRequestRef: requestId, submittedBy: userId });
  if (existingFeedback) {
    throw ResponseUtility.GENERIC_ERR({ code: 409, message: 'Feedback already submitted for this date.' });
  }

  const effectiveRating = noShowReported ? null : rating;

  if (!noShowReported && !effectiveRating) {
    throw ResponseUtility.GENERIC_ERR({ message: 'Either rating or no-show must be submitted.' });
  }

  if (effectiveRating && !DATE_FEEDBACK_RATINGS.includes(effectiveRating)) {
    throw ResponseUtility.GENERIC_ERR({ message: 'Invalid rating value.' });
  }

  const otherUserRef = request.senderRef.toString() === userId.toString() ? request.receiverRef : request.senderRef;

  await DateFeedbackModel.create({
    dateRequestRef: requestId,
    submittedBy: userId,
    otherUserRef,
    rating: effectiveRating,
    noShowReported: !!noShowReported,
  });

  await DateRequestModel.findByIdAndUpdate(requestId, { $set: { status: DATE_REQUEST_STATUS.COMPLETED } });

  let flow = 'THANK YOU';
  if (noShowReported) {
    flow = 'NO SHOW';
  } else if (['Very bad', 'Bad'].includes(effectiveRating)) {
    flow = 'NEGATIVE';
  }

  return ResponseUtility.SUCCESS({
    message: 'Date feedback submitted successfully.',
    data: { flow, status: DATE_REQUEST_STATUS.COMPLETED },
  });
};
