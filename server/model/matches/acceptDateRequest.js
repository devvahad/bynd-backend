import DateRequestModel from './dateRequestSchema.js';
import MatchModel from './schema.js';
import { UserModel } from '../index.js';
import { ResponseUtility, PropsValidationUtility } from '../../utility/index.js';
import { UnifiedNotificationService } from '../../services/index.js';
import {
  SUCCESS_CODE, DATE_REQUEST_STATUS, MATCH_STATUS, PLAN_DATE_EXPIRY_HOURS, TYPE_OF_NOTIFICATIONS,
} from '../../constants.js';

export default async ({ userId, requestId }) => {
  const { code, message } = PropsValidationUtility({ validProps: ['requestId'], sourceDocument: { requestId } });
  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message });
  }

  const request = await DateRequestModel.findOne({
    _id: requestId, receiverRef: userId, status: DATE_REQUEST_STATUS.PENDING, deleted: false,
  });

  if (!request) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, httpStatus: 404, message: 'Date request not found or cannot be accepted.' });
  }

  const match = await MatchModel.findOne({ _id: request.matchRef, status: MATCH_STATUS.ACTIVE, deleted: false });
  if (!match) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, httpStatus: 404, message: 'Match not found or expired.' });
  }

  const expiryTimeMs = new Date(match.createdOn).getTime() + PLAN_DATE_EXPIRY_HOURS * 3600000;
  if (Date.now() > expiryTimeMs) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'This match has expired. You can no longer accept this date request.' });
  }

  const currentTime = new Date();
  const requestDateTime = new Date(request.dateTime);
  if (requestDateTime < currentTime) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Cannot accept an expired date request.' });
  }

  const [sender, receiver] = await Promise.all([
    UserModel.findOne({ _id: request.senderRef, blocked: false, deleted: false }).select('firstName photos'),
    UserModel.findOne({ _id: userId, blocked: false, deleted: false }).select('firstName photos'),
  ]);

  if (!sender || !receiver) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, httpStatus: 404, message: 'User not found or unavailable.' });
  }

  const [updatedRequest, updatedMatch] = await Promise.all([
    DateRequestModel.findByIdAndUpdate(
      requestId,
      { $set: { status: DATE_REQUEST_STATUS.ACCEPTED, respondedAt: currentTime } },
      { new: true },
    ),
    MatchModel.findByIdAndUpdate(
      request.matchRef,
      {
        $set: {
          status: MATCH_STATUS.DATE_PLANNED,
          datePlanned: requestDateTime,
          dateDetails: { dateType: request.dateType, location: request.location, dateRequestRef: request._id },
        },
      },
      { new: true },
    ),
  ]);

  UnifiedNotificationService({
    userId: request.senderRef,
    title: 'Date Confirmed',
    subtitle: `${receiver.firstName} accepted your ${request.dateType} date request!`,
    type: TYPE_OF_NOTIFICATIONS.DATE_REQUEST,
    reference: updatedRequest._id.toString(),
    payload: {
      event: 'DATE_REQUEST_ACCEPTED', matchId: updatedMatch._id.toString(), dateRequestId: updatedRequest._id.toString(),
    },
  }).catch(() => {});

  const addressParts = request.location.address.split(',').map((part) => part.trim());
  let city = null;
  let state = null;
  let zipCode = null;

  if (addressParts.length >= 2) {
    city = addressParts[addressParts.length - 3] || null;
    const stateZip = addressParts[addressParts.length - 2];
    if (stateZip) {
      const stateZipMatch = stateZip.match(/^([A-Z]{2})\s*(\d{5})?/);
      if (stateZipMatch) {
        [, state, zipCode] = stateZipMatch;
        zipCode = zipCode || null;
      }
    }
  }

  const getProfilePic = (user) => (user.photos?.length ? user.photos[0].url : null);

  return ResponseUtility.SUCCESS({
    message: "It's a date! Date request accepted successfully.",
    data: {
      requestId: updatedRequest._id,
      matchId: updatedMatch._id,
      status: DATE_REQUEST_STATUS.ACCEPTED,
      acceptedAt: currentTime,
      otherUser: { id: sender._id, firstName: sender.firstName, profilePicture: getProfilePic(sender) },
      yourProfile: { id: receiver._id, firstName: receiver.firstName, profilePicture: getProfilePic(receiver) },
      dateDetails: {
        dateType: request.dateType,
        dateTime: request.dateTime,
        location: {
          name: request.location.name,
          fullAddress: request.location.address,
          city,
          state,
          zipCode,
          placeId: request.location.placeId || null,
          coordinates: request.location.coordinates?.coordinates
            ? { lat: request.location.coordinates.coordinates[1], lng: request.location.coordinates.coordinates[0] }
            : null,
        },
        message: request.message || null,
      },
      calendarSync: {
        title: `Date with ${sender.firstName}`,
        description: `${request.dateType} at ${request.location.name}`,
        location: request.location.address,
        startTime: request.dateTime,
        endTime: new Date(new Date(request.dateTime).getTime() + 2 * 60 * 60 * 1000),
      },
    },
  });
};
