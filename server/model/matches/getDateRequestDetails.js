import DateRequestModel from './dateRequestSchema.js';
import { UserModel } from '../index.js';
import GetUserDetailsModel from '../like/getUserDetails.js';
import { ResponseUtility, PropsValidationUtility } from '../../utility/index.js';
import { SUCCESS_CODE } from '../../constants.js';

const DEFAULT_DATE_DURATION_HOURS = 2;

export default async ({ userId, requestId }) => {
  const { code, message } = PropsValidationUtility({ validProps: ['requestId'], sourceDocument: { requestId } });
  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message });
  }

  const request = await DateRequestModel.findOne({
    _id: requestId, $or: [{ senderRef: userId }, { receiverRef: userId }], deleted: false,
  }).lean();

  if (!request) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, httpStatus: 404, message: 'Date request not found.' });
  }

  const isSender = request.senderRef.toString() === userId.toString();
  const otherUserId = isSender ? request.receiverRef : request.senderRef;

  const [fullProfileResponse, currentUser] = await Promise.all([
    GetUserDetailsModel({ id: userId, profileUserId: otherUserId }),
    UserModel.findOne({ _id: userId, blocked: false, deleted: false }).select('firstName photos location'),
  ]);

  const fullOtherUserProfile = fullProfileResponse.data;

  if (!currentUser || !fullOtherUserProfile) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, httpStatus: 404, message: 'User not found or unavailable.' });
  }

  const addressParts = request.location?.address ? request.location.address.split(',').map((part) => part.trim()) : [];
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

  const currentTime = new Date();
  const dateTime = new Date(request.dateTime);
  const remainingTimeMs = dateTime.getTime() - currentTime.getTime();
  const remainingHours = Math.max(0, Math.floor(remainingTimeMs / (1000 * 60 * 60)));
  const isExpired = remainingTimeMs < 0;

  const calendarStartTime = new Date(request.dateTime);
  const calendarEndTime = new Date(calendarStartTime.getTime() + DEFAULT_DATE_DURATION_HOURS * 60 * 60 * 1000);

  const calendarEvent = {
    eventId: request._id,
    title: `Date with ${fullOtherUserProfile.firstName}`,
    description: request.message || 'Scheduled date',
    startTime: calendarStartTime,
    endTime: calendarEndTime,
    timezone: process.env.DEFAULT_TIMEZONE || 'UTC',
    location: request.location.address,
  };

  let mapLinks = null;
  if (request.location?.coordinates?.coordinates) {
    const [lng, lat] = request.location.coordinates.coordinates;
    mapLinks = {
      googleMaps: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      appleMaps: `http://maps.apple.com/?ll=${lat},${lng}`,
    };
  }

  return ResponseUtility.SUCCESS({
    message: 'Date request details fetched successfully.',
    data: {
      requestId: request._id,
      matchId: request.matchRef,
      yourProfile: {
        id: currentUser._id, firstName: currentUser.firstName, photos: currentUser.photos?.map((p) => p.url) || [],
      },
      otherUserProfile: fullOtherUserProfile,
      dateRequest: {
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
          mapLinks,
        },
        message: request.message || null,
        hasMessage: !!request.message,
      },
      status: request.status,
      role: isSender ? 'sender' : 'receiver',
      createdAt: request.createdOn,
      remainingHours,
      isExpired,
      calendarEvent,
      ...(request.respondedAt && { respondedAt: request.respondedAt, responseMessage: request.responseMessage || null }),
    },
  });
};
