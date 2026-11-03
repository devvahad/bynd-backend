import MatchModel from './schema.js';
import { UserModel } from '../index.js';
import { ResponseUtility, PropsValidationUtility } from '../../utility/index.js';
import { SUCCESS_CODE, MATCH_STATUS } from '../../constants.js';

export default async ({
  userId, matchId, dateType, dateTime, location, message,
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

  if (!location.name || !location.address) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Location must include name and address.' });
  }

  const currentUser = await UserModel.findOne({ _id: userId, blocked: false, deleted: false }).select('firstName photos age');
  if (!currentUser) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, httpStatus: 404, message: 'User not found.' });
  }

  const senderPrimaryPhoto = currentUser.photos?.find((p) => p.order === 0)?.url || null;

  const match = await MatchModel.findOne({
    _id: matchId, $or: [{ user1Ref: userId }, { user2Ref: userId }], status: MATCH_STATUS.ACTIVE, deleted: false,
  });

  if (!match) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, httpStatus: 404, message: 'Match not found or expired.' });
  }

  const otherUserId = match.user1Ref.toString() === userId.toString() ? match.user2Ref : match.user1Ref;
  const otherUser = await UserModel.findOne({ _id: otherUserId, blocked: false, deleted: false }).select('firstName photos firstDatePreferences age');

  if (!otherUser) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, httpStatus: 404, message: 'Match user not found.' });
  }

  const receiverPrimaryPhoto = otherUser.photos?.find((p) => p.order === 0)?.url || null;

  const addressParts = location.address.split(',').map((part) => part.trim());
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

  return ResponseUtility.SUCCESS({
    message: 'Date request preview generated successfully.',
    data: {
      yourProfile: {
        id: currentUser._id, firstName: currentUser.firstName, age: currentUser.age, profilePicture: senderPrimaryPhoto,
      },
      receiverProfile: {
        id: otherUser._id,
        firstName: otherUser.firstName,
        age: otherUser.age,
        profilePicture: receiverPrimaryPhoto,
        firstDatePreferences: otherUser.firstDatePreferences || [],
      },
      dateRequest: {
        dateType,
        dateTime: new Date(dateTime),
        location: {
          name: location.name,
          fullAddress: location.address,
          city,
          state,
          zipCode,
          placeId: location.placeId || null,
          coordinates: location.coordinates || null,
        },
        message: message || null,
        hasMessage: !!message,
      },
      matchId: match._id,
    },
  });
};
