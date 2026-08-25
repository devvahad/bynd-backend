import DateRequestModel from './dateRequestSchema.js';
import { ResponseUtility, PropsValidationUtility } from '../../utility/index.js';
import { SUCCESS_CODE, FIRST_DATE_ACTIVITIES, DATE_REQUEST_STATUS } from '../../constants.js';

export default async ({
  userId, requestId, dateType, dateTime, location, message,
}) => {
  const { code, message: validationMessage } = PropsValidationUtility({ validProps: ['requestId'], sourceDocument: { requestId } });
  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message: validationMessage });
  }

  const request = await DateRequestModel.findOne({
    _id: requestId, senderRef: userId, status: DATE_REQUEST_STATUS.PENDING, deleted: false,
  });

  if (!request) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, httpStatus: 404, message: 'Date request not found or cannot be edited.' });
  }

  const currentTime = new Date();
  if (new Date(request.dateTime) < currentTime) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Cannot edit an expired date request.' });
  }

  const updateData = {};

  if (dateType) {
    if (!FIRST_DATE_ACTIVITIES.includes(dateType)) {
      throw ResponseUtility.GENERIC_ERR({ code: 400, message: `Invalid date type. Must be one of: ${FIRST_DATE_ACTIVITIES.join(', ')}` });
    }
    updateData.dateType = dateType;
  }

  if (dateTime) {
    const selectedDateTime = new Date(dateTime);
    const earliestTime = new Date(currentTime.getTime() + 12 * 60 * 60 * 1000);
    const maxDate = new Date(currentTime.getTime() + 14 * 24 * 60 * 60 * 1000);

    if (selectedDateTime < earliestTime) {
      throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Date must be at least 12 hours from now.' });
    }
    if (selectedDateTime > maxDate) {
      throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Date cannot be more than 14 days from now.' });
    }
    updateData.dateTime = selectedDateTime;
  }

  if (location) {
    if (!location.name || !location.address) {
      throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Location must include name and address.' });
    }

    updateData.location = {
      name: location.name,
      address: location.address,
      placeId: location.placeId || null,
      // Preserve existing coordinates when the edit doesn't supply new ones
      // (the coordinates sub-field is required, so it must never be dropped).
      coordinates: location.coordinates
        ? { type: 'Point', coordinates: [location.coordinates.lng, location.coordinates.lat] }
        : request.location.coordinates,
    };
  }

  if (message !== undefined) {
    if (message && message.length > 200) {
      throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Message cannot exceed 200 characters.' });
    }
    updateData.message = message || null;
  }

  const updatedRequest = await DateRequestModel.findByIdAndUpdate(requestId, { $set: updateData }, { new: true, runValidators: true });

  return ResponseUtility.SUCCESS({
    message: 'Date request updated successfully.',
    data: {
      requestId: updatedRequest._id,
      dateType: updatedRequest.dateType,
      dateTime: updatedRequest.dateTime,
      location: { name: updatedRequest.location.name, address: updatedRequest.location.address },
      message: updatedRequest.message,
      updatedAt: updatedRequest.updatedOn,
    },
  });
};
