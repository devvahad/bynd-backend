import { UserModel } from '../index.js';
import { ResponseUtility, PropsValidationUtility } from '../../utility/index.js';
import { SUCCESS_CODE } from '../../constants.js';

const MILES_EARTH_RADIUS = 3958.8;

const calculateDistanceMiles = (lat1, lon1, lat2, lon2) => {
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return MILES_EARTH_RADIUS * c;
};

export default async ({
  userId, matchUserId, locationLat, locationLng,
}) => {
  const { code, message } = PropsValidationUtility({
    validProps: ['matchUserId', 'locationLat', 'locationLng'],
    sourceDocument: { matchUserId, locationLat, locationLng },
  });
  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message });
  }

  const [currentUser, matchUser] = await Promise.all([
    UserModel.findOne({ _id: userId, blocked: false, deleted: false }).select('location firstDateDistance'),
    UserModel.findOne({ _id: matchUserId, blocked: false, deleted: false }).select('location firstDateDistance'),
  ]);

  if (!currentUser || !matchUser) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, httpStatus: 404, message: 'User not found.' });
  }

  if (!currentUser.location?.coordinates || !matchUser.location?.coordinates) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'User location data is not available.' });
  }

  const [currentUserLng, currentUserLat] = currentUser.location.coordinates;
  const [matchUserLng, matchUserLat] = matchUser.location.coordinates;

  const distanceFromCurrentUser = calculateDistanceMiles(currentUserLat, currentUserLng, locationLat, locationLng);
  const distanceFromMatchUser = calculateDistanceMiles(matchUserLat, matchUserLng, locationLat, locationLng);

  const currentUserMaxDistance = Math.min(currentUser.firstDateDistance || 30, 30);
  const matchUserMaxDistance = Math.min(matchUser.firstDateDistance || 30, 30);

  const isWithinCurrentUserRange = distanceFromCurrentUser <= currentUserMaxDistance;
  const isWithinMatchUserRange = distanceFromMatchUser <= matchUserMaxDistance;
  const isValid = isWithinCurrentUserRange && isWithinMatchUserRange;

  let validationMessage = 'Location is within travel range for both users.';
  if (!isValid) {
    if (!isWithinCurrentUserRange && !isWithinMatchUserRange) {
      validationMessage = `Location is too far for both users. Must be within ${currentUserMaxDistance} miles for you and ${matchUserMaxDistance} miles for your match.`;
    } else if (!isWithinCurrentUserRange) {
      validationMessage = `Location is too far from you. Must be within ${currentUserMaxDistance} miles.`;
    } else {
      validationMessage = `Location is too far from your match. Must be within ${matchUserMaxDistance} miles.`;
    }
  }

  return ResponseUtility.SUCCESS({
    message: validationMessage,
    data: {
      isValid,
      distances: {
        fromYou: { miles: Math.round(distanceFromCurrentUser * 10) / 10, maxAllowed: currentUserMaxDistance, withinRange: isWithinCurrentUserRange },
        fromMatch: { miles: Math.round(distanceFromMatchUser * 10) / 10, maxAllowed: matchUserMaxDistance, withinRange: isWithinMatchUserRange },
      },
      location: { latitude: locationLat, longitude: locationLng },
    },
  });
};
